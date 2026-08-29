import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  DEVELOPMENTAL_GAME_IDS,
  FIVE_TO_SIX_MONTH_GAME_IDS,
  FIVE_TO_SIX_MONTH_GAME_GROUPS,
  SEVEN_TO_NINE_MONTH_GAME_IDS,
  SEVEN_TO_NINE_MONTH_THREE_NAP_GAME_GROUPS,
  SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS,
  SIX_TO_TWELVE_WEEK_GAME_GROUPS,
  TEN_TO_TWELVE_MONTH_GAME_IDS,
  TEN_TO_TWELVE_MONTH_GAME_GROUPS,
  TEN_TO_TWELVE_MONTH_GUIDANCE_KEY,
  THREE_TO_FOUR_MONTH_GAME_IDS,
  TWELVE_TO_FIFTEEN_MONTH_GAME_IDS,
  FIFTEEN_TO_EIGHTEEN_MONTH_GAME_IDS,
  EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_IDS,
  EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_GROUPS,
  EIGHTEEN_TO_TWENTY_FOUR_MONTH_GUIDANCE_KEY,
  FIFTEEN_TO_EIGHTEEN_MONTH_GAME_GROUPS,
  FIFTEEN_TO_EIGHTEEN_MONTH_GUIDANCE_KEY,
  TWELVE_TO_FIFTEEN_MONTH_GAME_GROUPS,
  TWELVE_TO_FIFTEEN_MONTH_GUIDANCE_KEY,
  THREE_TO_FOUR_MONTH_GAME_GROUPS,
  assignGamesToAwakeFills,
  resolveDevelopmentalGameGroups,
} from '../src/features/regimes/developmental-games.ts';
import { DEVELOPMENTAL_GAME_STRINGS } from '../src/features/regimes/developmental-games-i18n.ts';

const languages = ['en', 'ru', 'ua', 'pl', 'es', 'fr', 'de', 'pt', 'it'];

test('every configured 6–12 week wake block receives two or three games', () => {
  assert.equal(SIX_TO_TWELVE_WEEK_GAME_GROUPS.length, 6);
  assert.ok(SIX_TO_TWELVE_WEEK_GAME_GROUPS.every(
    (group) => group.length >= 2 && group.length <= 3,
  ));
});

test('the first five wake blocks cover all ten supplied games', () => {
  const covered = new Set(
    SIX_TO_TWELVE_WEEK_GAME_GROUPS.slice(0, 5).flat().map((game) => game.id),
  );
  assert.deepEqual([...covered].sort(), [...DEVELOPMENTAL_GAME_IDS].sort());
});

test('wake block assignment is deterministic and cycles on overflow', () => {
  const fills = Array.from({ length: 8 }, (_, index) => ({
    startMin: index * 60,
    endMin: (index + 1) * 60,
  }));
  const assigned = assignGamesToAwakeFills(fills, SIX_TO_TWELVE_WEEK_GAME_GROUPS);
  assert.deepEqual(assigned[0].games, assigned[6].games);
  assert.deepEqual(assigned[1].games, assigned[7].games);
  assert.deepEqual(
    assignGamesToAwakeFills(fills).map(({ games }) => games),
    Array(8).fill(undefined),
  );
});

test('every 3–4 month wake block receives two or three games and covers all twelve', () => {
  assert.deepEqual(
    THREE_TO_FOUR_MONTH_GAME_GROUPS.map((group) => group.length),
    [2, 2, 2, 3, 3],
  );
  const covered = THREE_TO_FOUR_MONTH_GAME_GROUPS.flat().map((game) => game.id);
  assert.deepEqual([...covered].sort(), [...THREE_TO_FOUR_MONTH_GAME_IDS].sort());
  assert.equal(new Set(covered).size, THREE_TO_FOUR_MONTH_GAME_IDS.length);
});

test('3–4 month assignment is deterministic and cycles on overflow', () => {
  const fills = Array.from({ length: 7 }, (_, index) => ({
    startMin: index * 60,
    endMin: (index + 1) * 60,
  }));
  const first = assignGamesToAwakeFills(fills, THREE_TO_FOUR_MONTH_GAME_GROUPS);
  const second = assignGamesToAwakeFills(fills, THREE_TO_FOUR_MONTH_GAME_GROUPS);
  assert.deepEqual(first, second);
  assert.deepEqual(first[0].games, first[5].games);
  assert.deepEqual(first[1].games, first[6].games);
});

