import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Package } from '../types';

interface Props {
  pkg: Package;
  onUpdateStatus: (status: string) => void;
}

export function PackageItem({ pkg, onUpdateStatus }: Props) {
  const isDelivered = pkg.status === 'DELIVERED';
  const isReturned = pkg.status === 'RETURNED';

  return (
    <View style={styles.container}>
      <View style={styles.details}>
        <View style={styles.header}>
          <Text style={styles.tracking}>{pkg.trackingCode.slice(0, 8).toUpperCase()}</Text>
          {(isDelivered || isReturned) && (
             <View style={[styles.statusBadge, isDelivered ? styles.deliveredBadge : styles.returnedBadge]}>
               <Text style={styles.statusText}>{isDelivered ? 'ENTREGUE' : 'DEVOLVIDO'}</Text>
             </View>
          )}
        </View>
        <Text style={styles.name}>{pkg.recipientName}</Text>
        <Text style={styles.address}>{pkg.address}</Text>
      </View>

      {!isDelivered && !isReturned && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.btn, styles.successBtn]}
            onPress={() => onUpdateStatus('DELIVERED')}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.dangerBtn]}
            onPress={() => onUpdateStatus('RETURNED')}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1d27',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  details: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tracking: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deliveredBadge: { backgroundColor: '#22c55e20' },
  returnedBadge: { backgroundColor: '#ef444420' },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  name: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    color: '#64748b',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBtn: {
    backgroundColor: '#22c55e',
  },
  dangerBtn: {
    backgroundColor: '#ef4444',
  },
});
