import { type LanguageCode } from '@/i18n';

export const MAX_CHILDREN = 5;

export const CHILD_GRADIENT_KEYS = ['sky', 'rose', 'mint', 'sun', 'lilac'] as const;

export type ChildGradientKey = (typeof CHILD_GRADIENT_KEYS)[number];

export interface Child {
  id: string;
  name: string;
  gradientKey: ChildGradientKey;
  
  birthday?: number;
  
  proEnabled?: boolean;
  
  remoteId?: string;
  /** True only when the current account created the cloud profile. */
  isOwner?: boolean;
}

export const isChildGradientKey = (value: unknown): value is ChildGradientKey =>
  CHILD_GRADIENT_KEYS.includes(value as ChildGradientKey);

const DAY_MS = 86_400_000;


function ageParts(birthdayMs: number, now = Date.now()): { months: number; days: number; totalDays: number } {
  const b = new Date(birthdayMs);
  const t = new Date(now);
  const totalDays = Math.max(0, Math.floor((t.getTime() - birthdayMs) / DAY_MS));

  let months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  let days = t.getDate() - b.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(t.getFullYear(), t.getMonth(), 0).getDate();
  }
  if (months < 0) months = 0;
  return { months, days, totalDays };
}

interface AgeWords {
  day: [string, string, string];
  month: [string, string, string];
}


const AGE_WORDS: Record<LanguageCode, AgeWords> = {
  en: { day: ['day', 'days', 'days'], month: ['month', 'months', 'months'] },
  ru: { day: ['день', 'дня', 'дней'], month: ['месяц', 'месяца', 'месяцев'] },
  ua: { day: ['день', 'дні', 'днів'], month: ['місяць', 'місяці', 'місяців'] },
  pl: { day: ['dzień', 'dni', 'dni'], month: ['miesiąc', 'miesiące', 'miesięcy'] },
  es: { day: ['día', 'días', 'días'], month: ['mes', 'meses', 'meses'] },
  fr: { day: ['jour', 'jours', 'jours'], month: ['mois', 'mois', 'mois'] },
  de: { day: ['Tag', 'Tage', 'Tage'], month: ['Monat', 'Monate', 'Monate'] },
  pt: { day: ['dia', 'dias', 'dias'], month: ['mês', 'meses', 'meses'] },
  it: { day: ['giorno', 'giorni', 'giorni'], month: ['mese', 'mesi', 'mesi'] },
};

function plural(n: number, lang: LanguageCode, forms: [string, string, string]): string {
  const slavic = lang === 'ru' || lang === 'ua' || lang === 'pl';
  if (!slavic) return n === 1 ? forms[0] : forms[1];
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}


export function formatAge(birthdayMs: number, lang: LanguageCode, now = Date.now()): string {
  const { months, days, totalDays } = ageParts(birthdayMs, now);
  const words = AGE_WORDS[lang];
  if (months <= 0) return `${totalDays} ${plural(totalDays, lang, words.day)}`;
  const parts = [`${months} ${plural(months, lang, words.month)}`];
  if (days > 0) parts.push(`${days} ${plural(days, lang, words.day)}`);
  return parts.join(' ');
}

export function regimeIndexForBirthday(birthdayMs: number, now = Date.now()): number {
  const months = ageParts(birthdayMs, now).totalDays / 30.44;
  if (months < 1.5) return 0;
  if (months < 3) return 1;
  if (months < 5) return 2;
  if (months < 7) return 3;
  if (months < 10) return 4;
  if (months < 12) return 5;
  if (months < 15) return 6;
  if (months < 18) return 7;
  return 8;
}
