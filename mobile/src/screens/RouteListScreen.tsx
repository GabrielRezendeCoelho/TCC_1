import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { routesService } from '../services/routes.service';
import { useAuth } from '../contexts/AuthContext';
import { RouteCard } from '../components/RouteCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { DeliveryRoute } from '../types';

type RootStackParamList = {
  RouteList: undefined;
  RouteDetail: { routeId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RouteList'>;

export function RouteListScreen() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { user, logout } = useAuth();

  const loadRoutes = useCallback(async () => {
    try {
      const data = await routesService.getMyRoutes();
      // Em um cenário real, filtaríamos pelas rotas IN_PROGRESS do motorista
      // Como estamos no MVP, pegaremos as routes e filtraremos localmente se o backend não fizer isso
      setRoutes(data?.routes || []); 
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name}</Text>
          <Text style={styles.subtitle}>Suas rotas de entrega</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={routes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <RouteCard 
            route={item} 
            onPress={() => navigation.navigate('RouteDetail', { routeId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>Você não possui rotas atribuídas no momento.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60, // compensar safe area em alguns devices
    backgroundColor: '#1a1d27',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3a',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
  },
  list: {
    padding: 16,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 32,
  },
});
