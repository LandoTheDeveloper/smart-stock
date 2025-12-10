import React from "react";
import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="pantry"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="recipes"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="shopping"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="mealplanner"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="scan"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="profilepage"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
