// RevenueCat → Supabase bridge.
//
// The app unlocks PRO from the receipt on the device the moment a purchase
// completes, but the server gates sharing through has_active_pro(), which reads
// the profiles table. This function is what keeps that row honest: renewals,
// cancellations, refunds and expirations all arrive here without the app being
// open.
//
// Deploy:  supabase functions deploy revenuecat-webhook --no-verify-jwt
// Secret:  supabase secrets set REVENUECAT_WEBHOOK_SECRET=<any long random string>
// Then in RevenueCat → Project settings → Integrations → Webhooks:
//   URL:            https://<project>.supabase.co/functions/v1/revenuecat-webhook
//   Authorization:  the same secret
import { createClient } from 'jsr:@supabase/supabase-js@2';

// app_user_id is the Supabase user id, because the app calls
// Purchases.logIn(session.user.id) right after sign-in.
interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  expiration_at_ms?: number | null;
  // Present on the events that end access early.
  cancel_reason?: string | null;
}

// Everything that leaves the subscription unusable from now on. Cancellation is
// deliberately absent: a cancelled plan still runs to the end of its period.
const ENDING = new Set(['EXPIRATION', 'REFUND', 'SUBSCRIPTION_PAUSED']);

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

  // Anonymous ids appear when someone opens the paywall before signing in;
  // there is no profile to update for them.
  if (event.app_user_id.startsWith('$RCAnonymousID:')) {
    return new Response('ignored: anonymous', { status: 200 });
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
    // A non-2xx tells RevenueCat to retry, which is what we want for a blip.
    return new Response('update failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
