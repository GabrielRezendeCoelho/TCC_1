import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { DeliveryRoute } from '../types';

interface Props {
  route: DeliveryRoute;
  onPress: () => void;
}

export function RouteCard({ route, onPress }: Props) {
  const isCompleted = route.status === 'COMPLETED';

  return (
    <TouchableOpacity 
      style={[styles.card, isCompleted && styles.cardCompleted]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{route.name}</Text>
        <View style={[styles.badge, isCompleted ? styles.badgeCompleted : null]}>
          <Text style={styles.badgeText}>
            {isCompleted ? 'Finalizada' : route.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.info}>📅 {new Date(route.date).toLocaleDateString('pt-BR')}</Text>
        <Text style={styles.info}>📦 {route._count?.packages || 0} pacotes</Text>
        {route.totalDistance && <Text style={styles.info}>🗺️ {route.totalDistance} km</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1d27',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2e3a',
  },
  cardCompleted: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCompleted: {
    backgroundColor: '#22c55e20',
  },
  badgeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    color: '#94a3b8',
    fontSize: 12,
  },
});
