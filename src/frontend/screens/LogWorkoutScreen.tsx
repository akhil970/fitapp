import React, { useState } from 'react';
import {
  SafeAreaView, View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert,
} from 'react-native';
import { createWorkoutLog, addSet } from '../../backend/repositories/logsRepo';
import type { Workout } from '../../db/types';

type Props = {
  workout: Workout;                 // selected workout to log
  onDone: () => void;               // callback to go back
};

type EditableSet = { id: string; setNumber: number; reps: string; weight: string };

export default function LogWorkoutScreen({ workout, onDone }: Props) {
  // keep small in-memory list of sets user will save
  const [sets, setSets] = useState<EditableSet[]>([
    { id: 's1', setNumber: 1, reps: '', weight: '' },
  ]);
  const [saving, setSaving] = useState(false);

  function addEmptyRow() {
    setSets(prev => [
      ...prev,
      { id: `s${prev.length + 1}`, setNumber: prev.length + 1, reps: '', weight: '' },
    ]);
  }

  function updateRow(id: string, patch: Partial<EditableSet>) {
    setSets(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function saveSession() {
    // basic validation: at least one complete row
    const toSave = sets
      .map(s => ({ ...s, repsNum: Number(s.reps), weightNum: Number(s.weight) }))
      .filter(s => Number.isFinite(s.repsNum) && Number.isFinite(s.weightNum) && s.repsNum > 0 && s.weightNum > 0);

    if (toSave.length === 0) {
      Alert.alert('Nothing to save', 'Enter reps and weight for at least one set.');
      return;
    }

    try {
      setSaving(true);
      const logId = await createWorkoutLog(workout.id); // one session
      // insert each valid set
      for (const s of toSave) {
        await addSet(logId, s.setNumber, s.repsNum, s.weightNum);
      }
      Alert.alert('Saved', 'Workout session saved.', [{ text: 'OK', onPress: onDone }]);
    } catch (e) {
      console.error('save session failed:', e);
      Alert.alert('Error', 'Could not save this session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.h1}>Log Workout</Text>
      <Text style={styles.subtitle}>{workout.name}</Text>

      <FlatList
        data={sets}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.setLabel}>Set {item.setNumber}</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Reps"
              placeholderTextColor="#9aa0a6"
              value={item.reps}
              onChangeText={t => updateRow(item.id, { reps: t })}
            />
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="Weight"
              placeholderTextColor="#9aa0a6"
              value={item.weight}
              onChangeText={t => updateRow(item.id, { weight: t })}
            />
          </View>
        )}
        ListFooterComponent={
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={addEmptyRow}>
            <Text style={[styles.btnText, { color: '#111' }]}>+ Add set</Text>
          </Pressable>
        }
      />

      <View style={{ height: 12 }} />

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable style={[styles.btn, styles.btnGhost]} onPress={onDone} disabled={saving}>
          <Text style={[styles.btnText, { color: '#111' }]}>Cancel</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={saveSession} disabled={saving}>
          <Text style={styles.btnText}>{saving ? 'Saving…' : 'Save session'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', padding: 16 },
  h1: { fontSize: 20, fontWeight: '700', color: '#111' },
  subtitle: { color: '#5f6368', marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  setLabel: { width: 64, color: '#111', fontWeight: '600' },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 10,
    color: '#111',
  },
  btn: {
    height: 44, paddingHorizontal: 16, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flex: 1,
  },
  btnPrimary: { backgroundColor: '#111' },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#dadce0' },
  btnText: { color: '#fff', fontWeight: '600' },
});
