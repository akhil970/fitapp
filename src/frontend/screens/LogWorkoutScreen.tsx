import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import ConfirmDialog from '../../ui/ConfirmDialog';
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
  const [showConfirm, setShowConfirm] = useState(false);

  function addEmptyRow() {
    setSets(prev => [
      ...prev,
      { id: `s${prev.length + 1}`, setNumber: prev.length + 1, reps: '', weight: '' },
    ]);
  }

  function updateRow(id: string, patch: Partial<EditableSet>) {
    setSets(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  function handleSavePress() {
    // basic validation: at least one complete row
    const toSave = sets
      .map(s => ({ ...s, repsNum: Number(s.reps), weightNum: Number(s.weight) }))
      .filter(s => Number.isFinite(s.repsNum) && Number.isFinite(s.weightNum) && s.repsNum > 0 && s.weightNum > 0);
    if (toSave.length === 0) {
      Alert.alert('Nothing to save', 'Enter reps and weight for at least one set.');
      return;
    }
    setShowConfirm(true);
  }

  async function saveSession() {
    const toSave = sets
      .map(s => ({ ...s, repsNum: Number(s.reps), weightNum: Number(s.weight) }))
      .filter(s => Number.isFinite(s.repsNum) && Number.isFinite(s.weightNum) && s.repsNum > 0 && s.weightNum > 0);
    try {
      setSaving(true);
      const logId = await createWorkoutLog(workout.id); // one session
      for (const s of toSave) {
        await addSet(logId, s.setNumber, s.repsNum, s.weightNum);
      }
      setShowConfirm(false);
      Alert.alert('Saved', 'Workout session saved.', [{ text: 'OK', onPress: onDone }]);
    } catch (e) {
      console.error('save session failed:', e);
      Alert.alert('Error', 'Could not save this session.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { flex: 1 }]}> 
      {/* Header section themed */}
      <View style={{ marginTop: 16, marginBottom: 24, alignItems: 'center' }}>
        <Text style={styles.h1}>Log Workout</Text>
        <Text style={styles.h2}>{workout.name}</Text>
        <Text style={styles.textDim}>Record your sets below</Text>
      </View>

      <View style={{ flex: 1 }}>
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
                placeholderTextColor="#bfae60"
                value={item.reps}
                onChangeText={t => updateRow(item.id, { reps: t })}
              />
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                placeholder="Weight in Lbs"
                placeholderTextColor="#bfae60"
                value={item.weight}
                onChangeText={t => updateRow(item.id, { weight: t })}
              />
            </View>
          )}
          ListFooterComponent={
            <Pressable style={styles.addBtn} onPress={addEmptyRow}>
              <Text style={styles.addBtnText}>+ Add set</Text>
            </Pressable>
          }
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{ width: '100%', flex: 0 }}
        >
          <View style={{ height: 12 }} />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <Pressable style={styles.cancelBtn} onPress={onDone} disabled={saving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSavePress} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save session'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
      {/* ConfirmDialog for save session */}
      <ConfirmDialog
        visible={showConfirm}
        title="Confirm Session"
        message="Do you want to confirm this session?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={saveSession}
        onCancel={() => setShowConfirm(false)}
      >
        {sets
          .filter(s => Number(s.reps) > 0 && Number(s.weight) > 0)
          .map(s => (
            <Text
              key={s.id}
              style={{ color: '#FFD700', fontWeight: '700', fontSize: 16, marginBottom: 4 }}
            >
              {`Set ${s.setNumber}: ${s.reps} x ${s.weight} lbs`}
            </Text>
          ))}
      </ConfirmDialog>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111', padding: 16 },
  h1: { fontSize: 28, fontWeight: '900', color: '#FFD700', letterSpacing: 1, marginBottom: 8 },
  h2: { fontSize: 20, fontWeight: '700', color: '#FFD700', marginBottom: 4 },
  textDim: { color: '#bfae60', marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#222',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  setLabel: { width: 64, color: '#FFD700', fontWeight: '700', fontSize: 16 },
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
    fontSize: 16,
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
    marginTop: 8,
  },
  addBtnText: { color: '#111', fontWeight: '900', fontSize: 16 },
  cancelBtn: {
    height: 44,
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  cancelBtnText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16 },
  saveBtn: {
    height: 44,
    flex: 1,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnText: { color: '#111', fontWeight: '900', fontSize: 16 },
});
