import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/authcontext";

import AppleAvatar from "../../assets/AppleAvatar.png";
import CornAvatar from "../../assets/CornAvatar.png";
import TurkeyAvatar from "../../assets/TurkeyAvatar.png";
import BroccoliAvatar from "../../assets/BroccoliAvatar.png";

export default function ProfilePage() {
  const router = useRouter();
  const {
    logout,
    avatar,
    setAvatar,
    displayName,
    setDisplayName,
  } = useAuth();

  const avatarOptions = [
    { name: "AppleAvatar.png", src: AppleAvatar },
    { name: "CornAvatar.png", src: CornAvatar },
    { name: "TurkeyAvatar.png", src: TurkeyAvatar },
    { name: "BroccoliAvatar.png", src: BroccoliAvatar },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <Image
          source={avatarOptions.find((a) => a.name === avatar)?.src}
          style={styles.mainAvatar}
        />
      </View>

      {/* Display name */}
      <TextInput
        style={styles.input}
        placeholder="Display Name"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <Text style={styles.subtitle}>Choose Avatar</Text>

      {/* Avatar selector */}
      <View style={styles.avatarRow}>
        {avatarOptions.map((item) => (
          <TouchableOpacity
            key={item.name}
            style={[
              styles.avatarChoice,
              avatar === item.name && styles.selectedAvatar,
            ]}
            onPress={() => setAvatar(item.name)}
          >
            <Image source={item.src} style={styles.choiceImg} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Household Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push("/main/household")}
      >
        <Ionicons name="people-outline" size={20} color="#2e7d32" style={{ marginRight: 8 }} />
        <Text style={styles.settingsText}>Household</Text>
      </TouchableOpacity>

      {/* Recipe Preferences Button */}
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => router.push("/main/settings")}
      >
        <Ionicons name="settings-outline" size={20} color="#2e7d32" style={{ marginRight: 8 }} />
        <Text style={styles.settingsText}>Recipe Preferences & Allergies</Text>
      </TouchableOpacity>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={() => {
          logout();
          router.replace("/auth/login");
        }}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/main/dashboard")}
      >
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 110;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6fbf7",
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
    color: "#2e7d32",
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 16,
  },

  mainAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: "#2e7d32",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#fff",
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },

  avatarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  avatarChoice: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },

  selectedAvatar: {
    borderColor: "#2e7d32",
  },

  choiceImg: {
    width: "100%",
    height: "100%",
  },

  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2e7d32",
  },
  settingsText: {
    color: "#2e7d32",
    fontWeight: "600",
  },

  signOutButton: {
    marginTop: 10,
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 10,
  },
  signOutText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },

  backButton: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#ccc",
    borderRadius: 8,
  },
  backText: {
    textAlign: "center",
    fontWeight: "600",
  },
});
