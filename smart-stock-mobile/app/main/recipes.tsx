
import React from "react";
import { SafeAreaView, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function RecipesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Recipes</Text>
      <Text>Recipes will go here.</Text>

      <Link href="/main/dashboard" style={styles.link}>
        Back to Dashboard
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
