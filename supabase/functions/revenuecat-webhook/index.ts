import { createClient } from 'jsr:@supabase/supabase-js@2';

import { syncProfilePro } from '../_shared/revenuecat.ts';

interface RevenueCatEvent {
  type: string;
  app_user_id?: string;
  expiration_at_ms?: number | null;
  // A TRANSFER moves purchases between app users; both sides change.
  transferred_from?: string[];
  transferred_to?: string[];
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
  if (!event?.type) return new Response('bad payload', { status: 400 });
  if (event.type === 'TEST') return new Response('ok: test', { status: 200 });

  // Anonymous RevenueCat ids and anything else that is not one of our users is skipped.
  const appUserIds = [
    ...new Set([event.app_user_id, ...(event.transferred_from ?? []), ...(event.transferred_to ?? [])]),
  ].filter((id): id is string => !!id && UUID_PATTERN.test(id));
  if (!appUserIds.length) return new Response('ignored: unmapped app user', { status: 200 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const apiKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (apiKey) {
    try {
      for (const id of appUserIds) await syncProfilePro(admin, id, apiKey);
    } catch (error) {
      console.error('profile sync failed', event.type, appUserIds, error instanceof Error ? error.message : error);
      // A 5xx makes RevenueCat retry the delivery.
      return new Response('sync failed', { status: 500 });
    }
    return new Response('ok', { status: 200 });
  }

  // Without the API key only the event itself is known. An event without an expiry
  // (a transfer, for one) says nothing about access, so it must not switch Pro off.
  if (!event.app_user_id || !UUID_PATTERN.test(event.app_user_id)) {
    return new Response('ignored: no subscriber', { status: 200 });
  }
  if (!event.expiration_at_ms && !ENDING.has(event.type)) {
    return new Response('ignored: no expiry', { status: 200 });
  }
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms) : null;
  const active =
    !ENDING.has(event.type) && expiresAt !== null && expiresAt.getTime() > Date.now();

  const { error } = await admin
    .from('profiles')
    .update({
      pro_active: active,
      pro_renews_at: expiresAt?.toISOString() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.app_user_id);

  if (error) {
    console.error('profile update failed', event.type, event.app_user_id, error.message);
    return new Response('update failed', { status: 500 });
  }

  return new Response('ok', { status: 200 });
});
