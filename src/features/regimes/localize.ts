import { type LanguageCode } from '@/i18n';

import { REGIMES } from './data';
import { REGIME_STRINGS } from './data-i18n';
import { type RegimeAge } from './types';



export function localizeRegimes(lang: LanguageCode): RegimeAge[] {
  const tr = (key: string) => REGIME_STRINGS[lang][key] ?? REGIME_STRINGS.ru[key] ?? key;
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
        time: tr(step.time),
        action: tr(step.action),
        note: tr(step.note),
      })),
    })),
  }));
}
