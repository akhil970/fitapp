import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Image, Alert } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { listWorkoutsWithBodyPart } from '../backend/repositories/workoutsRepo';
import { listBodyParts } from '../backend/repositories/bodyPartsRepo';
import { getDb } from '../db';

export default function HamburgerMenu({ visible, onClose, onDashboard }: { visible: boolean; onClose: () => void; onDashboard: () => void }) {
  async function handleBackup() {
    try {
      // Gather all data
      const workouts = await listWorkoutsWithBodyPart();
      const bodyParts = await listBodyParts();
      const db = await getDb();
      // Get all logs
      const logsRes = await db.executeSql('SELECT * FROM workout_logs');
      const logs = logsRes[0].rows.raw();
      // Get all sets
      const setsRes = await db.executeSql('SELECT * FROM workout_sets');
      const sets = setsRes[0].rows.raw();

      // CSV header
      let csv = 'Workout Name,Body Part,Log Date,Set Number,Reps,Weight\n';
      // Map logs and sets to CSV rows
      for (const log of logs) {
        const workout = workouts.find(w => w.id === log.workout_id);
        const workoutName = workout ? workout.name : '';
        const bodyPart = workout ? workout.body_part_name : '';
        const logDate = log.logged_at;
        const logSets = sets.filter(s => s.workout_log_id === log.id);
        for (const set of logSets) {
          csv += `"${workoutName}","${bodyPart}","${logDate}",${set.set_number},${set.reps},${set.weight}\n`;
        }
      }

      // Filename
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const MM = pad(now.getMonth() + 1);
      const DD = pad(now.getDate());
      const YY = now.getFullYear().toString().slice(-2);
      const HH = pad(now.getHours());
      const mm = pad(now.getMinutes());
      const fileName = `workout_data_${MM}${DD}${YY}_${HH}:${mm}.csv`;
      const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;

      // Write file
      await RNFS.writeFile(path, csv, 'utf8');

      // Share file
      await Share.open({ url: 'file://' + path, type: 'text/csv', showAppsToView: true });
    } catch (e: any) {
      Alert.alert('Backup Failed', e.message || 'Could not create backup.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.menuBox}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={{ color: '#FFD700', fontSize: 22 }}>×</Text>
          </Pressable>
          <View style={styles.profileSection}>
            <View style={styles.profileCircle}>
              {/* Replace with actual profile image if available */}
              <Image source={require('./dash_icon.png')} style={styles.profileImg} />
            </View>
            <Text style={styles.profileName}>You</Text>
          </View>
          <Pressable style={styles.dashboardBtn} onPress={onDashboard}>
            <Text style={styles.dashboardText}>Dashboards</Text>
          </Pressable>
          <Pressable style={styles.dashboardBtn} onPress={handleBackup}>
            <Text style={styles.dashboardText}>Backup Data</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuBox: {
    marginTop: 40,
    marginLeft: 16,
    backgroundColor: '#222',
    borderRadius: 18,
    padding: 24,
    minWidth: 220,
    shadowColor: '#FFD700',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  profileCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileImg: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  profileName: {
    color: '#FFD700',
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 8,
  },
  dashboardBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  dashboardText: {
    color: '#111',
    fontWeight: '900',
    fontSize: 16,
  },
});
