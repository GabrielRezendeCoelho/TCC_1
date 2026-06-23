import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { routesService } from '../services/routes.service';
import { PackageItem } from '../components/PackageItem';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { DeliveryRoute, Package } from '../types';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',   // Amarelo
  IN_ROUTE: '#3b82f6',  // Azul
  DELIVERED: '#22c55e',  // Verde
  RETURNED: '#ef4444',   // Vermelho
  FAILED: '#ef4444',     // Vermelho
};

export function RouteDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { routeId } = route.params as { routeId: string };
  
  const [deliveryRoute, setDeliveryRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    loadDetail();
    const unsubscribe = navigation.addListener('focus', () => {
      loadDetail();
    });
    return unsubscribe;
  }, [navigation, routeId]);

  const loadDetail = async () => {
    try {
      const data = await routesService.getRouteDetail(routeId);
      setDeliveryRoute(data);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da rota.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (pkgId: string, status: string) => {
    try {
      await routesService.updatePackageStatus(pkgId, status);
      setDeliveryRoute(prev => {
        if (!prev || !prev.packages) return prev;
        const packages = prev.packages.map(p => 
          p.id === pkgId ? { ...p, status: status as Package['status'] } : p
        );
        return { ...prev, packages };
      });
    } catch (e) {
      Alert.alert('Erro', 'Falha ao atualizar o status do pacote.');
    }
  };

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      await routesService.optimizeRoute(routeId);
      Alert.alert('Sucesso', 'Rota otimizada com sucesso! A ordem das entregas foi reorganizada.');
      await loadDetail();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Falha ao otimizar a rota. Verifique se o endereço base está cadastrado no perfil.';
      Alert.alert('Erro', msg);
    } finally {
      setOptimizing(false);
    }
  };

  const handleOpenMap = () => {
    navigation.navigate('RouteMap', { routeId });
  };

  const handleDeleteRoute = () => {
    Alert.alert(
      'Excluir Rota',
      'Deseja realmente excluir esta rota? Todos os pacotes vinculados a ela voltarão a ficar pendentes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await routesService.deleteRoute(routeId);
              Alert.alert('Sucesso', 'Rota excluída com sucesso!');
              navigation.navigate('MainTabs');
            } catch (err: any) {
              Alert.alert('Erro', err.response?.data?.message || 'Falha ao excluir rota.');
            }
          },
        },
      ]
    );
  };

  if (loading || !deliveryRoute) return <LoadingSpinner />;

  const orderedPackages = deliveryRoute.packages || [];
  if (deliveryRoute.optimizedOrder && deliveryRoute.optimizedOrder.length > 0) {
    orderedPackages.sort((a, b) => {
      const indexA = deliveryRoute.optimizedOrder!.indexOf(a.id);
      const indexB = deliveryRoute.optimizedOrder!.indexOf(b.id);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  }

  const completed = orderedPackages.filter(p => p.status === 'DELIVERED' || p.status === 'RETURNED').length;
  const total = orderedPackages.length;
  const isOptimized = deliveryRoute.status === 'OPTIMIZED' || deliveryRoute.status === 'IN_PROGRESS' || deliveryRoute.status === 'COMPLETED';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{deliveryRoute.name}</Text>
        <TouchableOpacity onPress={handleDeleteRoute} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressText}>Progresso</Text>
          <Text style={styles.progressCount}>{completed} de {total}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View 
            style={[styles.progressBarFill, { width: `${total > 0 ? (completed / total) * 100 : 0}%` }]} 
          />
        </View>
      </View>

      {/* Barra de ações: Otimizar + Ver Mapa */}
      <View style={styles.actionsBar}>
        {!isOptimized && total > 0 && (
          <>
            <TouchableOpacity 
              style={styles.optimizeBtn}
              onPress={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="flash" size={18} color="#fff" />
              )}
              <Text style={styles.optimizeBtnText}>
                {optimizing ? 'Otimizando...' : 'Otimizar Rota'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.mapBtn}
              onPress={() => navigation.navigate('RouteMap', { routeId, showOptimized: false })}
            >
              <Ionicons name="map" size={18} color="#fff" />
              <Text style={styles.mapBtnText}>Ver no Mapa</Text>
            </TouchableOpacity>
          </>
        )}

        {isOptimized && (
          <View style={styles.optimizedContainer}>
            <View style={styles.optimizedHeader}>
              <View style={styles.optimizedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                <Text style={styles.optimizedText}>Rota Otimizada</Text>
                {!!deliveryRoute.totalDistance && (
                  <Text style={styles.distanceText}>
                    {deliveryRoute.totalDistance.toFixed(1)} km
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.optimizedMapButtons}>
              <TouchableOpacity 
                style={styles.mapBtnOriginal}
                onPress={() => navigation.navigate('RouteMap', { routeId, showOptimized: false })}
              >
                <Ionicons name="map-outline" size={16} color="#94a3b8" />
                <Text style={styles.mapBtnOriginalText}>Mapa Original</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.mapBtnOptimized}
                onPress={() => navigation.navigate('RouteMap', { routeId, showOptimized: true })}
              >
                <Ionicons name="map" size={16} color="#fff" />
                <Text style={styles.mapBtnOptimizedText}>Mapa Otimizado</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <FlatList
        data={orderedPackages}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.packageWrapper}>
            <View style={styles.timeline}>
              <View style={[styles.timelineDot, { backgroundColor: STATUS_COLORS[item.status] || '#6366f1' }]}>
                <Text style={styles.timelineNumber}>{index + 1}</Text>
              </View>
              {index < orderedPackages.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.packageCard}>
               <PackageItem pkg={item} onUpdateStatus={(status) => handleUpdateStatus(item.id, status)} />
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Scanner', { routeId })}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1d27',
    padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#2a2e3a'
  },
  backBtn: { marginRight: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#e2e8f0', flex: 1 },
  deleteBtn: {
    padding: 4,
  },
  progressContainer: { padding: 20, backgroundColor: '#1a1d27', borderBottomWidth: 1, borderBottomColor: '#2a2e3a' },
  progressTextContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#e2e8f0', fontWeight: '500' },
  progressCount: { color: '#6366f1', fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#2a2e3a', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6366f1' },

  // Barra de ações
  actionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#1a1d27',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3a',
  },
  optimizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  optimizeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  optimizedBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e15',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#22c55e40',
  },
  optimizedText: {
    color: '#22c55e',
    fontWeight: '600',
    fontSize: 13,
  },
  distanceText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 'auto',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  mapBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  list: { padding: 16 },
  packageWrapper: { flexDirection: 'row' },
  timeline: { width: 28, alignItems: 'center', marginRight: 8 },
  timelineDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#2a2e3a', marginTop: 4 },
  timelineNumber: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  packageCard: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  optimizedContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  optimizedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optimizedMapButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  mapBtnOriginal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2e3a',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#3a3f50',
  },
  mapBtnOriginalText: {
    color: '#94a3b8',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mapBtnOptimized: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  mapBtnOptimizedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

