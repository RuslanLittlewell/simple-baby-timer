import { createClient } from 'npm:@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'npm:jose@5';

type Track = 'session' | 'feeding';
type Action = 'start' | 'end';

const BUNDLE_ID = 'com.littlewell.babylifetracker';
const APNS_TOPIC = `${BUNDLE_ID}.push-type.liveactivity`;

const titles: Record<string, Record<string, string>> = {
  en: { settling: 'Falling asleep', sleep: 'Sleep', feeding: 'Feeding', awake: 'Awake' },
  ru: { settling: 'Засыпание', sleep: 'Сон', feeding: 'Кормление', awake: 'Бодрствование' },
  ua: { settling: 'Засинання', sleep: 'Сон', feeding: 'Годування', awake: 'Неспання' },
  pl: { settling: 'Zasypianie', sleep: 'Sen', feeding: 'Karmienie', awake: 'Czuwanie' },
  es: { settling: 'Conciliando el sueño', sleep: 'Sueño', feeding: 'Alimentación', awake: 'Despierto' },
  fr: { settling: 'Endormissement', sleep: 'Sommeil', feeding: 'Repas', awake: 'Éveil' },
  de: { settling: 'Einschlafen', sleep: 'Schlaf', feeding: 'Füttern', awake: 'Wach' },
  pt: { settling: 'Adormecendo', sleep: 'Sono', feeding: 'Alimentação', awake: 'Acordado' },
  it: { settling: 'Addormentamento', sleep: 'Sonno', feeding: 'Poppata', awake: 'Sveglio' },
};

const icons: Record<string, string> = {
  settling: 'la-settling', sleep: 'la-sleep', feeding: 'la-feed', awake: 'la-awake',
};
const tints: Record<string, string> = {
  settling: '#69C6F0', sleep: '#4C8DFF', feeding: '#F4C95D', awake: '#C6F23A',
};

let cachedJwt: { value: string; expiresAt: number } | null = null;

async function apnsJwt() {
  if (cachedJwt && cachedJwt.expiresAt > Date.now()) return cachedJwt.value;
  const keyId = Deno.env.get('APNS_KEY_ID')!;
  const teamId = Deno.env.get('APNS_TEAM_ID')!;
  const privateKey = Deno.env.get('APNS_PRIVATE_KEY')!.replace(/\\n/g, '\n');
  const key = await importPKCS8(privateKey, 'ES256');
  const value = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .sign(key);
  cachedJwt = { value, expiresAt: Date.now() + 50 * 60_000 };
  return value;
}

async function sendApns(token: string, payload: unknown) {
  const production = Deno.env.get('APNS_ENVIRONMENT') === 'production';
  const host = production ? 'https://api.push.apple.com' : 'https://api.sandbox.push.apple.com';
  const response = await fetch(`${host}/3/device/${token}`, {
    method: 'POST',
    headers: {
      authorization: `bearer ${await apnsJwt()}`,
      'apns-topic': APNS_TOPIC,
      'apns-push-type': 'liveactivity',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return { ok: response.ok, status: response.status, body: await response.text() };
}

const stateFor = (kind: string, startedAt: number, locale: string) => ({
  title: titles[locale]?.[kind] ?? titles.en[kind] ?? kind,
  subtitle: null,
  timerEndDateInMilliseconds: null,
  progress: null,
  imageName: icons[kind],
  dynamicIslandImageName: icons[kind],
  smallImageName: null,
  elapsedTimerStartDateInMilliseconds: startedAt,
  currentStep: null,
  totalSteps: null,
});

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok');
  try {
    const auth = request.headers.get('Authorization');
    if (!auth) return new Response('Unauthorized', { status: 401 });
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) return new Response('Unauthorized', { status: 401 });

    const body = await request.json() as {
      action: Action; childId: string; track: Track; installationId: string;
      kind?: string; startedAt?: number;
    };
    if (!['start', 'end'].includes(body.action) || !['session', 'feeding'].includes(body.track)) {
      return new Response('Invalid payload', { status: 400 });
    }

    const admin = createClient(url, serviceKey);
    const { data: membership } = await admin
      .from('child_members').select('child_id').eq('child_id', body.childId).eq('user_id', user.id).maybeSingle();
    if (!membership) return new Response('Forbidden', { status: 403 });

    const timestamp = Math.floor(Date.now() / 1000);
    const { data: instances } = await admin
      .from('live_activity_instances')
      .select('user_id, installation_id, update_token')
      .eq('child_id', body.childId)
      .eq('track', body.track)
      .neq('installation_id', body.installationId);

    const results: unknown[] = [];
    for (const instance of instances ?? []) {
      const result = await sendApns(instance.update_token, {
        aps: { event: 'end', timestamp, 'dismissal-date': timestamp },
      });
      results.push(result);
    }
    if ((instances ?? []).length) {
      await admin.from('live_activity_instances')
        .delete().eq('child_id', body.childId).eq('track', body.track)
        .neq('installation_id', body.installationId);
    }

    if (body.action === 'start') {
      if (!body.kind || !Number.isFinite(body.startedAt)) {
        return new Response('Missing activity state', { status: 400 });
      }
      const { data: members } = await admin.from('child_members').select('user_id').eq('child_id', body.childId);
      const memberIds = (members ?? []).map((row) => row.user_id);
      if (memberIds.length) {
        const { data: devices } = await admin
          .from('live_activity_devices')
          .select('installation_id, push_to_start_token, locale')
          .in('user_id', memberIds)
          .neq('installation_id', body.installationId);
        for (const device of devices ?? []) {
          const state = stateFor(body.kind, body.startedAt!, device.locale);
          const result = await sendApns(device.push_to_start_token, {
            aps: {
              event: 'start',
              timestamp,
              'attributes-type': 'LiveActivityAttributes',
              attributes: {
                name: `babytimer|${body.childId}|${body.track}`,
                backgroundColor: '#000000',
                titleColor: '#FFFFFF',
                subtitleColor: '#B0B4BA',
                progressViewTint: tints[body.kind],
                progressViewLabelColor: '#FFFFFF',
                deepLinkUrl: 'babytimer://',
                timerType: 'digital',
                paddingDetails: { vertical: 6, horizontal: 10 },
                imageWidth: 28,
                imageHeight: 28,
              },
              'content-state': state,
              'input-push-token': 1,
            },
          });
          results.push(result);
        }
      }
    }

    return Response.json({ ok: true, deliveries: results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
});
