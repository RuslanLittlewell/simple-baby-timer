import { isRunningInExpoGo } from 'expo';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Purchases, {
  PACKAGE_TYPE,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

export { PACKAGE_TYPE };




// Each store has its own RevenueCat public key: `appl_…` for the App Store, `goog_…` for Google Play.
const API_KEY =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  }) ?? '';
const isTestStoreKey = API_KEY.startsWith('test_');



const ENTITLEMENT = 'pro';

export const purchasesSupported =
  !isRunningInExpoGo() &&
  API_KEY.length > 0 &&
  (__DEV__ || !isTestStoreKey);

let configured = false;

export function configurePurchases(): void {
  if (!purchasesSupported || configured) return;
  Purchases.configure({ apiKey: API_KEY });
  configured = true;
}




export async function identifyPurchaser(userId: string): Promise<void> {
  if (!purchasesSupported) return;
  try {
    await Purchases.logIn(userId);
  } catch {
    
    
  }
}

export async function forgetPurchaser(): Promise<void> {
  if (!purchasesSupported) return;
  try {
    await Purchases.logOut();
  } catch {
  }
}

export interface ProEntitlement {
  active: boolean;
  
  expiresAt?: number;
  
  
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



export async function restorePurchases(): Promise<ProEntitlement> {
  if (!purchasesSupported) return { active: false };
  return entitlementFrom(await Purchases.restorePurchases());
}

const PLAY_SUBSCRIPTIONS_URL = 'https://play.google.com/store/account/subscriptions';

// Cancelling happens in the store the subscription was bought in, never in the app.
export async function openSubscriptionManagement(): Promise<void> {
  if (!purchasesSupported) return;
  if (Platform.OS === 'ios') {
    await Purchases.showManageSubscriptions();
    return;
  }
  const { managementURL } = await Purchases.getCustomerInfo().catch(() => ({
    managementURL: null,
  }));
  await Linking.openURL(managementURL ?? PLAY_SUBSCRIPTIONS_URL);
}



export const freeTrialDays = (pack: PurchasesPackage): number | null => {
  const intro = pack.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unitDays = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }[intro.periodUnit] ?? 0;
  const days = unitDays * intro.periodNumberOfUnits;
  return days > 0 ? days : null;
};
