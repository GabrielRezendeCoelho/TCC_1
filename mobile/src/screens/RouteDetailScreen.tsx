import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { routesService } from '../services/routes.service';
import { PackageItem } from '../components/PackageItem';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { DeliveryRoute, Package } from '../types';

export function RouteDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { routeId } = route.params as { routeId: string };
  
  const [deliveryRoute, setDeliveryRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [routeId]);

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
      // Atualiza localmente
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

  if (loading || !deliveryRoute) return <LoadingSpinner />;

  // Se houver uma ordem otimizada no banco, podemos estruturar o array de pacotes na ordem correta aqui.
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title}>{deliveryRoute.name}</Text>
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

      <FlatList
        data={orderedPackages}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.packageWrapper}>
            <View style={styles.timeline}>
              <View style={styles.timelineDot} />
              {index < orderedPackages.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.packageCard}>
               <PackageItem pkg={item} onUpdateStatus={(status) => handleUpdateStatus(item.id, status)} />
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
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
  title: { fontSize: 18, fontWeight: 'bold', color: '#e2e8f0' },
  progressContainer: { padding: 20, backgroundColor: '#1a1d27', borderBottomWidth: 1, borderBottomColor: '#2a2e3a' },
  progressTextContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: '#e2e8f0', fontWeight: '500' },
  progressCount: { color: '#6366f1', fontWeight: 'bold' },
  progressBarBg: { height: 8, backgroundColor: '#2a2e3a', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#6366f1' },
  list: { padding: 16 },
  packageWrapper: { flexDirection: 'row' },
  timeline: { width: 20, alignItems: 'center', marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6366f1', marginTop: 16 },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#2a2e3a' },
  packageCard: { flex: 1 },
});
