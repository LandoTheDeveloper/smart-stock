
import React from "react";
import { SafeAreaView, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text>Welcome to Smart Stock Mobile 🎉</Text>

      <Link href="/main/pantry" style={styles.link}>
        Go to Pantry
      </Link>

      <Link href="/main/recipes" style={styles.link}>
        Go to Recipes
      </Link>

      <Link href="/" style={styles.link}>
        Back to Home
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  link: {
    fontSize: 16,
    textDecorationLine: "underline",
  },
});
