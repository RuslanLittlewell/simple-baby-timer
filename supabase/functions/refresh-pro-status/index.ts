import { createClient } from 'jsr:@supabase/supabase-js@2';

import { syncProfilePro } from '../_shared/revenuecat.ts';

// Called by the app right after a purchase or restore, so Pro switches on
// without waiting for the RevenueCat webhook.
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok');

  const auth = request.headers.get('Authorization');
  if (!auth) return new Response('Unauthorized', { status: 401 });

  const apiKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!apiKey) return new Response('not configured', { status: 503 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const authClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: userError } = await authClient.auth.getUser();
  if (userError || !user) return new Response('Unauthorized', { status: 401 });

  try {
    const pro = await syncProfilePro(createClient(url, serviceKey), user.id, apiKey);
    return Response.json(pro);
  } catch (error) {
    console.error('pro refresh failed', user.id, error instanceof Error ? error.message : error);
    return new Response('refresh failed', { status: 502 });
  }
});
