import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { listBodyParts } from '../../backend/repositories/bodyPartsRepo';
import { listWorkoutsByBodyPart, upsertWorkout } from '../../backend/repositories/workoutsRepo';
import type { BodyPart, Workout } from '../../db/types';

/**
 * Minimal screen:
 * 1) Load body parts
 * 2) When a body part is selected, load its workouts
 * 3) Allow adding a workout (unique per body part thanks to DB index)
 */
type Props = { onSelectWorkout?: (w: Workout) => void; onViewHistory?: (w: Workout) => void };
export default function SelectWorkoutScreen({ onSelectWorkout, onViewHistory }: Props) {
  const [loading, setLoading] = useState(true);
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [selectedBodyPartId, setSelectedBodyPartId] = useState<number | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [newWorkoutName, setNewWorkoutName] = useState('');

  // Load body parts once
  useEffect(() => {
    (async () => {
      try {
        const list = await listBodyParts();
        setBodyParts(list);
        // preselect first body part if available
        if (list.length) setSelectedBodyPartId(list[0].id);
      } catch (e) {
        console.error('load body parts failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load workouts when selection changes
  useEffect(() => {
    if (!selectedBodyPartId) return;
    (async () => {
      try {
        const list = await listWorkoutsByBodyPart(selectedBodyPartId);
        setWorkouts(list);
      } catch (e) {
        console.error('load workouts failed:', e);
      }
    })();
  }, [selectedBodyPartId]);

  const selectedBodyPartName = useMemo(
    () => bodyParts.find(b => b.id === selectedBodyPartId)?.name ?? '',
    [bodyParts, selectedBodyPartId]
  );

  async function handleAddWorkout() {
    const name = newWorkoutName.trim();
    if (!name || !selectedBodyPartId) return;
    try {
      await upsertWorkout(name, selectedBodyPartId);
      setNewWorkoutName('');
      const list = await listWorkoutsByBodyPart(selectedBodyPartId);
      setWorkouts(list);
    } catch (e) {
      console.error('add workout failed:', e);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={styles.textDim}>Loading…</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <SafeAreaView style={styles.safe}>
        {/* Body parts */}
        <Text style={styles.h1}>Select Body Part</Text>
        <FlatList
          horizontal
          data={bodyParts}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingVertical: 8 }}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => {
            const active = item.id === selectedBodyPartId;
            return (
              <Pressable
                onPress={() => setSelectedBodyPartId(item.id)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
              </Pressable>
            );
          }}
        />

        {/* Workouts list for selected body part */}
        <Text style={[styles.h2, { marginTop: 16 }]}>
          Workouts {selectedBodyPartName ? `· ${selectedBodyPartName}` : ''}
        </Text>
        <FlatList
          data={workouts}
          keyExtractor={item => String(item.id)}
          ListEmptyComponent={<Text style={styles.textDim}>No workouts yet.</Text>}
          renderItem={({ item }) => (
            <Pressable
            style={styles.row}
            onPress={() => onSelectWorkout?.(item)}          // tap → log screen
            onLongPress={() => onViewHistory?.(item)}       // long-press → history
            delayLongPress={350}>
            <Text style={styles.rowText}>{item.name}</Text>
            </Pressable>
          )}
        />

        
        {/* Add workout */}
        <View style={{ height: 12 }} />
        <Text style={styles.h3}>Add a workout</Text>
        <View style={styles.addRow}>
          <TextInput
            value={newWorkoutName}
            onChangeText={setNewWorkoutName}
            placeholder="e.g., Bench Press"
            placeholderTextColor="#9aa0a6"
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleAddWorkout}
          />
          <Pressable style={styles.addBtn} onPress={handleAddWorkout}>
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 20, fontWeight: '700', color: '#111' },
  h2: { fontSize: 16, fontWeight: '600', color: '#111' },
  h3: { fontSize: 14, fontWeight: '600', color: '#111' },
  textDim: { color: '#5f6368', marginTop: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#111' },
  chipText: { color: '#111' },
  chipTextActive: { color: '#fff' },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  rowText: { color: '#111', fontSize: 16 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    color: '#111',
  },
  addBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
});
