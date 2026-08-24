import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';




const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const isTestStoreKey = IOS_API_KEY.startsWith('test_');



const ENTITLEMENT = 'pro';

export const purchasesSupported =
  Platform.OS === 'ios' &&
  IOS_API_KEY.length > 0 &&
  (__DEV__ || !isTestStoreKey);

let configured = false;

export function configurePurchases(): void {
  if (!purchasesSupported || configured) return;
  Purchases.configure({ apiKey: IOS_API_KEY });
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

export async function fetchEntitlement(): Promise<ProEntitlement> {
  if (!purchasesSupported) return { active: false };
  return entitlementFrom(await Purchases.getCustomerInfo());
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



export const freeTrialDays = (pack: PurchasesPackage): number | null => {
  const intro = pack.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unitDays = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }[intro.periodUnit] ?? 0;
  const days = unitDays * intro.periodNumberOfUnits;
  return days > 0 ? days : null;
};
