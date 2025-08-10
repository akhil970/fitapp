import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, FlatList, StyleSheet, ActivityIndicator, View, Pressable } from 'react-native';
import { getWorkoutHistory } from '../../backend/repositories/logsRepo';
import type { Workout } from '../../db/types';

type Props = {
  workout: Workout;
  onBack: () => void;
};

export default function WorkoutHistoryScreen({ workout, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<
    { log_id: number; logged_at: string; set_count: number; total_volume: number | null }[]
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getWorkoutHistory(workout.id, 50, 0);
        setRows(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [workout.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" />
        <Text style={styles.dim}>Loading history…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Pressable onPress={onBack} style={styles.backBtn}><Text style={{ color: '#111' }}>← Back</Text></Pressable>
        <Text style={styles.h1}>History · {workout.name}</Text>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.log_id)}
        ListEmptyComponent={<Text style={styles.dim}>No sessions yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.title}>{new Date(item.logged_at).toLocaleString()}</Text>
            <Text style={styles.sub}>
              Sets: {item.set_count}  •  Volume: {item.total_volume ?? 0}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 18, fontWeight: '700', color: '#111', marginLeft: 8 },
  dim: { color: '#5f6368', marginTop: 8 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  title: { color: '#111', fontWeight: '600' },
  sub: { color: '#5f6368', marginTop: 4 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderColor: '#dadce0', borderRadius: 8 },
});
