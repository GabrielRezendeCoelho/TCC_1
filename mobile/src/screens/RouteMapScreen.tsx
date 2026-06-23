import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import { routesService } from '../services/routes.service';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { DeliveryRoute, Package } from '../types';

const { width, height } = Dimensions.get('window');

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',   // Amarelo
  IN_ROUTE: '#3b82f6',  // Azul
  DELIVERED: '#22c55e',  // Verde
  RETURNED: '#ef4444',   // Vermelho
  FAILED: '#ef4444',     // Vermelho
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_ROUTE: 'Em Rota',
  DELIVERED: 'Entregue',
  RETURNED: 'Devolvido',
  FAILED: 'Falha',
};

export function RouteMapScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { routeId, showOptimized } = route.params as { routeId: string; showOptimized?: boolean };
  const mapRef = useRef<MapView>(null);

  const [deliveryRoute, setDeliveryRoute] = useState<DeliveryRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loadingRouteCoords, setLoadingRouteCoords] = useState(false);

  useEffect(() => {
    loadRoute();

    const unsubscribe = navigation.addListener('focus', () => {
      loadRoute();
    });

    return unsubscribe;
  }, [routeId, navigation]);

  const fetchRoadRoute = async (packages: Package[], bLat: number | null, bLng: number | null) => {
    if (packages.length === 0) {
      setRouteCoordinates([]);
      return;
    }

    setLoadingRouteCoords(true);
    try {
      const coords: Array<{ latitude: number; longitude: number }> = [];
      if (bLat != null && bLng != null) {
        coords.push({ latitude: bLat, longitude: bLng });
      }
      packages.forEach((pkg) => {
        if (pkg.latitude != null && pkg.longitude != null) {
          coords.push({ latitude: pkg.latitude, longitude: pkg.longitude });
        }
      });

      if (coords.length < 2) {
        setRouteCoordinates([]);
        return;
      }

      // Monta as coordenadas no formato lon,lat separados por ponto e vírgula para o OSRM
      const coordinatesString = coords
        .map((c) => `${c.longitude},${c.latitude}`)
        .join(';');

      const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const routeGeojson = data.routes[0].geometry;
        if (routeGeojson && routeGeojson.coordinates) {
          const path = routeGeojson.coordinates.map((coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          setRouteCoordinates(path);
        } else {
          setRouteCoordinates(coords);
        }
      } else {
        setRouteCoordinates(coords);
      }
    } catch (e) {
      console.error('Erro ao buscar rota roteirizada pelas ruas:', e);
      const coords: Array<{ latitude: number; longitude: number }> = [];
      if (bLat != null && bLng != null) {
        coords.push({ latitude: bLat, longitude: bLng });
      }
      packages.forEach((pkg) => {
        if (pkg.latitude != null && pkg.longitude != null) {
          coords.push({ latitude: pkg.latitude, longitude: pkg.longitude });
        }
      });
      setRouteCoordinates(coords);
    } finally {
      setLoadingRouteCoords(false);
    }
  };

  useEffect(() => {
    if (deliveryRoute) {
      // Ordena de acordo com showOptimized para obtermos os pontos na ordem certa
      const ordered = [...(deliveryRoute.packages || [])];
      const isViewingOptimized = showOptimized && deliveryRoute.optimizedOrder && deliveryRoute.optimizedOrder.length > 0;
      
      if (isViewingOptimized) {
        ordered.sort((a, b) => {
          const indexA = deliveryRoute.optimizedOrder!.indexOf(a.id);
          const indexB = deliveryRoute.optimizedOrder!.indexOf(b.id);
          return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
        });
      } else {
        ordered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
      }

      const activePackages = ordered.filter(
        (pkg) => pkg.latitude != null && pkg.longitude != null
      );

      const bLat = (deliveryRoute as any)?.createdBy?.baseLat;
      const bLng = (deliveryRoute as any)?.createdBy?.baseLng;

      // Define o fallback imediato (linhas retas)
      const fallbackCoords = [];
      if (bLat != null && bLng != null) {
        fallbackCoords.push({ latitude: bLat, longitude: bLng });
      }
      activePackages.forEach((pkg) => {
        fallbackCoords.push({ latitude: pkg.latitude!, longitude: pkg.longitude! });
      });
      setRouteCoordinates(fallbackCoords);

      // Busca a rota real pelas ruas
      fetchRoadRoute(activePackages, bLat, bLng);
    }
  }, [deliveryRoute, showOptimized]);

  const loadRoute = async () => {
    try {
      const data = await routesService.getRouteDetail(routeId);
      setDeliveryRoute(data);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar os dados da rota.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const baseLat = (deliveryRoute as any)?.createdBy?.baseLat;
  const baseLng = (deliveryRoute as any)?.createdBy?.baseLng;
  const baseAddress = (deliveryRoute as any)?.createdBy?.baseAddress;

  // Ordena os pacotes conforme o parametro de visualizacao
  const orderedPackages = [...(deliveryRoute?.packages || [])];
  const isViewingOptimized = showOptimized && deliveryRoute?.optimizedOrder && deliveryRoute.optimizedOrder.length > 0;
  
  if (isViewingOptimized) {
    orderedPackages.sort((a, b) => {
      const indexA = deliveryRoute.optimizedOrder!.indexOf(a.id);
      const indexB = deliveryRoute.optimizedOrder!.indexOf(b.id);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    });
  } else {
    // Mapa original: ordena por data de criacao original (createdAt: asc)
    orderedPackages.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
  }

  // Filtra apenas pacotes com coordenadas válidas
  const packagesWithCoords = orderedPackages.filter(
    (pkg) => pkg.latitude != null && pkg.longitude != null
  );

  // Ajusta o mapa para enquadrar todos os pins (incluindo a base)
  const fitMapToMarkers = () => {
    if (mapRef.current && (packagesWithCoords.length > 0 || (baseLat != null && baseLng != null))) {
      const coords = packagesWithCoords.map((pkg) => ({
        latitude: pkg.latitude!,
        longitude: pkg.longitude!,
      }));
      if (baseLat != null && baseLng != null) {
        coords.unshift({ latitude: baseLat, longitude: baseLng });
      }

      // Calcula a dispersao das coordenadas
      const lats = coords.map((c) => c.latitude);
      const lngs = coords.map((c) => c.longitude);
      const latSpread = Math.max(...lats) - Math.min(...lats);
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);

      // Se a dispersao for muito pequena (ex: menor que 0.002 graus), usamos animateToRegion para evitar flicker/zoom infinito
      if (latSpread < 0.002 && lngSpread < 0.002) {
        const centerLat = lats.reduce((sum, val) => sum + val, 0) / lats.length;
        const centerLng = lngs.reduce((sum, val) => sum + val, 0) / lngs.length;
        mapRef.current.animateToRegion(
          {
            latitude: centerLat,
            longitude: centerLng,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          },
          1000
        );
      } else {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true,
        });
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  if (packagesWithCoords.length === 0 && !(baseLat != null && baseLng != null)) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mapa da Rota</Text>
        </View>
        <View style={styles.emptyContent}>
          <Ionicons name="map-outline" size={64} color="#64748b" />
          <Text style={styles.emptyText}>
            Nenhuma entrega com coordenadas encontrada nesta rota.
          </Text>
        </View>
      </View>
    );
  }

  // Calcula região inicial centralizada nos pacotes + base
  const latitudes = [...packagesWithCoords.map((p) => p.latitude!)];
  const longitudes = [...packagesWithCoords.map((p) => p.longitude!)];
  if (baseLat != null && baseLng != null) {
    latitudes.push(baseLat);
    longitudes.push(baseLng);
  }
  const centerLat = latitudes.length > 0 ? (Math.min(...latitudes) + Math.max(...latitudes)) / 2 : -23.550520;
  const centerLng = longitudes.length > 0 ? (Math.min(...longitudes) + Math.max(...longitudes)) / 2 : -46.633308;
  const deltaLat = latitudes.length > 0 ? Math.max(Math.max(...latitudes) - Math.min(...latitudes), 0.02) * 1.5 : 0.05;
  const deltaLng = longitudes.length > 0 ? Math.max(Math.max(...longitudes) - Math.min(...longitudes), 0.02) * 1.5 : 0.05;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {deliveryRoute?.name || 'Mapa da Rota'} {isViewingOptimized ? '(Otimizado)' : '(Original)'}
        </Text>
        <TouchableOpacity onPress={fitMapToMarkers} style={styles.fitBtn}>
          <Ionicons name="scan-outline" size={22} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: deltaLat,
          longitudeDelta: deltaLng,
        }}
        onMapReady={fitMapToMarkers}
      >
        {/* Marcador da Base */}
        {baseLat != null && baseLng != null && (
          <Marker
            coordinate={{
              latitude: baseLat,
              longitude: baseLng,
            }}
            title="Base (Ponto de Partida)"
            description={baseAddress || 'Endereço da Base'}
          >
            <View style={styles.baseMarkerContainer}>
              <View style={styles.baseMarkerBubble}>
                <Ionicons name="home" size={16} color="#fff" />
              </View>
              <View style={styles.baseMarkerArrow} />
            </View>
          </Marker>
        )}

        {/* Marcadores dos Pacotes */}
        {packagesWithCoords.map((pkg, index) => (
          <Marker
            key={pkg.id}
            coordinate={{
              latitude: pkg.latitude!,
              longitude: pkg.longitude!,
            }}
            pinColor={STATUS_COLORS[pkg.status] || '#6366f1'}
            title={`${index + 1}. ${pkg.recipientName}`}
            description={pkg.address}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.markerBubble, { backgroundColor: STATUS_COLORS[pkg.status] || '#6366f1' }]}>
                <Text style={styles.markerIndex}>{index + 1}</Text>
              </View>
              <View style={[styles.markerArrow, { borderTopColor: STATUS_COLORS[pkg.status] || '#6366f1' }]} />
            </View>
            <Callout style={styles.callout}>
              <View style={styles.calloutContent}>
                <Text style={styles.calloutOrder}>Parada #{index + 1}</Text>
                <Text style={styles.calloutName}>{pkg.recipientName}</Text>
                <Text style={styles.calloutAddress}>{pkg.address}</Text>
                <View style={[styles.calloutBadge, { backgroundColor: STATUS_COLORS[pkg.status] + '30' }]}>
                  <Text style={[styles.calloutStatus, { color: STATUS_COLORS[pkg.status] }]}>
                    {STATUS_LABELS[pkg.status] || pkg.status}
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Linha do trajeto (Polyline) roteirizada pelas ruas */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#6366f1"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Legenda flutuante */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>
          {packagesWithCoords.length} entregas
        </Text>
        <View style={styles.legendItems}>
          {Object.entries(STATUS_COLORS)
            .filter(([status]) => packagesWithCoords.some((p) => p.status === status))
            .map(([status, color]) => (
              <View key={status} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.legendLabel}>{STATUS_LABELS[status]}</Text>
              </View>
            ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d27',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3a',
    zIndex: 10,
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
    flex: 1,
  },
  fitBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#6366f115',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  markerIndex: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  callout: {
    width: 220,
  },
  calloutContent: {
    padding: 8,
  },
  calloutOrder: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  calloutName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  calloutBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  calloutStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  legend: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#1a1d27ee',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2e3a',
  },
  legendTitle: {
    color: '#e2e8f0',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  legendLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  baseMarkerContainer: {
    alignItems: 'center',
  },
  baseMarkerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  baseMarkerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#10b981',
    marginTop: -2,
  },
});
