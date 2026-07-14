import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { colors, radii, spacing } from '../../constants/colors';
import { useDatabaseContext } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import BodyMetricsBanner from '../../components/BodyMetricsBanner';
import CollapsibleCard from '../../components/CollapsibleCard';

interface BodyLogRow {
  id: number;
  date: string;
  weight: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  hips_cm: number | null;
  arms_cm: number | null;
  notes: string | null;
  created_at: string;
}

interface CalorieLogRow {
  id: number;
  date: string;
  total_calories: number;
  notes: string | null;
  created_at: string;
}

interface CalorieChartDay {
  date: string;
  label: string;
  calories: number;
}

const WEIGHT_CHART_WIDTH = 300;
const WEIGHT_CHART_HEIGHT = 100;
const WEIGHT_CHART_PADDING = 8;
const CALORIE_BAR_MAX_HEIGHT = 90;

function localDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayLocal(): string {
  return localDateString(new Date());
}

// Matches a thousands-grouped number like "1,200" or "12,345.6" — a comma
// followed by exactly 3 digits, repeated. Distinguishes that from a
// comma-locale decimal separator like "1,2" (which means 1.2).
const THOUSANDS_SEPARATOR_RE = /^\d{1,3}(,\d{3})+(\.\d+)?$/;

// Normalize numeric text input: strip thousands separators ("1,200" -> "1200")
// or, failing that, treat a comma as a decimal separator so comma-locale
// input parses ("1,2" -> "1.2").
function normalizeDecimal(text: string): string {
  const trimmed = text.trim();
  if (THOUSANDS_SEPARATOR_RE.test(trimmed)) {
    return trimmed.replace(/,/g, '');
  }
  return trimmed.replace(',', '.');
}

