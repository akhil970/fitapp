import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { getWeightsAndRepsForWorkout } from '../../backend/repositories/logsDashboardRepo';
import { listWorkoutsByBodyPart, listWorkoutsWithBodyPart } from '../../backend/repositories/workoutsRepo';
import { getBodyPartIdByName } from '../../backend/repositories/bodyPartsRepo';

export default function WorkoutDashboardScreen({ onBack }: { onBack: () => void }) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [selectedArmsGroup, setSelectedArmsGroup] = useState<string | null>(null);
  const [charts, setCharts] = useState<any>({});
  const [armsCharts, setArmsCharts] = useState<any>({});
  const screenWidth = Dimensions.get('window').width - 32;

  useEffect(() => {
    async function fetchCharts() {
      const muscleGroups = {
        LEGS: ['Legs'],
        CHEST: ['Chest'],
        BACK: ['Back'],
      };
      const result: any = {};
      for (const part of Object.keys(muscleGroups)) {
        result[part] = {};
        const partId = await getBodyPartIdByName(part.charAt(0) + part.slice(1).toLowerCase());
        if (!partId) continue;
        for (const group of muscleGroups[part as keyof typeof muscleGroups]) {
          const workouts = await listWorkoutsByBodyPart(partId);
          let workoutCharts: any[] = [];
          for (const w of workouts) {
            const entries = await getWeightsAndRepsForWorkout(w.id);
            if (entries.length) {
              const labels = entries.map(e => `${new Date(e.logged_at).toLocaleDateString()} S${e.set_number}`);
              const reps = entries.map(e => e.reps);
              const weights = entries.map(e => e.weight);
              workoutCharts.push({ workoutName: w.name, labels, reps, weights });
            }
          }
          result[part][group] = workoutCharts;
        }
      }
      setCharts(result);

      // Fetch all workouts for Biceps, Triceps, Shoulders (global search, case-insensitive)
      const allGroups = ['Biceps', 'Triceps', 'Shoulders'];
      const armsResult: any = {};
      for (const group of allGroups) {
        const filtered = await listWorkoutsWithBodyPart(group);
        let workoutCharts: any[] = [];
        for (const w of filtered) {
          const entries = await getWeightsAndRepsForWorkout(w.id);
          if (entries.length) {
            const labels = entries.map(e => `${new Date(e.logged_at).toLocaleDateString()} S${e.set_number}`);
            const reps = entries.map(e => e.reps);
            const weights = entries.map(e => e.weight);
            workoutCharts.push({ workoutName: w.name, labels, reps, weights });
          }
        }
        armsResult[group] = workoutCharts;
      }
      setArmsCharts(armsResult);
    }
    fetchCharts();
  }, []);


  // Custom line graph for weights per set entry
  function renderWeightGraph(weights: number[]) {
    if (!weights.length) {
      return <View style={styles.graphPlaceholder}><Text style={styles.graphText}>No data</Text></View>;
    }
    // Graph dimensions
    const width = Dimensions.get('window').width - 32;
    const height = 180;
    const padding = 24;
    const maxWeight = Math.max(...weights);
  // Round up to nearest 5 for y-axis max
  const yMax = Math.ceil(maxWeight / 5) * 5;
  const yMin = 0;
  const yRange = yMax - yMin || 1;
  // Calculate mid and quartile values, rounded to nearest 5
  const yMid = Math.round((yMax / 2) / 5) * 5;
  const yQ1 = Math.round((yMid / 2) / 5) * 5;
  const yQ3 = Math.round(((yMid + yMax) / 2) / 5) * 5;
    const pointCount = weights.length;
    const stepX = (width - 2 * padding) / Math.max(pointCount - 1, 1);

    // Map weights to points
    const points = weights.map((w, i) => {
      const x = padding + i * stepX;
      // Invert y for graph (top is yMax, bottom is 0)
      const y = padding + ((yMax - w) / yRange) * (height - 2 * padding);
      return { x, y, w };
    });

    // Y label positions (top to bottom)
    const yLabels = [yMax, yQ3, yMid, yQ1, yMin];
    return (
      <View style={[styles.graphPlaceholder, { width, height, backgroundColor: '#222', position: 'relative' }]}> 
        {/* Y-axis labels (5 values) */}
        {yLabels.map((val, idx) => {
          // Position: top (yMax) to bottom (yMin)
          const y = padding + ((yMax - val) / yRange) * (height - 2 * padding) - 10;
          return (
            <Text key={idx} style={[styles.graphText, { position: 'absolute', left: 4, top: y }]}>{val}</Text>
          );
        })}
        {/* X-axis labels (entry numbers) */}
        <View style={{ position: 'absolute', left: padding, right: padding, bottom: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
          {weights.map((_, i) => (
            <Text key={i} style={[styles.graphText, { fontSize: 10, color: '#FFD700' }]}>{i + 1}</Text>
          ))}
        </View>
        {/* Draw lines and points */}
        {points.map((pt, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: Math.min(prev.x, pt.x),
                top: Math.min(prev.y, pt.y),
                width: Math.abs(pt.x - prev.x) || 2,
                height: Math.abs(pt.y - prev.y) || 2,
                borderColor: '#FFD700',
                borderLeftWidth: 2,
                borderTopWidth: 2,
                borderRadius: 2,
                zIndex: 1,
                transform: [{ translateX: 0 }, { translateY: 0 }],
              }}
            />
          );
        })}
        {points.map((pt, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: pt.x - 5,
              top: pt.y - 5,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#FFD700',
              borderWidth: 2,
              borderColor: '#fff',
              zIndex: 2,
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </Pressable>
        <Text style={styles.header}>Workout Dashboard</Text>
      </View>
      <View style={styles.gridContainer}>
        <Pressable style={styles.gridBtn} onPress={() => { setSelectedPart('ARMS'); setSelectedArmsGroup(null); }}>
          <Text style={styles.gridBtnText}>ARMS</Text>
        </Pressable>
        <Pressable style={styles.gridBtn} onPress={() => { setSelectedPart('LEGS'); setSelectedArmsGroup(null); }}>
          <Text style={styles.gridBtnText}>LEGS</Text>
        </Pressable>
        <Pressable style={styles.gridBtn} onPress={() => { setSelectedPart('CHEST'); setSelectedArmsGroup(null); }}>
          <Text style={styles.gridBtnText}>CHEST</Text>
        </Pressable>
        <Pressable style={styles.gridBtn} onPress={() => { setSelectedPart('BACK'); setSelectedArmsGroup(null); }}>
          <Text style={styles.gridBtnText}>BACK</Text>
        </Pressable>
      </View>
      <ScrollView style={{ marginTop: 16 }}>
        {/* ARMS: Show group buttons and graphs for selected group */}
        {selectedPart === 'ARMS' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              {['Biceps', 'Triceps', 'Shoulders'].map(group => (
                <Pressable
                  key={group}
                  style={[styles.gridBtn, { width: '32%', backgroundColor: selectedArmsGroup === group ? '#bfae60' : '#FFD700' }]}
                  onPress={() => setSelectedArmsGroup(group)}
                >
                  <Text style={styles.gridBtnText}>{group}</Text>
                </Pressable>
              ))}
            </View>
            {selectedArmsGroup && armsCharts[selectedArmsGroup] && (
              <View>
                {armsCharts[selectedArmsGroup].length === 0 && (
                  <View style={styles.graphPlaceholder}><Text style={styles.graphText}>No data</Text></View>
                )}
                {armsCharts[selectedArmsGroup].map((chart: any, idx: number) => (
                  <View key={idx}>
                    <Text style={{ color: '#FFD700', fontWeight: '700', marginLeft: 8, marginBottom: 4 }}>{chart.workoutName}</Text>
                    {renderWeightGraph(chart.weights)}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
        {/* Other body parts as before */}
        {selectedPart && selectedPart !== 'ARMS' && charts[selectedPart] && (
          <View>
            {Object.entries(charts[selectedPart]).map(([group, workoutCharts]: any) => (
              <View key={group}>
                <Text style={styles.sectionHeader}>{group}</Text>
                {workoutCharts.length === 0 && (
                  <View style={styles.graphPlaceholder}><Text style={styles.graphText}>No data</Text></View>
                )}
                {workoutCharts.map((chart: any, idx: number) => (
                  <View key={idx}>
                    <Text style={{ color: '#FFD700', fontWeight: '700', marginLeft: 8, marginBottom: 4 }}>{chart.workoutName}</Text>
                    {renderWeightGraph(chart.weights)}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#111', padding: 16 },
  header: { fontSize: 28, fontWeight: '900', color: '#FFD700', marginLeft: 8 },
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 8,
  },
  gridBtn: {
    width: '48%',
    height: 70,
    backgroundColor: '#FFD700',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gridBtnText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 1,
  },
  sectionHeader: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 18,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },
  graphPlaceholder: {
    height: 180,
    backgroundColor: '#222',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  graphText: {
    color: '#bfae60',
    fontWeight: '700',
    fontSize: 16,
  },
});
