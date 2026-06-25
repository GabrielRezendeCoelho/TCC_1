import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { packagesService } from '../services/packages.service';

export function ScannerScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { routeId } = (route.params as { routeId?: string }) || {};

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const [trackingCode, setTrackingCode] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowCamera(false);

    // Tenta analisar se o dado é um JSON estruturado para autopreenchimento
    try {
      const cleanData = data.trim();
      if (cleanData.startsWith('{') && cleanData.endsWith('}')) {
        const parsed = JSON.parse(cleanData);
        if (parsed.trackingCode) setTrackingCode(parsed.trackingCode);
        if (parsed.recipientName) setRecipientName(parsed.recipientName);
        if (parsed.street) setStreet(parsed.street);
        if (parsed.number) setNumber(String(parsed.number));
        if (parsed.city) setCity(parsed.city);
        if (parsed.state) setState(parsed.state.toUpperCase().slice(0, 2));

        Alert.alert(
          'Autopreenchimento',
          'Dados do pacote preenchidos automaticamente via QR Code com sucesso!'
        );
        return;
      }
    } catch (e) {
      console.warn('Código escaneado não é um JSON estruturado válido de autopreenchimento, tratando como código de rastreio simples.');
    }

    setTrackingCode(data);
    Alert.alert('Código Escaneado', data);
  };

  const triggerGeocode = async (s: string, n: string, c: string, st: string) => {
    setGeocoding(true);
    try {
      const addressQuery = `${s.trim()}, ${n.trim() ? n.trim() + ', ' : ''}${c.trim()}, ${st.trim()}, Brasil`;
      const query = encodeURIComponent(addressQuery);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br`,
        {
          headers: {
            'User-Agent': 'TrackGo-Mobile/1.0',
          },
        }
      );
      const results = await response.json();

      if (results.length > 0) {
        const { lat, lon } = results[0];
        setLatitude(String(lat));
        setLongitude(String(lon));
      } else {
        setLatitude('');
        setLongitude('');
      }
    } catch (e) {
      console.error('Erro na geocodificação do pacote:', e);
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (!street.trim() || !city.trim() || !state.trim()) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      triggerGeocode(street, number, city, state);
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [street, number, city, state]);

  const handleCreatePackage = async () => {
    if (!trackingCode.trim() || !recipientName.trim() || !street.trim() || !city.trim() || !state.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos do pacote.');
      return;
    }
    
    setLoading(true);
    try {
      let latToSave = latitude;
      let lngToSave = longitude;

      // Se ainda não temos coordenadas, tenta obter síncronamente antes de salvar
      if (!latToSave || !lngToSave) {
        const addressQuery = `${street.trim()}, ${number.trim() ? number.trim() + ', ' : ''}${city.trim()}, ${state.trim()}, Brasil`;
        const query = encodeURIComponent(addressQuery);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=br`,
          {
            headers: {
              'User-Agent': 'TrackGo-Mobile/1.0',
            },
          }
        );
        const results = await response.json();

        if (results.length > 0) {
          const { lat, lon } = results[0];
          latToSave = String(lat);
          lngToSave = String(lon);
          setLatitude(latToSave);
          setLongitude(lngToSave);
        } else {
          Alert.alert(
            'Erro de Localização',
            'Não foi possível encontrar as coordenadas para o endereço fornecido. Verifique os dados digitados.'
          );
          setLoading(false);
          return;
        }
      }

      const formattedAddress = `${street.trim()}, ${number.trim()} - ${city.trim()}/${state.trim()}`;

      const payload: any = {
        trackingCode: trackingCode.trim(),
        recipientName: recipientName.trim(),
        address: formattedAddress,
        latitude: Number(latToSave),
        longitude: Number(lngToSave),
      };

      if (routeId) {
        payload.routeId = routeId;
      }

      await packagesService.createPackage(payload);
      Alert.alert('Sucesso', 'Pacote cadastrado com sucesso!');
      
      setTrackingCode('');
      setRecipientName('');
      setStreet('');
      setNumber('');
      setCity('');
      setState('');
      setLatitude('');
      setLongitude('');
      setScanned(false);
      
      navigation.goBack();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao cadastrar pacote');
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    if (!permission) {
      return <View />;
    }
    if (!permission.granted) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>Precisamos da sua permissão para usar a câmera</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermission}>
            <Text style={styles.buttonText}>Conceder permissão</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity style={styles.closeCameraBtn} onPress={() => setShowCamera(false)}>
            <Ionicons name="close-circle" size={40} color="white" />
          </TouchableOpacity>
          <View style={styles.scanTarget} />
          <Text style={styles.scanText}>Aponte a câmera para o código de barras ou QR Code do pacote</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Cadastrar Pacote</Text>
        
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Código de Rastreio</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ex: TKG123456789"
                placeholderTextColor="#64748b"
                value={trackingCode}
                onChangeText={setTrackingCode}
              />
              <TouchableOpacity 
                style={styles.scanBtn} 
                onPress={() => {
                  setScanned(false);
                  setShowCamera(true);
                }}
              >
                <Ionicons name="qr-code-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Destinatário</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: João da Silva"
              placeholderTextColor="#64748b"
              value={recipientName}
              onChangeText={setRecipientName}
            />
          </View>

          {/* Campo Rua */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Rua / Logradouro</Text>
            <TextInput
              style={styles.input}
              value={street}
              onChangeText={setStreet}
              placeholder="Ex: Avenida Brasil"
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Número e Estado */}
          <View style={styles.addressRow}>
            <View style={styles.numberInput}>
              <Text style={styles.label}>Número</Text>
              <TextInput
                style={styles.input}
                value={number}
                onChangeText={setNumber}
                placeholder="Ex: 123"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.stateInput}>
              <Text style={styles.label}>Estado (UF)</Text>
              <TextInput
                style={styles.input}
                value={state}
                onChangeText={(text) => setState(text.toUpperCase().slice(0, 2))}
                placeholder="Ex: PR"
                placeholderTextColor="#64748b"
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>

          {/* Cidade */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              value={city}
              onChangeText={setCity}
              placeholder="Ex: Maringá"
              placeholderTextColor="#64748b"
            />
          </View>

          {geocoding && (
            <View style={styles.geocodingFeedback}>
              <ActivityIndicator size="small" color="#0ea5e9" />
              <Text style={styles.geocodingFeedbackText}>Validando endereço...</Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleCreatePackage}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Cadastrando...' : 'Cadastrar Pacote'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  scroll: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 60,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCameraBtn: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  scanTarget: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#6366f1',
    backgroundColor: 'transparent',
  },
  scanText: {
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1a1d27',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2e3a',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 8,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2a2e3a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
  },
  scanBtn: {
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    width: 50,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  numberInput: {
    flex: 2,
  },
  stateInput: {
    flex: 1,
  },
  geocodingFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    backgroundColor: '#0ea5e915',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e930',
  },
  geocodingFeedbackText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '500',
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  coordInput: {
    flex: 1,
  },
  coordFieldInput: {
    color: '#94a3b8',
    fontSize: 13,
  },
});
