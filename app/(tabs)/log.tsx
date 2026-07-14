import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, radii, spacing } from '../../constants/colors';
import { useDatabaseContext } from '../../context/DatabaseContext';
import { useSettings } from '../../context/SettingsContext';
import { calculateDrops } from '../../lib/bucket_service';
import {
  getOrCreateTag,
  getQuickAccessTags,
  logWorkoutWithTags,
  type LogWorkoutInput,
} from '../../lib/flux-workout-service';
import type { DropResult, Sentiment, TagCategory } from '../../lib/flux-types';
import TagChip from '../../components/TagChip';
import CollapsibleCard from '../../components/CollapsibleCard';
import PostWorkoutNudge from '../../components/PostWorkoutNudge';

const ACTIVITIES = [
  'Walk',
  'Run',
  'Strength',
  'Bodyweight',
  'Yoga',
  'Stretch',
  'Cycle',
  'Swim',
  'Sport',
  'HIIT',
  'Other',
];

const MOODS = [1, 2, 3, 4, 5] as const;
const MOOD_EMOJI: Record<(typeof MOODS)[number], string> = {
  1: '😖',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '🤩',
};

interface TagRow {
  id: number;
  label: string;
  category: TagCategory;
  sentiment: Sentiment;
  is_preset: number;
  use_count: number;
}

