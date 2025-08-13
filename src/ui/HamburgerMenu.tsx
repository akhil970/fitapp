import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Image } from 'react-native';

export default function HamburgerMenu({ visible, onClose, onDashboard }: { visible: boolean; onClose: () => void; onDashboard: () => void }) {
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
