import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');

test('child creation requires decimal height and weight and forwards both values', () => {
  const modal = read('../src/features/children/components/add-child-modal/add-child-modal.tsx');
  const childScreen = read('../src/features/children/child-select-screen.tsx');
  const onboarding = read('../src/features/onboarding/child-setup-screen.tsx');
  const appState = read('../src/state/app-state.ts');

  assert.match(modal, /const heightCm = parseMeasurementNumber\(height\)/);
  assert.match(modal, /const weightKg = parseMeasurementNumber\(weight\)/);
  assert.match(modal, /!!child \|\| \(heightCm !== null && weightKg !== null\)/);
  assert.match(modal, /inputMode="decimal"/);
  assert.match(childScreen, /addChild\(name, gradientKey, birthday, growth\.heightCm, growth\.weightKg\)/);
  assert.match(onboarding, /addChild\(name, gradientKey, birthday, growth\.heightCm, growth\.weightKg\)/);
  assert.match(appState, /measuredOn: dateOnlyFromDate\(new Date\(birthday\)\)/);
});

test('activity profile renders a separate growth summary that opens history', () => {
  const activity = read('../src/features/activity/activity-screen/activity-screen.tsx');
  const activityStyles = read('../src/features/activity/activity-screen/styles.ts');
  const summary = read('../src/features/growth/growth-summary.tsx');

  assert.match(activity, /latestGrowthMeasurement/);
  assert.match(activity, /<GrowthSummary/);
  assert.match(activity, /onPress=\{\(\) => setGrowthHistoryOpen\(true\)\}/);
  assert.match(activity, /<GrowthHistoryModal/);
  assert.match(summary, /growth\.addFirst/);
  assert.match(summary, /unit\.cm/);
  assert.match(summary, /unit\.kg/);
  assert.doesNotMatch(summary, /MaterialCommunityIcons/);
  assert.match(activityStyles, /header:\s*\{[\s\S]*?alignItems: "flex-start"/);
  assert.match(activityStyles, /profileStack:\s*\{[\s\S]*?alignItems: "flex-start"/);
  assert.match(summary, /pressable:\s*\{[\s\S]*?paddingHorizontal: 0/);
  const summaryValues = summary.slice(summary.indexOf('<View style={styles.values}>'));
  assert.ok(summaryValues.indexOf("{weight} {t('unit.kg')}") < summaryValues.indexOf("{height} {t('unit.cm')}"));
});

test('history modal shows latest row at the bottom and provides shared add/edit validation', () => {
  const modal = read('../src/features/growth/growth-history-modal.tsx');

  assert.match(modal, /sortGrowthMeasurements/);
  assert.match(modal, /sortGrowthMeasurements\([\s\S]*?\)\.reverse\(\)/);
  assert.match(modal, /ref=\{historyScrollRef\}/);
  assert.match(modal, /onLayout=\{scrollToLatest\}/);
  assert.match(modal, /onContentSizeChange=\{scrollToLatest\}/);
  assert.match(modal, /scrollToEnd\(\{ animated: false \}\)/);
  assert.match(modal, /maxHeight: '72%'/);
  assert.match(modal, /const HISTORY_VISIBLE_ROW_COUNT = 4/);
  assert.match(modal, /const HISTORY_ROW_HEIGHT = 52/);
  assert.match(modal, /HISTORY_VISIBLE_ROW_COUNT \* HISTORY_ROW_HEIGHT/);
  assert.match(modal, /list:[\s\S]*?maxHeight: HISTORY_LIST_MAX_HEIGHT/);
  assert.match(modal, /row:[\s\S]*?height: HISTORY_ROW_HEIGHT/);
  assert.match(modal, /rowValues:\s*\{\s*flex: 1/);
  assert.match(modal, /rowEditIcon:\s*\{\s*marginLeft: 'auto'/);
  assert.match(modal, /setEditing\('new'\)/);
  assert.match(modal, /setEditing\(measurement\)/);
  assert.match(modal, /addMeasurement\(\{ childId: child\.id, measuredOn, heightCm, weightKg \}\)/);
  assert.match(modal, /updateMeasurement\(editing\.id, \{ measuredOn, heightCm, weightKg \}\)/);
  assert.match(modal, /minimumDate=\{birthday/);
  assert.match(modal, /maximumDate=\{new Date\(\)\}/);
  assert.match(modal, /isValidGrowthMeasurement/);
  assert.match(modal, /syncGrowthMeasurements\(children\)/);
  assert.match(modal, /\{weight\} \{t\('unit\.kg'\)\} · \{height\} \{t\('unit\.cm'\)\}/);
  const editorInputs = modal.slice(modal.indexOf('<View style={styles.inputRow}>'));
  assert.ok(editorInputs.indexOf("t('growth.weight')") < editorInputs.indexOf("t('growth.height')"));
});

test('child creation presents weight before height', () => {
  const modal = read('../src/features/children/components/add-child-modal/add-child-modal.tsx');
  const inputs = modal.slice(modal.indexOf('<View style={styles.measurementInputs}>'));
  assert.ok(inputs.indexOf("t('growth.weight')") < inputs.indexOf("t('growth.height')"));
});

test('growth synchronization covers queue flushing, remote merging, realtime, and cleanup', () => {
  const sync = read('../src/lib/sync.ts');
  const hook = read('../src/hooks/use-sync.ts');
  const appState = read('../src/state/app-state.ts');
  const enterCode = read('../src/features/children/components/enter-code-modal.tsx');
  const schema = read('../supabase/schema.sql');
  const migration = read('../supabase/migrations/20260916120000_child_measurements.sql');

  assert.match(sync, /export async function flushGrowthMeasurements/);
  assert.match(sync, /export async function fetchGrowthMeasurements/);
  assert.match(sync, /markMeasurementsSynced/);
  assert.match(sync, /mergeRemoteMeasurements/);
  assert.match(sync, /isMissingGrowthTable/);
  assert.match(hook, /await syncGrowthMeasurements\(useAppStore\.getState\(\)\.children\)/);
  assert.match(hook, /table: 'child_measurements'/);
  assert.match(enterCode, /syncGrowthMeasurements\(useAppStore\.getState\(\)\.children\)/);
  assert.match(appState, /removeChildMeasurements\(id\)/);
  assert.match(appState, /clearMeasurements\(\)/);
  for (const sql of [schema, migration]) {
    assert.match(sql, /create table if not exists public\.child_measurements/);
    assert.match(sql, /public\.is_child_member\(child_id\)/);
    assert.match(sql, /grant select, insert, update on public\.child_measurements to authenticated/);
  }
});

test('every supported language includes every growth-history key', () => {
  const i18n = read('../src/i18n/index.ts');
  const keys = [
    'unit.cm',
    'unit.kg',
    'growth.title',
    'growth.addFirst',
    'growth.empty',
    'growth.add',
    'growth.edit',
    'growth.date',
    'growth.height',
    'growth.weight',
    'growth.heightPlaceholder',
    'growth.weightPlaceholder',
    'growth.summaryAccessibility',
    'growth.rowAccessibility',
  ];
  for (const key of keys) {
    assert.equal(i18n.match(new RegExp(`'${key.replace('.', '\\.')}'`, 'g'))?.length, 9, key);
  }
});
