import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '../services/auth.service';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  baseAddress: string | null;
  baseLat: number | null;
  baseLng: number | null;
}

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [baseLat, setBaseLat] = useState('');
  const [baseLng, setBaseLng] = useState('');

  const parseAddress = (fullAddress: string) => {
    let parsedStreet = '';
    let parsedNumber = '';
    let parsedCity = '';
    let parsedState = '';

    if (fullAddress) {
      const dashParts = fullAddress.split('-');
      if (dashParts.length >= 2) {
        const streetAndNum = dashParts[0].trim();
        const commaParts = streetAndNum.split(',');
        if (commaParts.length >= 2) {
          parsedNumber = commaParts[commaParts.length - 1].trim();
          parsedStreet = commaParts.slice(0, -1).join(',').trim();
        } else {
          parsedStreet = streetAndNum;
        }

        const rest = dashParts.slice(1).join('-');
        if (rest.includes('/')) {
          const slashParts = rest.split('/');
          parsedState = slashParts[slashParts.length - 1].trim();
          parsedCity = slashParts.slice(0, -1).join('/').trim();
          if (parsedCity.includes(',')) {
            const cityComma = parsedCity.split(',');
            parsedCity = cityComma[cityComma.length - 1].trim();
          }
        } else if (rest.includes(',')) {
          const commaParts = rest.split(',');
          parsedState = commaParts[commaParts.length - 1].trim();
          parsedCity = commaParts.slice(0, -1).join(',').trim();
        } else {
          parsedCity = rest.trim();
        }
      } else {
        const commaParts = fullAddress.split(',');
        if (commaParts.length >= 4) {
          parsedStreet = commaParts[0].trim();
          parsedNumber = commaParts[1].trim();
          parsedCity = commaParts[2].trim();
          parsedState = commaParts[3].trim();
        } else if (commaParts.length === 3) {
          parsedStreet = commaParts[0].trim();
          parsedNumber = commaParts[1].trim();
          parsedCity = commaParts[2].trim();
        } else if (commaParts.length === 2) {
          parsedStreet = commaParts[0].trim();
          parsedNumber = commaParts[1].trim();
        } else {
          parsedStreet = fullAddress;
        }
      }
    }

    return {
      street: parsedStreet,
      number: parsedNumber,
      city: parsedCity,
      state: parsedState,
    };
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data);
      setName(data.name || '');
      
      const fullAddress = data.baseAddress || '';
      const parsed = parseAddress(fullAddress);
      setStreet(parsed.street);
      setNumber(parsed.number);
      setCity(parsed.city);
      setState(parsed.state);

      setBaseLat(data.baseLat != null ? String(data.baseLat) : '');
      setBaseLng(data.baseLng != null ? String(data.baseLng) : '');
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível carregar o perfil.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
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
        setBaseLat(String(lat));
        setBaseLng(String(lon));
      } else {
        setBaseLat('');
        setBaseLng('');
      }
    } catch (e) {
      console.error('Erro na geocodificação automática:', e);
    } finally {
      setGeocoding(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!street.trim() || !city.trim() || !state.trim()) {
      return;
    }

    const formattedAddress = `${street.trim()}, ${number.trim()} - ${city.trim()}/${state.trim()}`;
    const profileAddress = profile?.baseAddress || '';

    if (formattedAddress === profileAddress && baseLat && baseLng) {
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      triggerGeocode(street, number, city, state);
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [street, number, city, state]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio.');
      return;
    }

    if (!street.trim() || !city.trim() || !state.trim()) {
      Alert.alert('Erro', 'Por favor, preencha a Rua, Cidade e Estado.');
      return;
    }

    setSaving(true);
    try {
      let latToSave = baseLat;
      let lngToSave = baseLng;

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
          setBaseLat(latToSave);
          setBaseLng(lngToSave);
        } else {
          Alert.alert(
            'Erro de Localização',
            'Não foi possível encontrar as coordenadas para o endereço fornecido. Verifique se digitou corretamente.'
          );
          setSaving(false);
          return;
        }
      }

      const formattedAddress = `${street.trim()}, ${number.trim()} - ${city.trim()}/${state.trim()}`;

      const payload: any = {
        name: name.trim(),
        baseAddress: formattedAddress,
        baseLat: Number(latToSave),
        baseLng: Number(lngToSave),
      };

      await authService.updateProfile(payload);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      navigation.goBack();
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Falha ao salvar o perfil.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      OPERATOR: 'Operador',
      DRIVER: 'Motorista',
      CLIENT: 'Cliente',
    };
    return roles[role] || role;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <ScrollView 
        style={styles.scrollContent} 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar e info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#6366f1" />
          </View>
          <Text style={styles.emailText}>{profile?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{getRoleName(profile?.role || '')}</Text>
          </View>
        </View>

        {/* Formulário */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Dados Pessoais</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              placeholderTextColor="#64748b"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Endereço da Base</Text>
          </View>
          <Text style={styles.sectionDescription}>
            O endereço da base é usado como ponto de partida para otimizar suas rotas de entrega.
          </Text>

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
              <Text style={styles.geocodingFeedbackText}>Buscando coordenadas automaticamente...</Text>
            </View>
          )}

          {baseLat && baseLng ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.successText}>
                Endereço mapeado com sucesso!
              </Text>
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#f59e0b" />
              <Text style={styles.warningText}>
                Preencha Rua, Número, Cidade e Estado para validar o endereço automaticamente.
              </Text>
            </View>
          )}
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
          <Text style={styles.saveBtnText}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d27',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2e3a',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f120',
    borderWidth: 2,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#6366f120',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366f140',
  },
  roleText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#1a1d27',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2e3a',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionDescription: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 16,
    marginTop: -8,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#94a3b8',
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2a2e3a',
    borderRadius: 10,
    padding: 14,
    color: '#e2e8f0',
    fontSize: 15,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordInput: {
    flex: 1,
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
  coordFieldInput: {
    color: '#94a3b8',
    fontSize: 13,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b15',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f59e0b30',
  },
  warningText: {
    color: '#f59e0b',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e15',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#22c55e30',
  },
  successText: {
    color: '#22c55e',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
