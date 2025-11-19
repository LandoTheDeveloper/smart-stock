
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
          title: "Pantry",
        }}
      />
      <Stack.Screen
        name="recipes"
        options={{
          title: "Recipes",
        }}
      />


      <Stack.Screen
        name="scan"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