test('5–6 month wake blocks use 4/4/4/3 groups and cover all fifteen games once', () => {
  assert.deepEqual(FIVE_TO_SIX_MONTH_GAME_GROUPS.map((group) => group.length), [4, 4, 4, 3]);
  const covered = FIVE_TO_SIX_MONTH_GAME_GROUPS.flat().map((game) => game.id);
  assert.deepEqual([...covered].sort(), [...FIVE_TO_SIX_MONTH_GAME_IDS].sort());
  assert.equal(new Set(covered).size, FIVE_TO_SIX_MONTH_GAME_IDS.length);
});

test('5–6 month assignment is deterministic and cycles on overflow', () => {
  const fills = Array.from({ length: 6 }, (_, index) => ({
    startMin: index * 60,
    endMin: (index + 1) * 60,
  }));
  const first = assignGamesToAwakeFills(fills, FIVE_TO_SIX_MONTH_GAME_GROUPS);
  const second = assignGamesToAwakeFills(fills, FIVE_TO_SIX_MONTH_GAME_GROUPS);
  assert.deepEqual(first, second);
  assert.deepEqual(first[0].games, first[4].games);
  assert.deepEqual(first[1].games, first[5].games);
});

test('both 7–9 month variants cover all seventeen games exactly once', () => {
  assert.deepEqual(SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS.map((group) => group.length), [6, 6, 5]);
  assert.deepEqual(SEVEN_TO_NINE_MONTH_THREE_NAP_GAME_GROUPS.map((group) => group.length), [5, 4, 4, 4]);
  for (const groups of [
    SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS,
    SEVEN_TO_NINE_MONTH_THREE_NAP_GAME_GROUPS,
  ]) {
    const covered = groups.flat().map((game) => game.id);
    assert.deepEqual([...covered].sort(), [...SEVEN_TO_NINE_MONTH_GAME_IDS].sort());
    assert.equal(new Set(covered).size, SEVEN_TO_NINE_MONTH_GAME_IDS.length);
  }
});

test('7–9 month assignment is deterministic and cycles each variant independently', () => {
  const fills = Array.from({ length: 5 }, (_, index) => ({ startMin: index * 60, endMin: (index + 1) * 60 }));
  for (const groups of [
    SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS,
    SEVEN_TO_NINE_MONTH_THREE_NAP_GAME_GROUPS,
  ]) {
    const first = assignGamesToAwakeFills(fills, groups);
    assert.deepEqual(first, assignGamesToAwakeFills(fills, groups));
    assert.deepEqual(first[0].games, first[groups.length].games);
  }
});

test('10–12 month wake blocks use 6/6/6 groups and preserve supplied order', () => {
  assert.deepEqual(TEN_TO_TWELVE_MONTH_GAME_GROUPS.map((group) => group.length), [6, 6, 6]);
  const covered = TEN_TO_TWELVE_MONTH_GAME_GROUPS.flat().map((game) => game.id);
  assert.deepEqual(covered, [...TEN_TO_TWELVE_MONTH_GAME_IDS]);
  assert.equal(new Set(covered).size, TEN_TO_TWELVE_MONTH_GAME_IDS.length);
});

test('10–12 month assignment is deterministic and cycles on overflow', () => {
  const fills = Array.from({ length: 4 }, (_, index) => ({
    startMin: index * 60,
    endMin: (index + 1) * 60,
  }));
  const first = assignGamesToAwakeFills(fills, TEN_TO_TWELVE_MONTH_GAME_GROUPS);
  assert.deepEqual(first, assignGamesToAwakeFills(fills, TEN_TO_TWELVE_MONTH_GAME_GROUPS));
  assert.deepEqual(first[0].games, first[3].games);
});

test('12–15 month wake blocks use 6/6/6 groups and preserve supplied order', () => {
  assert.deepEqual(TWELVE_TO_FIFTEEN_MONTH_GAME_GROUPS.map((group) => group.length), [6, 6, 6]);
  const covered = TWELVE_TO_FIFTEEN_MONTH_GAME_GROUPS.flat().map((game) => game.id);
  assert.deepEqual(covered, [...TWELVE_TO_FIFTEEN_MONTH_GAME_IDS]);
  assert.equal(new Set(covered).size, TWELVE_TO_FIFTEEN_MONTH_GAME_IDS.length);
});

