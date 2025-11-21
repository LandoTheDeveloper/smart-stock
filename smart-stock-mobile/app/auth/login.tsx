
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../context/authcontext";

import Logo from "../../assets/SmartStockLogoTransparent.png";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      setSubmitting(true);
      // In dev mode this just sets DEV_USER and token
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
      <Image source={Logo} style={styles.logo} resizeMode="contain" />

      <View style={styles.card}>
        <Text style={styles.title}>Welcome </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Logging in..." : "Log In"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.linkText}>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" style={styles.link}>
            Sign up
          </Link>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6fbf7",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 180,
    height: 180,
    alignSelf: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    borderColor: "#e3ece5",
    borderWidth: 1,
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#2e7d32",
  },
  input: {
    borderWidth: 1,
    borderColor: "#000000ff",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  button: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 10,
    marginTop: 6,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 16,
  },
  linkText: {
    marginTop: 14,
    textAlign: "center",
    color: "#5f6b63",
  },
  link: {
    color: "#2e7d32",
    fontWeight: "600",
  },
});
