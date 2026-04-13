import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RouteListScreen } from '../screens/RouteListScreen';
import { RouteDetailScreen } from '../screens/RouteDetailScreen';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="RouteList" component={RouteListScreen} />
          <Stack.Screen name="RouteDetail" component={RouteDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
