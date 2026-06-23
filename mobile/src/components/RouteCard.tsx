import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { DeliveryRoute } from '../types';

interface Props {
  route: DeliveryRoute;
  onPress: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  OPTIMIZED: 'Otimizada',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Finalizada',
};

export function RouteCard({ route, onPress }: Props) {
  const isCompleted = route.status === 'COMPLETED';

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { badge: styles.badgeCompleted, text: styles.badgeTextCompleted };
      case 'IN_PROGRESS':
        return { badge: styles.badgeInProgress, text: styles.badgeTextInProgress };
      case 'OPTIMIZED':
        return { badge: styles.badgeOptimized, text: styles.badgeTextOptimized };
      default:
        return { badge: styles.badgeDraft, text: styles.badgeTextDraft };
    }
  };

  const statusStyle = getStatusStyles(route.status);

  const packages = route.packages || [];
  const completedCount = packages.filter(p => p.status === 'DELIVERED' || p.status === 'RETURNED').length;
  const totalCount = packages.length || route._count?.packages || 0;

  return (
    <TouchableOpacity 
      style={[styles.card, isCompleted && styles.cardCompleted]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{route.name}</Text>
        <View style={[styles.badge, statusStyle.badge]}>
          <Text style={[styles.badgeText, statusStyle.text]}>
            {STATUS_LABELS[route.status] || route.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.info}>📅 {new Date(route.date).toLocaleDateString('pt-BR')}</Text>
        <Text style={styles.info}>📦 {completedCount} de {totalCount} pacotes</Text>
        {!!route.totalDistance && <Text style={styles.info}>🗺️ {route.totalDistance.toFixed(1)} km</Text>}
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDraft: {
    backgroundColor: '#64748b20',
  },
  badgeOptimized: {
    backgroundColor: '#f59e0b20',
  },
  badgeInProgress: {
    backgroundColor: '#6366f120',
  },
  badgeCompleted: {
    backgroundColor: '#22c55e20',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  badgeTextDraft: {
    color: '#64748b',
  },
  badgeTextOptimized: {
    color: '#f59e0b',
  },
  badgeTextInProgress: {
    color: '#6366f1',
  },
  badgeTextCompleted: {
    color: '#22c55e',
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
