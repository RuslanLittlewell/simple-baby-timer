export const MAX_CHILDREN = 5;

export const CHILD_GRADIENT_KEYS = ['sky', 'rose', 'mint', 'sun', 'lilac'] as const;

export type ChildGradientKey = (typeof CHILD_GRADIENT_KEYS)[number];

export interface Child {
  id: string;
  name: string;
  gradientKey: ChildGradientKey;
}

export const isChildGradientKey = (value: unknown): value is ChildGradientKey =>
  CHILD_GRADIENT_KEYS.includes(value as ChildGradientKey);
