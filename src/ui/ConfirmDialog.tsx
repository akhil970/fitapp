import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';

interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export default function ConfirmDialog({
  visible,
  title = 'Confirm',
  message,
  children,
  confirmText = 'Yes',
  cancelText = 'No',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children ? (
            <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 8 }}>
              {children}
            </ScrollView>
          ) : null}
          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    maxWidth: 340,
    maxHeight: 420,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  scrollArea: {
    maxHeight: 180,
    width: '100%',
    marginBottom: 12,
  },
  title: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 18,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelBtn: {
    backgroundColor: '#222',
    borderColor: '#FFD700',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginRight: 8,
  },
  confirmBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
