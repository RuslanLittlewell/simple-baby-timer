












import { createClient } from 'jsr:@supabase/supabase-js@2';



interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  expiration_at_ms?: number | null;
  
  cancel_reason?: string | null;
}



const ENDING = new Set(['EXPIRATION', 'REFUND', 'SUBSCRIPTION_PAUSED']);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const expected = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!expected || request.headers.get('Authorization') !== expected) {
    return new Response('unauthorized', { status: 401 });
  }

  let event: RevenueCatEvent;
  try {
    ({ event } = await request.json());
  } catch {
    return new Response('bad payload', { status: 400 });
  }
  if (!event?.app_user_id) return new Response('no app_user_id', { status: 400 });

  if (event.type === 'TEST') {
    return new Response('ok: test', { status: 200 });
  }

  
  
  if (event.app_user_id.startsWith('$RCAnonymousID:')) {
    return new Response('ignored: anonymous', { status: 200 });
  }
  if (!UUID_PATTERN.test(event.app_user_id)) {
    return new Response('ignored: unmapped app user', { status: 200 });
  }

  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
  const active =
    !ENDING.has(event.type) && expiresAt !== null && expiresAt.getTime() > Date.now();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: event.app_user_id,
        pro_active: active,
        pro_renews_at: expiresAt?.toISOString() ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (error) {
    console.error('profile update failed', event.type, event.app_user_id, error.message);
    
    return new Response('update failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
