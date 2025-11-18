
import React from "react";
import { ActivityIndicator, SafeAreaView, Text, StyleSheet } from "react-native";
import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../context/authcontext";

export default function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.text}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Stack>
      <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
      <Stack.Screen name="pantry" options={{ title: "Pantry" }} />
      <Stack.Screen name="recipes" options={{ title: "Recipes" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 16,
  },
});
