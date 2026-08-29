import { type LanguageCode } from '@/i18n';

import { REGIMES } from './data';
import { REGIME_STRINGS } from './data-i18n';
import { DEVELOPMENTAL_GAME_STRINGS } from './developmental-games-i18n';
import { type RegimeAge } from './types';



export function localizeRegimes(lang: LanguageCode): RegimeAge[] {
  const tr = (key: string) =>
    REGIME_STRINGS[lang][key] ??
    DEVELOPMENTAL_GAME_STRINGS[lang][key] ??
    REGIME_STRINGS.ru[key] ??
    DEVELOPMENTAL_GAME_STRINGS.ru[key] ??
    key;
  const localizeGameGroups = (groups?: RegimeAge['developmentalGameGroups']) =>
    groups?.map((group) =>
      group.map((game) => ({
        id: game.id,
        title: tr(game.title),
        instruction: tr(game.instruction),
      })),
    );
  return REGIMES.map((age) => ({
    age: tr(age.age),
    timed: age.timed,
    source: age.source,
    developmentalGameGroups: localizeGameGroups(age.developmentalGameGroups),
    developmentalGamesGuidance: age.developmentalGamesGuidance
      ? tr(age.developmentalGamesGuidance)
      : undefined,
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
      developmentalGameGroups: localizeGameGroups(variant.developmentalGameGroups),
      steps: variant.steps.map((step) => ({
        ...step,
        time: tr(step.time),
        action: tr(step.action),
        note: tr(step.note),
      })),
    })),
  }));
}
