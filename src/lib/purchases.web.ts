import type {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

export const PACKAGE_TYPE = {
  MONTHLY: '$rc_monthly',
  TWO_MONTH: '$rc_two_month',
  THREE_MONTH: '$rc_three_month',
  SIX_MONTH: '$rc_six_month',
  ANNUAL: '$rc_annual',
} as const;

export const purchasesSupported = false;

export function configurePurchases(): void {}

export async function identifyPurchaser(_userId: string): Promise<void> {}

export async function forgetPurchaser(): Promise<void> {}

export interface ProEntitlement {
  active: boolean;
  expiresAt?: number;
  renewsAt?: number;
}

export function entitlementFrom(_info: CustomerInfo): ProEntitlement {
  return { active: false };
}

export async function fetchEntitlement(): Promise<ProEntitlement> {
  return { active: false };
}

export async function fetchOffering(): Promise<PurchasesOffering | null> {
  return null;
}

export class PurchaseCancelledError extends Error {
  constructor() {
    super('purchase cancelled');
    this.name = 'PurchaseCancelledError';
  }
}

export async function purchase(_pack: PurchasesPackage): Promise<ProEntitlement> {
  return { active: false };
}

export async function restorePurchases(): Promise<ProEntitlement> {
  return { active: false };
}

export const freeTrialDays = (pack: PurchasesPackage): number | null => {
  const intro = pack.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const unitDays = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }[intro.periodUnit] ?? 0;
  const days = unitDays * intro.periodNumberOfUnits;
  return days > 0 ? days : null;
};