test('12–15 month assignment is deterministic and cycles on overflow', () => {
  const fills = Array.from({ length: 4 }, (_, index) => ({
    startMin: index * 60,
    endMin: (index + 1) * 60,
  }));
  const first = assignGamesToAwakeFills(fills, TWELVE_TO_FIFTEEN_MONTH_GAME_GROUPS);
  assert.deepEqual(first, assignGamesToAwakeFills(fills, TWELVE_TO_FIFTEEN_MONTH_GAME_GROUPS));
  assert.deepEqual(first[0].games, first[3].games);
});

test('12–15 month shared guidance is present in every language', () => {
  for (const language of languages) {
    assert.ok(
      DEVELOPMENTAL_GAME_STRINGS[language][TWELVE_TO_FIFTEEN_MONTH_GUIDANCE_KEY]?.trim(),
      language,
    );
  }
});

test('15–18 month wake blocks use 6/6/6 groups and preserve supplied order', () => {
  assert.deepEqual(FIFTEEN_TO_EIGHTEEN_MONTH_GAME_GROUPS.map((group) => group.length), [6, 6, 6]);
  const covered = FIFTEEN_TO_EIGHTEEN_MONTH_GAME_GROUPS.flat().map((game) => game.id);
  assert.deepEqual(covered, [...FIFTEEN_TO_EIGHTEEN_MONTH_GAME_IDS]);
  assert.equal(new Set(covered).size, FIFTEEN_TO_EIGHTEEN_MONTH_GAME_IDS.length);
});

test('15–18 month assignment is deterministic and cycles on overflow', () => {
  const fills = Array.from({ length: 4 }, (_, index) => ({
    startMin: index * 60,
    endMin: (index + 1) * 60,
  }));
  const first = assignGamesToAwakeFills(fills, FIFTEEN_TO_EIGHTEEN_MONTH_GAME_GROUPS);
  assert.deepEqual(first, assignGamesToAwakeFills(fills, FIFTEEN_TO_EIGHTEEN_MONTH_GAME_GROUPS));
  assert.deepEqual(first[0].games, first[3].games);
});

test('15–18 month shared guidance is present in every language', () => {
  for (const language of languages) {
    assert.ok(
      DEVELOPMENTAL_GAME_STRINGS[language][FIFTEEN_TO_EIGHTEEN_MONTH_GUIDANCE_KEY]?.trim(),
      language,
    );
  }
});

test('18–24 month wake blocks use 6/6/6 groups and preserve supplied order', () => {
  assert.deepEqual(EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_GROUPS.map((group) => group.length), [6, 6, 6]);
  const covered = EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_GROUPS.flat().map((game) => game.id);
  assert.deepEqual(covered, [...EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_IDS]);
  assert.equal(new Set(covered).size, EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_IDS.length);
});

test('18–24 month assignment is deterministic and cycles on overflow', () => {
  const fills = Array.from({ length: 4 }, (_, index) => ({
    startMin: index * 60,
    endMin: (index + 1) * 60,
  }));
  const first = assignGamesToAwakeFills(fills, EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_GROUPS);
  assert.deepEqual(first, assignGamesToAwakeFills(fills, EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_GROUPS));
  assert.deepEqual(first[0].games, first[3].games);
});

test('18–24 month shared guidance is present in every language', () => {
  for (const language of languages) {
    assert.ok(
      DEVELOPMENTAL_GAME_STRINGS[language][EIGHTEEN_TO_TWENTY_FOUR_MONTH_GUIDANCE_KEY]?.trim(),
      language,
    );
  }
});

test('variant groups take precedence while age-level groups remain the fallback', () => {
  assert.equal(
    resolveDevelopmentalGameGroups(SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS, FIVE_TO_SIX_MONTH_GAME_GROUPS),
    SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS,
  );
  assert.equal(resolveDevelopmentalGameGroups(undefined, FIVE_TO_SIX_MONTH_GAME_GROUPS), FIVE_TO_SIX_MONTH_GAME_GROUPS);
  assert.equal(resolveDevelopmentalGameGroups(undefined, undefined), undefined);
});

