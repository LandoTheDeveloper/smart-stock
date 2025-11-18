
import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../context/authcontext";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      // In dev mode this just sets DEV_USER, no backend
      await login({ email, password });
      router.replace("/main/dashboard");
    } catch (err: any) {
      console.log("LOGIN ERROR", err);
      Alert.alert("Login failed", err?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Button
        title={submitting ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={submitting}
      />

      <Link href="/auth/signup" style={styles.link}>
        Don&apos;t have an account? Sign up
      </Link>

      <Link href="/" style={styles.link}>
        Back to start
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
