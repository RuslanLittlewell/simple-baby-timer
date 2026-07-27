import { type LanguageCode } from '@/i18n';

import { REGIMES } from './data';
import { REGIME_STRINGS } from './data-i18n';
import { type RegimeAge } from './types';

// Returns the schedule dataset with all content strings translated into the
// given language; unknown strings fall back to the Russian source.
export function localizeRegimes(lang: LanguageCode): RegimeAge[] {
  // The detailed schedule dataset is currently shared by the two closely
  // related source languages; all surrounding UI is translated separately.
  if (lang === 'ru' || lang === 'uk') return REGIMES;
  const tr = (s: string) => (s ? (REGIME_STRINGS[s]?.[lang] ?? s) : s);
  return REGIMES.map((age) => ({
    age: tr(age.age),
    timed: age.timed,
    source: age.source,
    summary: age.summary
      ? {
          sleep24: tr(age.summary.sleep24),
          naps: tr(age.summary.naps),
          wakeWindow: tr(age.summary.wakeWindow),
          wakeUp: tr(age.summary.wakeUp),
          nightSleep: tr(age.summary.nightSleep),
          features: tr(age.summary.features),
        }
      : null,
    variants: age.variants.map((variant) => ({
      name: tr(variant.name),
      steps: variant.steps.map((step) => ({
        ...step,
        action: tr(step.action),
        note: tr(step.note),
      })),
    })),
  }));
}