test('developmental games are enabled only on the intended age regimes', () => {
  const dataSource = readFileSync(
    new URL('../src/features/regimes/data.ts', import.meta.url),
    'utf8',
  );
  assert.equal(dataSource.match(/"developmentalGameGroups":/g)?.length, 9);
  assert.match(
    dataSource,
    /"age": "regime\.1\.age",[\s\S]*?"developmentalGameGroups": SIX_TO_TWELVE_WEEK_GAME_GROUPS/,
  );
  assert.match(
    dataSource,
    /"age": "regime\.2\.age",[\s\S]*?"developmentalGameGroups": THREE_TO_FOUR_MONTH_GAME_GROUPS/,
  );
  assert.match(
    dataSource,
    /"age": "regime\.3\.age",[\s\S]*?"developmentalGameGroups": FIVE_TO_SIX_MONTH_GAME_GROUPS/,
  );
  assert.match(
    dataSource,
    /"age": "regime\.4\.age",[\s\S]*?"name": "regime\.4\.variant\.0\.name",\s*"developmentalGameGroups": SEVEN_TO_NINE_MONTH_TWO_NAP_GAME_GROUPS/,
  );
  assert.match(
    dataSource,
    /"name": "regime\.4\.variant\.1\.name",\s*"developmentalGameGroups": SEVEN_TO_NINE_MONTH_THREE_NAP_GAME_GROUPS/,
  );
  assert.match(
    dataSource,
    /"age": "regime\.5\.age",\s*"timed": true,\s*"developmentalGameGroups": TEN_TO_TWELVE_MONTH_GAME_GROUPS,\s*"developmentalGamesGuidance": TEN_TO_TWELVE_MONTH_GUIDANCE_KEY/,
  );
  assert.match(
    dataSource,
    /"age": "regime\.6\.age",\s*"timed": true,\s*"developmentalGameGroups": TWELVE_TO_FIFTEEN_MONTH_GAME_GROUPS,\s*"developmentalGamesGuidance": TWELVE_TO_FIFTEEN_MONTH_GUIDANCE_KEY/,
  );
  assert.match(
    dataSource,
    /"age": "regime\.7\.age",\s*"timed": true,\s*"developmentalGameGroups": FIFTEEN_TO_EIGHTEEN_MONTH_GAME_GROUPS,\s*"developmentalGamesGuidance": FIFTEEN_TO_EIGHTEEN_MONTH_GUIDANCE_KEY/,
  );
  assert.match(
    dataSource,
    /"age": "regime\.8\.age",\s*"timed": true,\s*"developmentalGameGroups": EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_GROUPS,\s*"developmentalGamesGuidance": EIGHTEEN_TO_TWENTY_FOUR_MONTH_GUIDANCE_KEY/,
  );
  for (const regimeIndex of [0]) {
    const start = dataSource.indexOf(`"age": "regime.${regimeIndex}.age"`);
    const next = dataSource.indexOf(`"age": "regime.${regimeIndex + 1}.age"`, start);
    const ageBlock = dataSource.slice(start, next === -1 ? undefined : next);
    assert.doesNotMatch(ageBlock, /"developmentalGameGroups":/, `regime.${regimeIndex}`);
  }
});

test('the 6–12 week schedule timing remains unchanged', () => {
  const dataSource = readFileSync(
    new URL('../src/features/regimes/data.ts', import.meta.url),
    'utf8',
  );
  const ageBlock = dataSource.slice(
    dataSource.indexOf('"age": "regime.1.age"'),
    dataSource.indexOf('"age": "regime.2.age"'),
  );
  const ranges = [...ageBlock.matchAll(
    /"startMin": (\d+|null),\s*"endMin": (\d+|null)/g,
  )].map((match) => [
    match[1] === 'null' ? null : Number(match[1]),
    match[2] === 'null' ? null : Number(match[2]),
  ]);
  assert.deepEqual(ranges, [
    [420, null], [440, 480], [480, 555], [555, null], [615, 690],
    [690, 720], [765, 840], [840, 870], [915, 975], [990, 1020],
    [1065, 1110], [1140, null], [1200, 1290],
  ]);
});