// Optional measurement fields: empty or unparseable input is treated as
// not-provided (null) rather than blocking or corrupting the entry.
function parseOptionalMeasurement(text: string): number | null {
  const normalized = normalizeDecimal(text);
  if (!normalized) return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function buildWeightPoints(values: number[]): string {
  if (values.length === 0) return '';
  const width = WEIGHT_CHART_WIDTH;
  const height = WEIGHT_CHART_HEIGHT;
  const padding = WEIGHT_CHART_PADDING;
  if (values.length === 1) {
    const y = height / 2;
    return `${padding},${y} ${width - padding},${y}`;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  return values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * usableWidth;
      const y = padding + usableHeight - ((v - min) / range) * usableHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

function measurementsSummary(log: BodyLogRow): string {
  const parts: string[] = [];
  if (log.waist_cm !== null) parts.push(`waist ${log.waist_cm}cm`);
  if (log.chest_cm !== null) parts.push(`chest ${log.chest_cm}cm`);
  if (log.hips_cm !== null) parts.push(`hips ${log.hips_cm}cm`);
  if (log.arms_cm !== null) parts.push(`arms ${log.arms_cm}cm`);
  return parts.join(' · ');
}

function CalorieBarChart({ data }: { data: CalorieChartDay[] }) {
  const maxCalories = Math.max(...data.map((d) => d.calories), 1);
  return (
    <View style={styles.calorieChart}>
      {data.map((d) => {
        const barHeight = d.calories > 0 ? Math.max(4, (d.calories / maxCalories) * CALORIE_BAR_MAX_HEIGHT) : 2;
        return (
          <View key={d.date} style={styles.calorieColumn}>
            <Text style={styles.calorieValue}>{d.calories > 0 ? d.calories : ''}</Text>
            <View style={styles.calorieBarTrack}>
              <View style={[styles.calorieBar, { height: barHeight }]} />
            </View>
            <Text style={styles.calorieDayLabel}>{d.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function BodyScreen() {
  const db = useDatabaseContext();
  const { settings } = useSettings();
  const bodyMetricsEnabled = settings.body_metrics_enabled === 'true';
  const calorieTrackingEnabled = settings.calorie_tracking === 'true';
  const weightUnit = settings.weight_unit || 'kg';

  const [loading, setLoading] = useState(true);
  const [bodyLogs, setBodyLogs] = useState<BodyLogRow[]>([]);
  const [calorieLogs, setCalorieLogs] = useState<CalorieLogRow[]>([]);

  const [showBodyForm, setShowBodyForm] = useState(false);
  const [formDate, setFormDate] = useState(todayLocal());
  const [formWeight, setFormWeight] = useState('');
  const [formWaist, setFormWaist] = useState('');
  const [formChest, setFormChest] = useState('');
  const [formHips, setFormHips] = useState('');
  const [formArms, setFormArms] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [savingBody, setSavingBody] = useState(false);

  const [showCalorieForm, setShowCalorieForm] = useState(false);
  const [calorieDate, setCalorieDate] = useState(todayLocal());
  const [calorieValue, setCalorieValue] = useState('');
  const [savingCalorie, setSavingCalorie] = useState(false);

  const fetchBodyLogs = useCallback(
    () => db.getAllAsync<BodyLogRow>('SELECT * FROM body_logs ORDER BY date DESC LIMIT 30'),
    [db]
  );

  const fetchCalorieLogs = useCallback(
    () => db.getAllAsync<CalorieLogRow>('SELECT * FROM calorie_logs ORDER BY date DESC LIMIT 7'),
    [db]
  );

  useEffect(() => {
    if (!bodyMetricsEnabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const logs = await fetchBodyLogs();
        if (!cancelled) setBodyLogs(logs);
      } catch (err) {
        console.warn('[flux] failed to load body logs', err);
      }

      if (calorieTrackingEnabled) {
        try {
          const logs = await fetchCalorieLogs();
          if (!cancelled) setCalorieLogs(logs);
        } catch (err) {
          console.warn('[flux] failed to load calorie logs', err);
        }
      } else if (!cancelled) {
        setCalorieLogs([]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [bodyMetricsEnabled, calorieTrackingEnabled, fetchBodyLogs, fetchCalorieLogs]);

  const chartWeights = useMemo(
    () =>
      [...bodyLogs]
        .filter((log) => log.weight !== null)
        .reverse()
        .map((log) => log.weight as number),
    [bodyLogs]
  );

  const calorieChartData = useMemo<CalorieChartDay[]>(() => {
    const byDate = new Map(calorieLogs.map((log) => [log.date, log.total_calories]));
    const days: CalorieChartDay[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const date = localDateString(d);
      const label = d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3);
      days.push({ date, label, calories: byDate.get(date) ?? 0 });
    }
    return days;
  }, [calorieLogs]);

  const resetBodyForm = useCallback(() => {
    setFormDate(todayLocal());
    setFormWeight('');
    setFormWaist('');
    setFormChest('');
    setFormHips('');
    setFormArms('');
    setFormNotes('');
  }, []);

  const handleSaveBodyLog = useCallback(async () => {
    if (savingBody) return;
    const weightNum = Number(normalizeDecimal(formWeight));
    if (!formDate.trim() || !Number.isFinite(weightNum) || weightNum <= 0) return;

    setSavingBody(true);
    try {
      await db.runAsync(
        `INSERT INTO body_logs (date, weight, waist_cm, chest_cm, hips_cm, arms_cm, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          formDate.trim(),
          weightNum,
          parseOptionalMeasurement(formWaist),
          parseOptionalMeasurement(formChest),
          parseOptionalMeasurement(formHips),
          parseOptionalMeasurement(formArms),
          formNotes.trim() ? formNotes.trim() : null,
        ]
      );
      const logs = await fetchBodyLogs();
      setBodyLogs(logs);
      setShowBodyForm(false);
      resetBodyForm();
    } catch (err) {
      console.warn('[flux] failed to save body log', err);
    } finally {
      setSavingBody(false);
    }
  }, [db, formDate, formWeight, formWaist, formChest, formHips, formArms, formNotes, savingBody, fetchBodyLogs, resetBodyForm]);

  const handleSaveCalorieLog = useCallback(async () => {
    if (savingCalorie) return;
    const calories = Number(normalizeDecimal(calorieValue));
    if (!calorieDate.trim() || !Number.isFinite(calories) || calories <= 0) return;

    setSavingCalorie(true);
    try {
      await db.runAsync(
        `INSERT INTO calorie_logs (date, total_calories) VALUES (?, ?)
         ON CONFLICT(date) DO UPDATE SET total_calories = excluded.total_calories`,
        [calorieDate.trim(), calories]
      );
      const logs = await fetchCalorieLogs();
      setCalorieLogs(logs);
      setShowCalorieForm(false);
      setCalorieDate(todayLocal());
      setCalorieValue('');
    } catch (err) {
      console.warn('[flux] failed to save calorie log', err);
    } finally {
      setSavingCalorie(false);
    }
  }, [db, calorieDate, calorieValue, savingCalorie, fetchCalorieLogs]);

  const weightInput = Number(normalizeDecimal(formWeight));
  const calorieInput = Number(normalizeDecimal(calorieValue));
  const canSaveBody = formDate.trim().length > 0 && Number.isFinite(weightInput) && weightInput > 0;
  const canSaveCalorie = calorieDate.trim().length > 0 && Number.isFinite(calorieInput) && calorieInput > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <BodyMetricsBanner />

      {!bodyMetricsEnabled ? (
        <Text style={styles.disabledText}>
          Body tracking is off. Turn it on in Settings to use this tab.
        </Text>
      ) : loading ? (
        <>
          <View style={[styles.skeleton, styles.skeletonCard]} />
          <View style={[styles.skeleton, styles.skeletonCard]} />
        </>
      ) : (
        <>
          <CollapsibleCard title="Weight & measurements">
            {chartWeights.length >= 2 ? (
              <Svg
                width="100%"
                height={WEIGHT_CHART_HEIGHT}
                viewBox={`0 0 ${WEIGHT_CHART_WIDTH} ${WEIGHT_CHART_HEIGHT}`}
                preserveAspectRatio="none"
              >
                <Polyline
                  points={buildWeightPoints(chartWeights)}
                  fill="none"
                  stroke={colors.textSecondary}
                  strokeWidth={2}
                />
              </Svg>
            ) : (
              <Text style={styles.emptyText}>Log a couple of entries to see a trend.</Text>
            )}

            <Pressable
              style={styles.logButton}
              onPress={() => setShowBodyForm((prev) => !prev)}
              hitSlop={8}
            >
              <Text style={styles.logButtonText}>{showBodyForm ? 'Cancel' : 'Log entry'}</Text>
            </Pressable>

            {showBodyForm && (
              <View style={styles.form}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={formDate}
                  onChangeText={setFormDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={styles.fieldLabel}>Weight ({weightUnit})</Text>
                <TextInput
                  style={styles.input}
                  value={formWeight}
                  onChangeText={setFormWeight}
                  keyboardType="decimal-pad"
                  placeholder={`Weight in ${weightUnit}`}
                  placeholderTextColor={colors.textMuted}
                />

                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <Text style={styles.fieldLabel}>Waist (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={formWaist}
                      onChangeText={setFormWaist}
                      keyboardType="decimal-pad"
                      placeholder="Optional"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <Text style={styles.fieldLabel}>Chest (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={formChest}
                      onChangeText={setFormChest}
                      keyboardType="decimal-pad"
                      placeholder="Optional"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.rowItem}>
                    <Text style={styles.fieldLabel}>Hips (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={formHips}
                      onChangeText={setFormHips}
                      keyboardType="decimal-pad"
                      placeholder="Optional"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.rowItem}>
                    <Text style={styles.fieldLabel}>Arms (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={formArms}
                      onChangeText={setFormArms}
                      keyboardType="decimal-pad"
                      placeholder="Optional"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={styles.input}
                  value={formNotes}
                  onChangeText={setFormNotes}
                  placeholder="Optional"
                  placeholderTextColor={colors.textMuted}
                  multiline
                />

                <Pressable
                  style={[styles.saveButton, (!canSaveBody || savingBody) && styles.saveButtonDisabled]}
                  onPress={handleSaveBodyLog}
                  disabled={!canSaveBody || savingBody}
                  hitSlop={8}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.history}>
              {bodyLogs.length === 0 ? (
                <Text style={styles.emptyText}>No entries yet.</Text>
              ) : (
                bodyLogs.map((log, index) => {
                  const prev = bodyLogs[index + 1];
                  const delta =
                    log.weight !== null && prev && prev.weight !== null
                      ? Math.abs(log.weight - prev.weight)
                      : null;
                  const measurements = measurementsSummary(log);
                  return (
                    <View key={log.id} style={styles.historyRow}>
                      <Text style={styles.historyText}>
                        {log.date}
                        {log.weight !== null ? ` · ${log.weight.toFixed(1)} ${weightUnit}` : ''}
                      </Text>
                      {measurements.length > 0 && (
                        <Text style={styles.historySub}>{measurements}</Text>
                      )}
                      {delta !== null && (
                        <Text style={styles.historySub}>changed {delta.toFixed(1)} {weightUnit}</Text>
                      )}
                      {log.notes && <Text style={styles.historySub}>{log.notes}</Text>}
                    </View>
                  );
                })
              )}
            </View>
          </CollapsibleCard>

          {calorieTrackingEnabled && (
            <CollapsibleCard title="Calories">
              <CalorieBarChart data={calorieChartData} />

              <Pressable
                style={styles.logButton}
                onPress={() => setShowCalorieForm((prev) => !prev)}
                hitSlop={8}
              >
                <Text style={styles.logButtonText}>{showCalorieForm ? 'Cancel' : 'Log entry'}</Text>
              </Pressable>

              {showCalorieForm && (
                <View style={styles.form}>
                  <Text style={styles.fieldLabel}>Date</Text>
                  <TextInput
                    style={styles.input}
                    value={calorieDate}
                    onChangeText={setCalorieDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Text style={styles.fieldLabel}>Total calories</Text>
                  <TextInput
                    style={styles.input}
                    value={calorieValue}
                    onChangeText={setCalorieValue}
                    keyboardType="number-pad"
                    placeholder="Total for the day"
                    placeholderTextColor={colors.textMuted}
                  />

                  <Pressable
                    style={[styles.saveButton, (!canSaveCalorie || savingCalorie) && styles.saveButtonDisabled]}
                    onPress={handleSaveCalorieLog}
                    disabled={!canSaveCalorie || savingCalorie}
                    hitSlop={8}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.history}>
                {calorieLogs.length === 0 ? (
                  <Text style={styles.emptyText}>No entries yet.</Text>
                ) : (
                  calorieLogs.map((log) => (
                    <View key={log.id} style={styles.historyRow}>
                      <Text style={styles.historyText}>
                        {log.date} · {log.total_calories} kcal
                      </Text>
                      {log.notes && <Text style={styles.historySub}>{log.notes}</Text>}
                    </View>
                  ))
                )}
              </View>
            </CollapsibleCard>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.screen,
    gap: spacing.cardGap,
  },
  disabledText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
  skeleton: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.large,
  },
  skeletonCard: {
    height: 180,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  logButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 12,
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  form: {
    marginTop: 12,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.08 * 12,
    textTransform: 'uppercase',
    color: colors.textSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.small,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  rowItem: {
    flex: 1,
    gap: 8,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  history: {
    marginTop: 16,
    gap: 12,
  },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 2,
  },
  historyText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  historySub: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  calorieChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CALORIE_BAR_MAX_HEIGHT + 40,
  },
  calorieColumn: {
    flex: 1,
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  calorieBarTrack: {
    height: CALORIE_BAR_MAX_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  calorieBar: {
    width: 18,
    borderRadius: 6,
    backgroundColor: colors.surfaceHigh,
  },
  calorieDayLabel: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textMuted,
  },
});
