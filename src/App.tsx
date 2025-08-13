import React, { useState } from 'react';
import AnimatedLoadingScreen from './frontend/components/AnimatedLoadingScreen';
import SelectWorkoutScreen from './frontend/screens/SelectWorkoutScreen';
import LogWorkoutScreen from './frontend/screens/LogWorkoutScreen';
import WorkoutHistoryScreen from './frontend/screens/WorkoutHistoryScreen';
import WorkoutDashboardScreen from './frontend/screens/WorkoutDashboardScreen';
import type { Workout } from './db/types';

export default function App() {
  const [screen, setScreen] = useState<'select' | 'log' | 'history' | 'dashboard'>('select');
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <AnimatedLoadingScreen onFinish={() => setLoading(false)} />;
  }

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

  if (screen === 'dashboard') {
    return <WorkoutDashboardScreen onBack={() => setScreen('select')} />;
  }
  return (
    <SelectWorkoutScreen
      onSelectWorkout={(w) => { setSelectedWorkout(w); setScreen('log'); }}
      onViewHistory={(w) => { setSelectedWorkout(w); setScreen('history'); }}
      onDashboard={() => setScreen('dashboard')}
    />
  );
}