test('the 3–4 month schedule timing remains unchanged', () => {
  const dataSource = readFileSync(
    new URL('../src/features/regimes/data.ts', import.meta.url),
    'utf8',
  );
  const ageBlock = dataSource.slice(
    dataSource.indexOf('"age": "regime.2.age"'),
    dataSource.indexOf('"age": "regime.3.age"'),
  );
  const ranges = [...ageBlock.matchAll(
    /"startMin": (\d+|null),\s*"endMin": (\d+|null)/g,
  )].map((match) => [
    match[1] === 'null' ? null : Number(match[1]),
    match[2] === 'null' ? null : Number(match[2]),
  ]);
  assert.deepEqual(ranges, [
    [420, null], [500, 570], [570, 600], [670, 740], [750, null],
    [840, 915], [915, 945], [1020, 1060], [1080, null], [1140, null],
    [1170, 1200],
  ]);
});

test('the 5–6 month schedule timing remains unchanged', () => {
  const dataSource = readFileSync(
    new URL('../src/features/regimes/data.ts', import.meta.url),
    'utf8',
  );
  const ageBlock = dataSource.slice(
    dataSource.indexOf('"age": "regime.3.age"'),
    dataSource.indexOf('"age": "regime.4.age"'),
  );
  const ranges = [...ageBlock.matchAll(
    /"startMin": (\d+|null),\s*"endMin": (\d+|null)/g,
  )].map((match) => [
    match[1] === 'null' ? null : Number(match[1]),
    match[2] === 'null' ? null : Number(match[2]),
  ]);
  assert.deepEqual(ranges, [
    [420, null], [540, 615], [615, null], [660, null], [750, 840],
    [840, null], [990, 1020], [1020, 1050], [1110, null], [1155, null],
    [1170, 1200],
  ]);
});

test('both 7–9 month variant schedules remain unchanged', () => {
  const dataSource = readFileSync(new URL('../src/features/regimes/data.ts', import.meta.url), 'utf8');
  const ageBlock = dataSource.slice(dataSource.indexOf('"age": "regime.4.age"'), dataSource.indexOf('"age": "regime.5.age"'));
  const split = ageBlock.indexOf('"name": "regime.4.variant.1.name"');
  const rangesFor = (source) => [...source.matchAll(/"startMin": (\d+|null),\s*"endMin": (\d+|null)/g)].map((match) => [
    match[1] === 'null' ? null : Number(match[1]),
    match[2] === 'null' ? null : Number(match[2]),
  ]);
  assert.deepEqual(rangesFor(ageBlock.slice(0, split)), [
    [420, null], [480, null], [570, 645], [660, null], [750, null], [840, 930],
    [930, 960], [1050, 1080], [1125, null], [1155, null], [1170, 1200],
  ]);
  assert.deepEqual(rangesFor(ageBlock.slice(split)), [
    [420, null], [540, 585], [735, 795], [960, 990], [1170, 1200],
  ]);
});

test('the 10–12 month schedule remains unchanged', () => {
  const dataSource = readFileSync(new URL('../src/features/regimes/data.ts', import.meta.url), 'utf8');
  const ageBlock = dataSource.slice(
    dataSource.indexOf('"age": "regime.5.age"'),
    dataSource.indexOf('"age": "regime.6.age"'),
  );
  const ranges = [...ageBlock.matchAll(
    /"startMin": (\d+|null),\s*"endMin": (\d+|null)/g,
  )].map((match) => [
    match[1] === 'null' ? null : Number(match[1]),
    match[2] === 'null' ? null : Number(match[2]),
  ]);
  assert.deepEqual(ranges, [
    [390, 420], [480, null], [570, 645], [660, null], [750, null], [855, 930],
    [930, null], [1080, null], [1140, null], [1170, null], [1185, 1200],
  ]);
});

