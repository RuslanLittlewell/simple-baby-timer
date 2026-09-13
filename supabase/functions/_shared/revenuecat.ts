import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const ENTITLEMENT = 'pro';

interface RevenueCatEntitlement {
  expires_date: string | null;
  grace_period_expires_date?: string | null;
}

export interface ProfilePro {
  active: boolean;
  renewsAt: string | null;
}

/** The subscriber's `pro` entitlement as RevenueCat has it right now. */
async function fetchRevenueCatPro(appUserId: string, apiKey: string): Promise<ProfilePro> {
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error(`RevenueCat responded ${response.status}`);
  const { subscriber } = (await response.json()) as {
    subscriber?: { entitlements?: Record<string, RevenueCatEntitlement> };
  };
  const entitlement = subscriber?.entitlements?.[ENTITLEMENT];
  if (!entitlement) return { active: false, renewsAt: null };
  // A lifetime purchase never expires, which the profile stores as no renewal date.
  if (entitlement.expires_date === null) return { active: true, renewsAt: null };
  const endsAt = Math.max(
    Date.parse(entitlement.expires_date),
    entitlement.grace_period_expires_date ? Date.parse(entitlement.grace_period_expires_date) : 0,
  );
  return { active: endsAt > Date.now(), renewsAt: new Date(endsAt).toISOString() };
}

/** Copies the RevenueCat entitlement into the profile, which is all the app reads. */
export async function syncProfilePro(
  admin: SupabaseClient,
  appUserId: string,
  apiKey: string,
): Promise<ProfilePro> {
  const pro = await fetchRevenueCatPro(appUserId, apiKey);
  const { error } = await admin
    .from('profiles')
    .update({ pro_active: pro.active, pro_renews_at: pro.renewsAt, updated_at: new Date().toISOString() })
    .eq('id', appUserId);
  if (error) throw new Error(error.message);
  return pro;
}
