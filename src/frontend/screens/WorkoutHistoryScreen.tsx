import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, FlatList, StyleSheet, ActivityIndicator, View, Pressable, Alert, Dimensions } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { getWorkoutHistory, listSetsForLog, deleteWorkoutLog } from '../../backend/repositories/logsRepo';
import type { Workout } from '../../db/types';

type Props = {
  workout: Workout;
  onBack: () => void;
};

export default function WorkoutHistoryScreen({ workout, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<
    { log_id: number; logged_at: string; set_count: number; total_volume: number | null; sets?: Array<{ set_number: number; reps: number; weight: number }> }[]
  >([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        // Only last 10 logs
        const data = await getWorkoutHistory(workout.id, 10, 0);
        // For each log, fetch its sets
        const withSets = await Promise.all(
          data.map(async log => {
            const sets = await listSetsForLog(log.log_id);
            return {
              ...log,
              sets: sets.map(s => ({ set_number: s.set_number, reps: s.reps, weight: s.weight })),
            };
          })
        );
        setRows(withSets);
      } finally {
        setLoading(false);
      }
    })();
  }, [workout.id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.textDim}>Loading history…</Text>
      </SafeAreaView>
    );
  }

  const deviceWidth = Dimensions.get('window').width;
  const maxHeaderWidth = deviceWidth - 64;
  return (
    <SafeAreaView style={[styles.safe, { flex: 1 }]}> 
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <View style={{ flex: 1, maxWidth: maxHeaderWidth }}>
          <Text
            style={styles.h1}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {`History · ${workout.name}`}
          </Text>
        </View>
      </View>
      <View style={{ height: 12 }} />

      <SwipeListView
        data={rows}
        keyExtractor={r => String(r.log_id)}
        ListEmptyComponent={<Text style={styles.textDim}>No sessions yet.</Text>}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => {
          const expanded = expandedId === item.log_id;
          return (
            <Pressable
              style={[styles.row, expanded ? styles.rowExpanded : null]}
              onPress={() => setExpandedId(expanded ? null : item.log_id)}
            >
              <Text style={styles.title}>{new Date(item.logged_at).toLocaleString()}</Text>
              {expanded && item.sets && item.sets.length > 0 ? (
                <View style={{ marginTop: 6, marginLeft: 12 }}>
                  {item.sets.map(set => (
                    <Text key={set.set_number} style={styles.setText}>
                      {`Set ${set.set_number}: ${set.reps} x ${set.weight} lbs`}
                    </Text>
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        }}
        renderHiddenItem={({ item }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 70, justifyContent: 'flex-end', backgroundColor: '#222', borderRadius: 14, marginVertical: 8, paddingRight: 8 }}>
            <Pressable
              style={{ backgroundColor: '#d9534f', justifyContent: 'center', alignItems: 'center', minWidth: 90, height: 44, borderRadius: 12, shadowColor: '#d9534f', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
              onPress={() => {
                Alert.alert('Delete Log', 'Are you sure you want to delete this log? This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                      try {
                        await deleteWorkoutLog(item.log_id);
                        setRows(rows.filter(r => r.log_id !== item.log_id));
                      } catch (e) {
                        Alert.alert('Error', 'Could not delete log.');
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
        rightOpenValue={-100}
        disableRightSwipe
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111', padding: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  h1: { fontSize: 24, fontWeight: '900', color: '#FFD700', marginLeft: 8, letterSpacing: 1 },
  textDim: { color: '#bfae60', marginTop: 8 },
  row: {
    height: 70,
    paddingHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    backgroundColor: '#222',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    justifyContent: 'center',
  },
  rowExpanded: {
    minHeight: 120,
    height: 'auto',
    paddingVertical: 18,
  },
  title: { color: '#FFD700', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 },
  sub: { color: '#bfae60', marginTop: 4, fontWeight: '600', fontSize: 15 },
  setText: { color: '#FFD700', fontWeight: '700', fontSize: 15, marginBottom: 2, marginLeft: 8 },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    marginRight: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backBtnText: { color: '#111', fontWeight: '900', fontSize: 16 },
});