test('every supported language contains every game title and instruction', () => {
  assert.deepEqual(Object.keys(DEVELOPMENTAL_GAME_STRINGS).sort(), [...languages].sort());
  for (const language of languages) {
    for (const id of [
      ...DEVELOPMENTAL_GAME_IDS,
      ...THREE_TO_FOUR_MONTH_GAME_IDS,
      ...FIVE_TO_SIX_MONTH_GAME_IDS,
      ...SEVEN_TO_NINE_MONTH_GAME_IDS,
      ...TEN_TO_TWELVE_MONTH_GAME_IDS,
      ...TWELVE_TO_FIFTEEN_MONTH_GAME_IDS,
      ...FIFTEEN_TO_EIGHTEEN_MONTH_GAME_IDS,
      ...EIGHTEEN_TO_TWENTY_FOUR_MONTH_GAME_IDS,
    ]) {
      const titleKey = `regime.game.${id}.title`;
      const instructionKey = `regime.game.${id}.instruction`;
      assert.ok(DEVELOPMENTAL_GAME_STRINGS[language][titleKey]?.trim(), `${language}: ${titleKey}`);
      assert.ok(
        DEVELOPMENTAL_GAME_STRINGS[language][instructionKey]?.trim(),
        `${language}: ${instructionKey}`,
      );
    }
  }
});

test('10–12 month guidance is localized and rendered before the game list', () => {
  for (const language of languages) {
    const guidance = DEVELOPMENTAL_GAME_STRINGS[language][TEN_TO_TWELVE_MONTH_GUIDANCE_KEY];
    assert.match(guidance, /5.*15/, language);
    assert.notEqual(guidance, TEN_TO_TWELVE_MONTH_GUIDANCE_KEY, language);
  }

  const timelineSource = readFileSync(
    new URL('../src/features/regimes/components/regime-timeline.tsx', import.meta.url),
    'utf8',
  );
  const modalSource = readFileSync(
    new URL('../src/features/regimes/components/regime-note-modal.tsx', import.meta.url),
    'utf8',
  );
  assert.match(timelineSource, /developmentalGamesGuidance: f\.games\?\.length/);
  const noteIndex = modalSource.indexOf('step.note ||');
  const guidanceIndex = modalSource.indexOf('step.developmentalGamesGuidance');
  const gamesIndex = modalSource.indexOf('step.games.map');
  assert.ok(noteIndex > 0 && guidanceIndex > noteIndex && gamesIndex > guidanceIndex);
});

test('10–12 month expectation and safety constraints remain explicit in every language', () => {
  const patterns = {
    en: { sorting: /too much to expect/i, demonstrate: /demonstrate/i, stable: /stable.*must not tip.*suddenly/i, arms: /do not.*arms raised/i, water: /under supervision/i },
    ru: { sorting: /ждать рано/i, demonstrate: /покажите сами/i, stable: /устойчивую.*не должна.*опрокидываться.*резко/i, arms: /не водите.*поднятые.*руки/i, water: /под наблюдением/i },
    ua: { sorting: /очікувати зарано/i, demonstrate: /покажіть самі/i, stable: /стійку.*не повинна.*перекидатися.*різко/i, arms: /не водіть.*підняті.*руки/i, water: /під наглядом/i },
    pl: { sorting: /za wcześnie/i, demonstrate: /pokaż samodzielnie/i, stable: /stabilnego.*nie może.*przewracać.*nagle/i, arms: /nie prowadź.*ręce uniesione/i, water: /pod nadzorem/i },
    es: { sorting: /es pronto/i, demonstrate: /muéstralo tú/i, stable: /estable.*no debe volcar.*de golpe/i, arms: /no hagas caminar.*brazos levantados/i, water: /bajo supervisión/i },
    fr: { sorting: /trop tôt/i, demonstrate: /montrez vous-même/i, stable: /stable.*ne doit pas basculer.*brusquement/i, arms: /ne faites pas marcher.*bras levés/i, water: /sous surveillance/i },
    de: { sorting: /noch nicht zu erwarten/i, demonstrate: /machen Sie es vor/i, stable: /stabil.*darf nicht.*kippen.*plötzlich/i, arms: /nicht.*hochgezogenen Armen/i, water: /unter Aufsicht/i },
    pt: { sorting: /é cedo/i, demonstrate: /demonstre você mesmo/i, stable: /estável.*não deve tombar.*de repente/i, arms: /não conduza.*braços levantados/i, water: /sob supervisão/i },
    it: { sorting: /è presto/i, demonstrate: /mostralo tu/i, stable: /stabile.*non deve ribaltarsi.*all’improvviso/i, arms: /non far camminare.*braccia sollevate/i, water: /sotto supervisione/i },
  };
  for (const language of languages) {
    const strings = DEVELOPMENTAL_GAME_STRINGS[language];
    assert.match(strings['regime.game.m1012SimpleSorting.instruction'], patterns[language].sorting, language);
    assert.match(strings['regime.game.m1012BringObject.instruction'], patterns[language].demonstrate, language);
    assert.match(strings['regime.game.m1012PushPull.instruction'], patterns[language].stable, language);
    assert.match(strings['regime.game.m1012CruiseSupport.instruction'], patterns[language].arms, language);
    assert.match(strings['regime.game.m1012WaterPlay.instruction'], patterns[language].water, language);
  }
});

