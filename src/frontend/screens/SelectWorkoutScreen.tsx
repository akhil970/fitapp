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
import { listWorkoutsByBodyPart } from '../../backend/repositories/workoutsRepo';
import { upsertWorkout } from '../../backend/repositories/workoutsRepo';
import type { BodyPart, Workout } from '../../db/types';
import { upsertBodyPart } from '../../backend/repositories/bodyPartsRepo';
import CircleButton from '../../ui/CircleButton';

/*
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

  // ...existing code...
  useEffect(() => {
    (async () => {
      try {
        const list = await listBodyParts();
        setBodyParts(list);
        if (list.length) setSelectedBodyPartId(list[0].id);
      } catch (e) {
        console.error('load body parts failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  // Circular arrangement for body parts
  const filteredBodyParts = bodyParts.filter(bp => bp.name !== 'Arms');
  const radius = 110;
  const centerX = 0;
  const centerY = 0;
  const count = filteredBodyParts.length;
  const angleStep = (2 * Math.PI) / count;

  function getCirclePosition(idx: number) {
    const angle = idx * angleStep - Math.PI / 2;
    // Center the circles within a 270x270 container (for 90x90 circles)
    const containerSize = 270;
    const circleSize = 90;
    const center = containerSize / 2 - circleSize / 2;
        return {
          position: 'absolute',
          left: center + radius * Math.cos(angle),
          top: center + radius * Math.sin(angle),
        } as import('react-native').ViewStyle;
  }

  return (
    <SafeAreaView style={[styles.safe, { flex: 1 }]}> 
      {/* Welcome and quote section */}
      <View style={{ marginTop: 16, marginBottom: 24, alignItems: 'center' }}>
        {/* Commenting out next line for dynamic rendering of username from database */}
  {/* <Text style={{ color: '#FFD700', fontSize: 26, fontWeight: '900', letterSpacing: 1 }}>Hi {'<Username>'}</Text> */}
        <Text style={{ color: '#FFD700', fontSize: 26, fontWeight: '900', letterSpacing: 1 }}>Hi AK</Text>
        <Text style={{ color: '#bfae60', fontSize: 14, fontWeight: '600', marginTop: 4, textAlign: 'center' }}>
          Building for Courage and Wisdom
        </Text>
      </View>
      {/* Fixed body part selector, placed lower for spacing */}
      <View style={{ height: 270, justifyContent: 'flex-start', alignItems: 'center', marginTop: 12 }}>
        <View style={{ width: 270, height: 270, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
          {filteredBodyParts.map((bp, idx) => (
            <CircleButton
              key={bp.id}
              label={bp.name.toUpperCase()}
              active={bp.id === selectedBodyPartId}
              onPress={() => setSelectedBodyPartId(bp.id)}
              style={getCirclePosition(idx)}
            />
          ))}
        </View>
      </View>

      {/* Scrollable workout list below */}
      <View style={{ flex: 1 }}>
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
              onPress={() => onSelectWorkout?.(item)}
              onLongPress={() => onViewHistory?.(item)}
              delayLongPress={350}
            >
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111', padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 28, fontWeight: '900', color: '#FFD700', letterSpacing: 1, marginBottom: 8 },
  h2: { fontSize: 20, fontWeight: '700', color: '#FFD700', marginBottom: 8 },
  h3: { fontSize: 16, fontWeight: '700', color: '#FFD700', marginBottom: 4 },
  textDim: { color: '#bfae60', marginTop: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#222',
    marginHorizontal: 4,
  },
  chipActive: { backgroundColor: '#FFD700' },
  chipText: { color: '#FFD700', fontWeight: '700' },
  chipTextActive: { color: '#111' },
  row: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    backgroundColor: '#222',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  rowText: { color: '#FFD700', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    color: '#FFD700',
    backgroundColor: '#222',
    fontWeight: '700',
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addBtnText: { color: '#111', fontWeight: '900', fontSize: 16 },
});
