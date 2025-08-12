import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SwipeListView } from 'react-native-swipe-list-view';
import React, { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { Alert } from 'react-native';
import { Dimensions } from 'react-native';
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
import { deleteWorkoutSafe } from '../../backend/repositories/workoutsRepo';
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
  const [showAddConfirm, setShowAddConfirm] = useState(false);
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);
  const [editingWorkoutName, setEditingWorkoutName] = useState('');
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

  // Circular arrangement for body parts (restore previous logic)
  const filteredBodyParts = bodyParts;
  // Responsive circles and container
  const CIRCLE_SIZE = 110;
  const FONT_SIZE = 13;
  const deviceWidth = Dimensions.get('window').width;
  // Container width: min(deviceWidth, 340) for small screens, max 420 for large screens
  const CONTAINER_SIZE = Math.min(Math.max(deviceWidth - 32, 340), 420);
  const radius = CONTAINER_SIZE / 2 - CIRCLE_SIZE / 2 - 10;
  const count = filteredBodyParts.length;
  const angleStep = (2 * Math.PI) / count;

  function getCirclePosition(idx: number) {
    const angle = idx * angleStep - Math.PI / 2;
    const center = CONTAINER_SIZE / 2 - CIRCLE_SIZE / 1.9;
    return {
      position: 'absolute',
      left: center + radius * Math.cos(angle),
      top: center + radius * Math.sin(angle),
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
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
      <View style={{ height: CONTAINER_SIZE, justifyContent: 'flex-start', alignItems: 'center', marginTop: 12 }}>
        <View style={{ width: CONTAINER_SIZE, height: CONTAINER_SIZE, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
          {filteredBodyParts.map((bp, idx) => (
            <CircleButton
              key={bp.id}
              label={bp.name.toUpperCase()}
              active={bp.id === selectedBodyPartId}
              onPress={() => setSelectedBodyPartId(bp.id)}
              style={getCirclePosition(idx)}
              fontSize={FONT_SIZE}
            />
          ))}
        </View>
      </View>

      {/* Scrollable workout list below */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.h2, { marginTop: 16 }]}> 
          Workouts {selectedBodyPartName ? `· ${selectedBodyPartName}` : ''}
        </Text>
        <SwipeListView
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
  renderHiddenItem={({ item }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, justifyContent: 'flex-end', backgroundColor: '#222', borderRadius: 14, marginVertical: 8, paddingRight: 8 }}>
      <Pressable
        style={{ backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center', minWidth: 65, height: 44, borderRadius: 12, marginRight: 8, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
        onPress={() => {
          setEditingWorkoutId(item.id);
          setEditingWorkoutName(item.name);
        }}
      >
        <Text style={{ color: '#111', fontWeight: 'bold', fontSize: 16 }}>Edit</Text>
      </Pressable>
      <Pressable
        style={{ backgroundColor: '#d9534f', justifyContent: 'center', alignItems: 'center', minWidth: 65, height: 44, borderRadius: 12, shadowColor: '#d9534f', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
        onPress={async () => {
          Alert.alert('Delete Workout', `Are you sure you want to delete "${item.name}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete', style: 'destructive', onPress: async () => {
                const result = await deleteWorkoutSafe(item.id);
                if (result.ok) {
                  setWorkouts(workouts.filter(w => w.id !== item.id));
                } else {
                  Alert.alert('Cannot delete', result.reason || 'Unknown error');
                }
              }
            }
          ]);
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Delete</Text>
      </Pressable>
    </View>
  )}
  rightOpenValue={-160}
  disableRightSwipe
/>

        {/* Edit workout modal (simple inline for now) */}
        {editingWorkoutId !== null && (
          <View style={{ position: 'absolute', top: 80, left: 0, right: 0, backgroundColor: '#222', padding: 24, borderRadius: 16, zIndex: 10, alignItems: 'center', shadowColor: '#FFD700', shadowOpacity: 0.2, shadowRadius: 8 }}>
            <Text style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Edit Workout</Text>
            <TextInput
              value={editingWorkoutName}
              onChangeText={setEditingWorkoutName}
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="Workout name"
              placeholderTextColor="#9aa0a6"
              returnKeyType="done"
              onSubmitEditing={async () => {
                const name = editingWorkoutName.trim();
                if (!name) return;
                await upsertWorkout(name, selectedBodyPartId!);
                setEditingWorkoutId(null);
                setEditingWorkoutName('');
                const list = await listWorkoutsByBodyPart(selectedBodyPartId!);
                setWorkouts(list);
              }}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                style={{ backgroundColor: '#FFD700', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginRight: 8 }}
                onPress={async () => {
                  const name = editingWorkoutName.trim();
                  if (!name) return;
                  await upsertWorkout(name, selectedBodyPartId!);
                  setEditingWorkoutId(null);
                  setEditingWorkoutName('');
                  const list = await listWorkoutsByBodyPart(selectedBodyPartId!);
                  setWorkouts(list);
                }}
              >
                <Text style={{ color: '#111', fontWeight: 'bold' }}>Save</Text>
              </Pressable>
              <Pressable
                style={{ backgroundColor: '#222', borderColor: '#FFD700', borderWidth: 2, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 }}
                onPress={() => {
                  setEditingWorkoutId(null);
                  setEditingWorkoutName('');
                }}
              >
                <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Add workout */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ width: '100%', flex: 0 }}
        >
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
              // Removed global.scrollRef workaround; rely on KeyboardAvoidingView
              onSubmitEditing={() => setShowAddConfirm(true)}
            />
            <Pressable style={styles.addBtn} onPress={() => setShowAddConfirm(true)}>
              <Text style={styles.addBtnText}>Add</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Confirm dialog for adding workout */}
        {showAddConfirm && newWorkoutName.trim() !== "" && (
          <ConfirmDialog
            visible={showAddConfirm}
            title="Add Workout"
            message={`Do you want to add "${newWorkoutName.trim()}" as a workout?`}
            confirmText="Add"
            cancelText="Cancel"
            onConfirm={async () => {
              setShowAddConfirm(false);
              await handleAddWorkout();
            }}
            onCancel={() => setShowAddConfirm(false)}
          />
        )}
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
