import React from 'react';
import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';

export default function HostLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTintColor: Colors.text,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="bookings"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="reviews"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}