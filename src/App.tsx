import React, { useState } from 'react';
import SelectWorkoutScreen from './frontend/screens/SelectWorkoutScreen';
import LogWorkoutScreen from './frontend/screens/LogWorkoutScreen';
import WorkoutHistoryScreen from './frontend/screens/WorkoutHistoryScreen';
import type { Workout } from './db/types';

export default function App() {
  const [screen, setScreen] = useState<'select' | 'log' | 'history'>('select');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  if (screen === 'log' && selectedWorkout) {
    return (
      <LogWorkoutScreen
        workout={selectedWorkout}
        onDone={() => { setScreen('select'); setSelectedWorkout(null); }}
      />
    );
  }

  if (screen === 'history' && selectedWorkout) {
    return (
      <WorkoutHistoryScreen
        workout={selectedWorkout}
        onBack={() => { setScreen('select'); setSelectedWorkout(null); }}
      />
    );
  }

  return (
    <SelectWorkoutScreen
      onSelectWorkout={(w) => { setSelectedWorkout(w); setScreen('log'); }}
      onViewHistory={(w) => { setSelectedWorkout(w); setScreen('history'); }}
    />
  );
}
