import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { routesService } from '../services/routes.service';

export function CreateRouteScreen() {
  const navigation = useNavigation<any>();
  
  const now = new Date();
  const defaultDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [form, setForm] = useState({
    name: '',
    date: defaultDate,
  });
  const [loading, setLoading] = useState(false);

  const handleCreateRoute = async () => {
    if (!form.name || !form.date) {
      Alert.alert('Erro', 'Preencha todos os campos da rota.');
      return;
    }
    

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;
    const match = form.date.match(dateRegex);
    if (!match) {
      Alert.alert('Erro', 'Data deve estar no formato DD/MM/AAAA HH:MM');
      return;
    }

    setLoading(true);
    try {
      const [, day, month, year, hour, minute] = match;
      const isoDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).toISOString();

      const payload = {
        name: form.name,
        date: isoDate,
      };
      await routesService.createRoute(payload);
      Alert.alert('Sucesso', 'Rota cadastrada com sucesso!');
      
      const newNow = new Date();
      const newDefault = `${String(newNow.getDate()).padStart(2, '0')}/${String(newNow.getMonth() + 1).padStart(2, '0')}/${newNow.getFullYear()} ${String(newNow.getHours()).padStart(2, '0')}:${String(newNow.getMinutes()).padStart(2, '0')}`;
      setForm({ name: '', date: newDefault });
      
      navigation.navigate('Entregas');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro', err.response?.data?.message || 'Falha ao criar rota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nova Rota</Text>
        
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Rota</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Zona Sul - Rota 1"
              placeholderTextColor="#64748b"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data e Hora (DD/MM/AAAA HH:MM)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 20/05/2024 14:30"
              placeholderTextColor="#64748b"
              value={form.date}
              onChangeText={(text) => setForm({ ...form, date: text })}
            />
          </View>

          <TouchableOpacity 
            style={styles.submitBtn} 
            onPress={handleCreateRoute}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Criando...' : 'Criar Rota'}
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
  input: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2a2e3a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
  },
  submitBtn: {
    backgroundColor: '#6366f1',
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
});