function todayLocal(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function categoryTitle(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default function LogScreen() {
  const router = useRouter();
  const db = useDatabaseContext();
  const { settings } = useSettings();
  const params = useLocalSearchParams<{ activityType?: string }>();
  const reduceMotion = settings.reduce_animations === 'true';
  const calorieTrackingEnabled = settings.calorie_tracking === 'true';

  const [activityType, setActivityType] = useState<string | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [quickTags, setQuickTags] = useState<TagRow[]>([]);
  const [presetTags, setPresetTags] = useState<TagRow[]>([]);
  const [customTags, setCustomTags] = useState<TagRow[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [customTagLabel, setCustomTagLabel] = useState('');
  const [calorieValue, setCalorieValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [nudge, setNudge] = useState<DropResult | null>(null);

  // Pre-select the activity suggested by the Home screen, if it matches a preset.
  useEffect(() => {
    if (params.activityType && ACTIVITIES.includes(params.activityType)) {
      setActivityType(params.activityType);
    }
  }, [params.activityType]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const quick = (await getQuickAccessTags(db, 6)) as TagRow[];
        if (!cancelled) setQuickTags(quick);
      } catch (err) {
        console.warn('[flux] failed to load quick tags', err);
      }

      try {
        const presets = await db.getAllAsync<TagRow>(
          `SELECT * FROM tags WHERE is_preset = 1 ORDER BY category`
        );
        if (!cancelled) setPresetTags(presets);
      } catch (err) {
        console.warn('[flux] failed to load preset tags', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  const groupedPresets = useMemo(() => {
    const groups = new Map<string, TagRow[]>();
    for (const tag of presetTags) {
      const list = groups.get(tag.category) ?? [];
      list.push(tag);
      groups.set(tag.category, list);
    }
    return Array.from(groups.entries());
  }, [presetTags]);

  const durationMinutes = useMemo(() => {
    const parsed = Number(duration);
    return duration.trim() && Number.isFinite(parsed) ? parsed : null;
  }, [duration]);

  const dropPreview = useMemo(
    () => calculateDrops(durationMinutes, mood),
    [durationMinutes, mood]
  );

  const toggleMood = useCallback((level: number) => {
    setMood((prev) => (prev === level ? null : level));
  }, []);

  const toggleTag = useCallback((id: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]
    );
  }, []);

  const handleAddCustomTag = useCallback(async () => {
    const label = customTagLabel.trim();
    if (!label) return;
    try {
      const tagId = await getOrCreateTag(db, label);
      setCustomTags((prev) =>
        prev.some((t) => t.id === tagId)
          ? prev
          : [
              ...prev,
              { id: tagId, label, category: 'custom', sentiment: 'neutral', is_preset: 0, use_count: 0 },
            ]
      );
      setSelectedTagIds((prev) => (prev.includes(tagId) ? prev : [...prev, tagId]));
      setCustomTagLabel('');
    } catch (err) {
      console.warn('[flux] failed to add custom tag', err);
    }
  }, [customTagLabel, db]);

  const resetForm = useCallback(() => {
    setActivityType(null);
    setMood(null);
    setDuration('');
    setSelectedTagIds([]);
    setCustomTagLabel('');
    setCustomTags([]);
    setCalorieValue('');
  }, []);

  const handleDone = useCallback(async () => {
    if (!activityType || busy) return;
    setBusy(true);
    try {
      const uniqueTagIds = [...new Set(selectedTagIds)];
      const workout: LogWorkoutInput = {
        date: todayLocal(),
        activityType,
        durationMinutes: durationMinutes ?? undefined,
        moodAfter: mood ?? undefined,
        source: 'manual',
      };
      const { dropResult } = await logWorkoutWithTags(db, workout, uniqueTagIds);

      if (calorieTrackingEnabled && calorieValue.trim()) {
        const calories = Number(calorieValue);
        if (Number.isFinite(calories)) {
          await db.runAsync(
            `INSERT INTO calorie_logs (date, total_calories) VALUES (?, ?)
             ON CONFLICT(date) DO UPDATE SET total_calories = excluded.total_calories`,
            [todayLocal(), calories]
          );
        }
      }

      setNudge(dropResult);
    } catch (err) {
      console.warn('[flux] failed to log workout', err);
    } finally {
      setBusy(false);
    }
  }, [activityType, busy, selectedTagIds, durationMinutes, mood, db, calorieTrackingEnabled, calorieValue]);

  const handleNudgeDone = useCallback(() => {
    setNudge(null);
    resetForm();
    router.replace('/(tabs)');
  }, [resetForm, router]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>Activity</Text>
        <View style={styles.chipRow}>
          {ACTIVITIES.map((name) => (
            <TagChip
              key={name}
              label={name}
              sentiment="neutral"
              selected={activityType === name}
              onPress={() => setActivityType(name)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Mood after</Text>
        <View style={styles.moodRow}>
          {MOODS.map((level) => (
            <Pressable
              key={level}
              onPress={() => toggleMood(level)}
              hitSlop={8}
              style={[styles.moodButton, mood === level && styles.moodButtonSelected]}
            >
              <Text style={styles.moodEmoji}>{MOOD_EMOJI[level]}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          placeholder="Optional"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.dropPreview}>~+{dropPreview} drops</Text>

        <Text style={styles.sectionLabel}>Tags</Text>
        <View style={styles.chipRow}>
          {quickTags.map((tag) => (
            <TagChip
              key={tag.id}
              label={tag.label}
              sentiment={tag.sentiment}
              selected={selectedTagIds.includes(tag.id)}
              onPress={() => toggleTag(tag.id)}
              small
            />
          ))}
        </View>

        {customTags.length > 0 && (
          <View style={styles.chipRow}>
            {customTags.map((tag) => (
              <TagChip
                key={tag.id}
                label={tag.label}
                sentiment={tag.sentiment}
                selected={selectedTagIds.includes(tag.id)}
                onPress={() => toggleTag(tag.id)}
                small
              />
            ))}
          </View>
        )}

        <View style={styles.customTagRow}>
          <TextInput
            style={[styles.input, styles.customTagInput]}
            value={customTagLabel}
            onChangeText={setCustomTagLabel}
            placeholder="Add a custom tag"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={handleAddCustomTag}
          />
          <Pressable style={styles.addButton} onPress={handleAddCustomTag} hitSlop={8}>
            <Text style={styles.addButtonText}>Add</Text>
          </Pressable>
        </View>

        {groupedPresets.map(([category, tags]) => (
          <CollapsibleCard key={category} title={categoryTitle(category)} defaultCollapsed>
            <View style={styles.chipRow}>
              {tags.map((tag) => (
                <TagChip
                  key={tag.id}
                  label={tag.label}
                  sentiment={tag.sentiment}
                  selected={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                  small
                />
              ))}
            </View>
          </CollapsibleCard>
        ))}

        {calorieTrackingEnabled && (
          <>
            <Text style={styles.sectionLabel}>Calories today (optional)</Text>
            <TextInput
              style={styles.input}
              value={calorieValue}
              onChangeText={setCalorieValue}
              keyboardType="number-pad"
              placeholder="Optional"
              placeholderTextColor={colors.textMuted}
            />
          </>
        )}

        <Pressable
          style={[styles.doneButton, (!activityType || busy) && styles.doneButtonDisabled]}
          onPress={handleDone}
          disabled={!activityType || busy}
          hitSlop={8}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={nudge !== null} transparent animationType={reduceMotion ? 'none' : 'fade'} onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {nudge && (
              <PostWorkoutNudge dropResult={nudge} onDone={handleNudgeDone} reduceMotion={reduceMotion} />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.screen,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.08 * 13,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: 52,
    height: 52,
    borderRadius: radii.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodButtonSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  moodEmoji: {
    fontSize: 24,
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
  dropPreview: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  customTagRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.surfaceHigh,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.small,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  doneButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.medium,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  doneButtonDisabled: {
    opacity: 0.4,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.large,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
  },
});