test('7–9 month safety-sensitive instructions retain their limits in every language', () => {
  const patterns = {
    en: { small: /do not use.*small items/i, tunnel: /stable.*fully open.*check.*edges.*never leave.*alone/i, water: /hand.*at all times.*never leave.*alone.*second/i },
    ru: { small: /не используйте.*мелочи/i, tunnel: /устойчивый.*открытыми концами.*проверяйте края.*не оставляйте одного/i, water: /рука взрослого.*постоянно.*ни на секунду.*не оставляйте/i },
    ua: { small: /не використовуйте.*дрібниці/i, tunnel: /стійкий.*відкритими кінцями.*перевіряйте краї.*не залишайте.*саму/i, water: /рука дорослого.*постійно.*ні на секунду.*не залишайте/i },
    pl: { small: /nie używaj.*drobiazgów/i, tunnel: /stabilny.*otwartymi końcami.*sprawdź krawędzie.*nie zostawiaj.*samego/i, water: /dłoń dorosłego.*stale.*nie zostawiaj.*sekundę/i },
    es: { small: /no uses.*piezas pequeñas/i, tunnel: /estable.*extremos.*abiertos.*revisa los bordes.*no lo dejes solo/i, water: /mano de un adulto.*siempre.*no dejes.*solo.*segundo/i },
    fr: { small: /n’utilisez ni.*petits objets/i, tunnel: /stable.*extrémités.*ouvertes.*vérifiez les bords.*ne le laissez pas seul/i, water: /main d’un adulte.*en permanence.*ne laissez jamais.*seul.*seconde/i },
    de: { small: /verwende keine.*Kleinteile/i, tunnel: /stabilen Tunnel.*offenen Enden.*prüfe die Kanten.*lass es nicht allein/i, water: /Hand eines Erwachsenen.*ständig.*keine Sekunde allein/i },
    pt: { small: /não use.*peças pequenas/i, tunnel: /estável.*extremidades.*abertas.*verifique as bordas.*não o deixe sozinho/i, water: /mão de um adulto.*sempre.*não deixe.*sozinho.*segundo/i },
    it: { small: /non usare.*piccoli oggetti/i, tunnel: /stabile.*estremità.*aperte.*controlla i bordi.*non lasciarlo solo/i, water: /mano di un adulto.*sempre.*non lasciare.*solo.*secondo/i },
  };
  for (const language of languages) {
    const strings = DEVELOPMENTAL_GAME_STRINGS[language];
    assert.match(strings['regime.game.m79TwoContainers.instruction'], patterns[language].small, language);
    assert.match(strings['regime.game.m79Tunnel.instruction'], patterns[language].tunnel, language);
    assert.match(strings['regime.game.m79SupervisedWater.instruction'], patterns[language].water, language);
  }
});

