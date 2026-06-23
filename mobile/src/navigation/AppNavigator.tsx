import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RouteListScreen } from '../screens/RouteListScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { CreateRouteScreen } from '../screens/CreateRouteScreen';
import { RouteMapScreen } from '../screens/RouteMapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1a1d27',
          borderTopColor: '#2a2e3a',
          paddingBottom: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ color, size }) => {
          let iconName: any = 'list-outline';
          if (route.name === 'Entregas') {
            iconName = 'list-outline';
          } else if (route.name === 'Nova Rota') {
            iconName = 'add-circle-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Entregas" component={RouteListScreen} />
      <Tab.Screen name="Nova Rota" component={CreateRouteScreen} />
    </Tab.Navigator>
  );
}

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
          <Stack.Screen name="RouteMap" component={RouteMapScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Scanner" component={ScannerScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
