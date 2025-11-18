
import React from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TextInput,
  Button,
} from "react-native";
import { Link } from "expo-router";

export default function SignupScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
      />

      <Button title="Create account (dummy)" onPress={() => {}} />

      <Link href="/auth/login" style={styles.link}>
        Already have an account? Login
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
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  link: {
    marginTop: 8,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