test('5–6 month safety-sensitive instructions retain their limits in every language', () => {
  const safetyPatterns = {
    en: { hidden: /do not cover.*face/i, crawl: /independently.*do not push.*body/i, roll: /independently.*do not pull.*arm/i },
    ru: { hidden: /лицо ребёнка не накрывайте/i, crawl: /самостоятельно.*не толкайте.*корпус/i, roll: /самому.*не тяните за руку/i },
    ua: { hidden: /обличчя дитини не накривайте/i, crawl: /самостійно.*не штовхайте.*корпус/i, roll: /самій.*не тягніть за руку/i },
    pl: { hidden: /nie zakrywaj twarzy dziecka/i, crawl: /samodzielnie.*nie popychaj.*tułowia/i, roll: /samodzielnie.*nie ciągnij za rękę/i },
    es: { hidden: /no cubras la cara del bebé/i, crawl: /por sí mismo.*no empujes su cuerpo/i, roll: /por sí mismo.*no tires del brazo/i },
    fr: { hidden: /ne couvrez pas le visage/i, crawl: /puisse pousser seul.*ne poussez pas son corps/i, roll: /commencer seul.*ne le tirez pas par le bras/i },
    de: { hidden: /bedecke nicht das Gesicht/i, crawl: /selbstständig.*schiebe seinen Körper nicht/i, roll: /selbst beginnen.*ziehe es nicht am Arm/i },
    pt: { hidden: /não cubra o rosto/i, crawl: /sozinho.*não empurre o corpo/i, roll: /sozinho.*não o puxe pelo braço/i },
    it: { hidden: /non coprire il viso/i, crawl: /autonomamente.*non spingere il suo corpo/i, roll: /da solo.*non tirarlo per il braccio/i },
  };
  for (const language of languages) {
    const strings = DEVELOPMENTAL_GAME_STRINGS[language];
    assert.match(strings['regime.game.m56HiddenToy.instruction'], safetyPatterns[language].hidden, language);
    assert.match(strings['regime.game.m56CrawlPrep.instruction'], safetyPatterns[language].crawl, language);
    assert.match(strings['regime.game.m56RollTowardInterest.instruction'], safetyPatterns[language].roll, language);
  }
});

test('3–4 month safety-sensitive instructions retain their limits in every language', () => {
  const safetyPatterns = {
    en: { sound: /not.*close to the ear/i, textures: /large.*clean.*safe.*mouth/i, carry: /supporting.*chest.*pelvis.*comfortable/i },
    ru: { sound: /не звените.*рядом с ухом/i, textures: /крупными.*чистыми.*пригодными для рта/i, carry: /поддерживая грудь и таз.*комфортно/i },
    ua: { sound: /не дзвоніть.*біля вуха/i, textures: /великими.*чистими.*безпечними для рота/i, carry: /підтримуючи груди й таз.*комфортно/i },
    pl: { sound: /nie grzechocz.*blisko ucha/i, textures: /duże.*czyste.*bezpieczne.*ust/i, carry: /podtrzymując klatkę piersiową i miednicę.*komfortowo/i },
    es: { sound: /no lo agites.*cerca del oído/i, textures: /grandes.*limpios.*seguros.*boca/i, carry: /pecho y la pelvis.*cómodo/i },
    fr: { sound: /ne l’agitez pas.*près de son oreille/i, textures: /grands.*propres.*mise en bouche/i, carry: /poitrine et le bassin.*à l’aise/i },
    de: { sound: /nicht nahe am Ohr/i, textures: /groß.*sauber.*Mund geeignet/i, carry: /Brust und Becken.*wohlfühlt/i },
    pt: { sound: /não a agite.*perto do ouvido/i, textures: /grandes.*limpos.*seguros.*boca/i, carry: /peito e a bacia.*confortável/i },
    it: { sound: /non agitarlo.*vicino all’orecchio/i, textures: /grandi.*puliti.*sicuri.*bocca/i, carry: /petto e il bacino.*suo agio/i },
  };
  for (const language of languages) {
    const strings = DEVELOPMENTAL_GAME_STRINGS[language];
    assert.match(strings['regime.game.m34WhereSound.instruction'], safetyPatterns[language].sound, language);
    assert.match(strings['regime.game.m34Textures.instruction'], safetyPatterns[language].textures, language);
    assert.match(strings['regime.game.m34AirplaneCarry.instruction'], safetyPatterns[language].carry, language);
  }
});

test('tummy-time safety meaning is retained in every language', () => {
  const safetyPatterns = {
    en: /awake.*continuous supervision/i,
    ru: /бодрств.*постоянн.*наблюд/i,
    ua: /не спить.*постійн.*нагляд/i,
    pl: /nie śpi.*stałym nadzorem/i,
    es: /despierto.*supervisión constante/i,
    fr: /éveillé.*surveillance constante/i,
    de: /wachen Zustand.*ständiger Aufsicht/i,
    pt: /acordado.*supervisão constante/i,
    it: /sveglio.*supervisione costante/i,
  };
  for (const language of languages) {
    assert.match(
      DEVELOPMENTAL_GAME_STRINGS[language]['regime.game.tummyTime.instruction'],
      safetyPatterns[language],
      language,
    );
  }
});
