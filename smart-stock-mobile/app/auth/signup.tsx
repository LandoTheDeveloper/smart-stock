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
import { Entypo } from '@expo/vector-icons';

import Logo from "../../assets/SmartStockLogoTransparent.png";

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);

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
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!visible}
        />
        <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.showPasswordButton}>
          {visible ? (<Entypo name="eye"/>) : (<Entypo name="eye-with-line"/>)}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignup}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Creating account..." : "Sign Up"}
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

  linkText: {
    marginTop: 14,
    textAlign: "center",
    color: "#5f6b63",
  },

  link: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  showPasswordButton: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
    top: -10,
    width: 30,
  },
});
