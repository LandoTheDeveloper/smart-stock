import React, { useState, useEffect } from "react";
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
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from "../../context/authcontext";
import { API_BASE_URL } from '../../lib/api';

import Logo from "../../assets/SmartStockLogoTransparent.png";

WebBrowser.maybeCompleteAuthSession();

export default function SignupScreen() {
  const router = useRouter();
  const { signup, setSession } = useAuth();
  const params = useLocalSearchParams<{ error?: string }>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.error) {
      Alert.alert('Authentication Error', params.error);
    }
  }, [params.error]);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setSubmitting(true);
      await signup({ email, password, name });
      router.replace("/main/dashboard");
    } catch (err: any) {
      console.log("SIGNUP ERROR", err);
      Alert.alert("Signup failed", err?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const authUrl = `${API_BASE_URL}/api/auth/google?platform=mobile`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'smartstockmobile://');

      if (result.type === 'success' && result.url) {
        // Extract token from URL
        const urlObj = new URL(result.url);
        const token = urlObj.searchParams.get('token');
        const error = urlObj.searchParams.get('error');

        if (error) {
          Alert.alert('Google Signup failed', error);
          return;
        }

        if (token) {
          await setSession(token);
          router.replace('/main/dashboard');
        }
      }
    } catch (err: any) {
      console.log('GOOGLE SIGNUP ERROR', err);
      // User cancelled or other error
      if (err.type !== 'dismiss') {
        Alert.alert('Google Signup failed', err?.message ?? 'Unknown error');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={Logo} style={styles.logo} resizeMode="contain" />

      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
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
          onPress={handleSignup}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Creating account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleGoogleSignup}
          disabled={submitting}
        >
          <Text style={[styles.buttonText, styles.googleButtonText]}>
            Sign up with Google
          </Text>
        </TouchableOpacity>

        <Text style={styles.linkText}>
          Already have an account?{" "}
          <Link href="/auth/login" style={styles.link}>
            Log in
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
    borderColor: "#e3ece5",
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

  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 12,
  },

  googleButtonText: {
    color: '#333',
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
