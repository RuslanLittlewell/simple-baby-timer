import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

// RevenueCat's public SDK key. Safe to ship — it can only read offerings and
// make purchases on behalf of the signed-in user; nothing can be granted with
// it. Set it in .env and in EAS (`eas env:create`), like the Supabase keys.
const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';

// The entitlement configured in the RevenueCat dashboard. Every subscription
// product is attached to it, so the app never checks product ids directly.
const ENTITLEMENT = 'pro';

export const purchasesSupported = Platform.OS === 'ios' && IOS_API_KEY.length > 0;

let configured = false;

export function configurePurchases(): void {
  if (!purchasesSupported || configured) return;
  Purchases.configure({ apiKey: IOS_API_KEY });
  configured = true;
}

// Ties purchases to the Supabase account rather than the device, so a
// subscription follows the parent to their second phone — and to the other
// parent's phone, which is the whole point of this app.
export async function identifyPurchaser(userId: string): Promise<void> {
  if (!purchasesSupported) return;
  try {
    await Purchases.logIn(userId);
  } catch {
    // A failed identify only means purchases stay on the anonymous id; the
    // next sync pass tries again.
  }
}

export async function forgetPurchaser(): Promise<void> {
  if (!purchasesSupported) return;
  try {
    await Purchases.logOut();
  } catch {
    // Already anonymous.
  }
}

export interface ProEntitlement {
  active: boolean;
  // Present while a subscription or its free trial is running.
  expiresAt?: number;
  // Set when the subscription renews by itself; absent for a trial that has
  // not converted or a plan the user cancelled.
  renewsAt?: number;
}

export function entitlementFrom(info: CustomerInfo): ProEntitlement {
  const pro = info.entitlements.active[ENTITLEMENT];
  if (!pro) return { active: false };
  const expires = pro.expirationDateMillis ?? undefined;
  return {
    active: true,
    expiresAt: pro.willRenew ? undefined : (expires ?? undefined),
    renewsAt: pro.willRenew ? (expires ?? undefined) : undefined,
  };
}

export async function fetchEntitlement(): Promise<ProEntitlement> {
  if (!purchasesSupported) return { active: false };
  return entitlementFrom(await Purchases.getCustomerInfo());
}

// The offering marked "current" in the RevenueCat dashboard. Prices, duration
// and any introductory offer come from the store, already localised — nothing
// about them is hardcoded in the app.
export async function fetchOffering(): Promise<PurchasesOffering | null> {
  if (!purchasesSupported) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export class PurchaseCancelledError extends Error {
  constructor() {
    super('purchase cancelled');
    this.name = 'PurchaseCancelledError';
  }
}

export async function purchase(pack: PurchasesPackage): Promise<ProEntitlement> {
  const { customerInfo } = await Purchases.purchasePackage(pack).catch((error: unknown) => {
    const code = (error as { code?: string })?.code;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      throw new PurchaseCancelledError();
    }
    throw error;
  });
  return entitlementFrom(customerInfo);
}

// Required by App Store review: a way to get a subscription back on a new
// device without paying twice.
export async function restorePurchases(): Promise<ProEntitlement> {
  if (!purchasesSupported) return { active: false };
  return entitlementFrom(await Purchases.restorePurchases());
}

// True when the package's first period is free — an Apple introductory offer.
// The paywall labels such a package as a trial instead of listing a price.
export const freeTrialDays = (pack: PurchasesPackage): number | null => {
  const intro = pack.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unitDays = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }[intro.periodUnit] ?? 0;
  const days = unitDays * intro.periodNumberOfUnits;
  return days > 0 ? days : null;
};
