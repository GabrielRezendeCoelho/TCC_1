import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authService } from '../services/auth.service';
import { maskCpf, isValidCpf, unmask } from '../utils/masks';
import { Ionicons } from '@expo/vector-icons';

export function RegisterScreen() {
  const navigation = useNavigation<any>();

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const getPasswordStrength = () => {
    const { password } = form;
    if (!password) return null;
    if (password.length < 8) return { label: 'Fraca (mín. 8 caracteres)', color: '#ef4444' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 8) return { label: 'Forte', color: '#10b981' };
    return { label: 'Média', color: '#f59e0b' };
  };

  const handleRegister = async () => {
    if (!form.name || !form.cpf || !form.email || !form.password || !form.confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    if (!isValidCpf(form.cpf)) {
      Alert.alert('Erro', 'CPF inválido');
      return;
    }

    if (!isValidEmail(form.email)) {
      Alert.alert('Erro', 'E-mail inválido');
      return;
    }

    if (form.password.length < 8) {
      Alert.alert('Erro', 'Senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: form.name,
        email: form.email,
        cpf: unmask(form.cpf),
        password: form.password,
        role: 'DRIVER' // Cadastros no app mobile são por padrão DRIVER
      });
      
      Alert.alert('Sucesso', 'Conta criada! Você já pode fazer login.');
      navigation.goBack(); // Volta para o login
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao criar conta.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>TG</Text>
          </View>
          <Text style={styles.title}>TrackGo</Text>
          <Text style={styles.subtitle}>Crie sua conta de Motorista</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Nome Completo</Text>
          <TextInput
            style={styles.input}
            placeholder="João da Silva"
            placeholderTextColor="#64748b"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            editable={!loading}
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor="#64748b"
            keyboardType="numeric"
            maxLength={14}
            value={form.cpf}
            onChangeText={(text) => setForm({ ...form, cpf: maskCpf(text) })}
            editable={!loading}
          />

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            editable={!loading}
          />

          <Text style={styles.label}>Senha</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={22} 
                color="#94a3b8" 
              />
            </TouchableOpacity>
          </View>
          {strength && (
            <Text style={[styles.strengthText, { color: strength.color }]}>
              Força da senha: {strength.label}
            </Text>
          )}

          <Text style={[styles.label, { marginTop: 12 }]}>Confirmar Senha</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#64748b"
              secureTextEntry={!showConfirmPassword}
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons 
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={22} 
                color="#94a3b8" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.btnPrimary, loading && styles.btnDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>Cadastrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.backLinkText}>Já tem conta? Fazer Login</Text>
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
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
  },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#6366f1',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  form: {
    backgroundColor: '#1a1d27',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2e3a',
  },
  label: {
    color: '#e2e8f0',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2a2e3a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1117',
    borderWidth: 1,
    borderColor: '#2a2e3a',
    borderRadius: 8,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strengthText: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
  btnPrimary: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#94a3b8',
    fontSize: 14,
  },
});
