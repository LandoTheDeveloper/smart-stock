import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";

const DIETARY_PREFERENCES = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Keto",
  "Low-Carb",
  "High-Protein",
  "Gluten-Free",
  "Dairy-Free",
  "Halal",
  "Kosher",
];

const COMMON_ALLERGIES = [
  "Peanuts",
  "Tree Nuts",
  "Milk",
  "Eggs",
  "Wheat",
  "Soy",
  "Fish",
  "Shellfish",
  "Sesame",
];

type UserPreferences = {
  dietaryPreferences: string[];
  allergies: string[];
  customAllergies: string;
  avoidIngredients: string;
  calorieTarget: number;
  proteinTarget: number;
  cuisinePreferences: string;
};

const BOTTOM_BAR_HEIGHT = 95;

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryPreferences: [],
    allergies: [],
    customAllergies: "",
    avoidIngredients: "",
    calorieTarget: 0,
    proteinTarget: 0,
    cuisinePreferences: "",
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get("/api/user/preferences");
      if (response.data.success && response.data.data) {
        setPreferences(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put("/api/user/preferences", preferences);
      if (response.data.success) {
        Alert.alert("Success", "Preferences saved successfully!");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const toggleDietaryPref = (pref: string) => {
    setPreferences((prev) => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(pref)
        ? prev.dietaryPreferences.filter((p) => p !== pref)
        : [...prev.dietaryPreferences, pref],
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setPreferences((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2e7d32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Preferences</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionDescription}>
          These preferences will be used when generating recipe suggestions
        </Text>

        {/* Dietary Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          <View style={styles.chipContainer}>
            {DIETARY_PREFERENCES.map((pref) => (
              <TouchableOpacity
                key={pref}
                style={[
                  styles.chip,
                  preferences.dietaryPreferences.includes(pref) && styles.chipActive,
                ]}
                onPress={() => toggleDietaryPref(pref)}
              >
                <Text
                  style={[
                    styles.chipText,
                    preferences.dietaryPreferences.includes(pref) && styles.chipTextActive,
                  ]}
                >
                  {pref}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Allergies</Text>
          <View style={styles.chipContainer}>
            {COMMON_ALLERGIES.map((allergy) => (
              <TouchableOpacity
                key={allergy}
                style={[
                  styles.chip,
                  styles.allergyChip,
                  preferences.allergies.includes(allergy) && styles.allergyChipActive,
                ]}
                onPress={() => toggleAllergy(allergy)}
              >
                <Text
                  style={[
                    styles.chipText,
                    styles.allergyChipText,
                    preferences.allergies.includes(allergy) && styles.allergyChipTextActive,
                  ]}
                >
                  {allergy}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Other allergies (comma separated)"
            value={preferences.customAllergies}
            onChangeText={(text) =>
              setPreferences((prev) => ({ ...prev, customAllergies: text }))
            }
          />
        </View>

        {/* Ingredients to Avoid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients to Avoid</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., cilantro, olives, anchovies"
            value={preferences.avoidIngredients}
            onChangeText={(text) =>
              setPreferences((prev) => ({ ...prev, avoidIngredients: text }))
            }
          />
          <Text style={styles.helperText}>
            Comma-separated list of ingredients you don't like
          </Text>
        </View>

        {/* Cuisine Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Italian, Mexican, Asian, Mediterranean"
            value={preferences.cuisinePreferences}
            onChangeText={(text) =>
              setPreferences((prev) => ({ ...prev, cuisinePreferences: text }))
            }
          />
        </View>

        {/* Nutrition Targets */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Nutrition Targets</Text>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Calorie Target</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2000"
                keyboardType="numeric"
                value={preferences.calorieTarget ? String(preferences.calorieTarget) : ""}
                onChangeText={(text) =>
                  setPreferences((prev) => ({
                    ...prev,
                    calorieTarget: Number(text) || 0,
                  }))
                }
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Protein Target (g)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 150"
                keyboardType="numeric"
                value={preferences.proteinTarget ? String(preferences.proteinTarget) : ""}
                onChangeText={(text) =>
                  setPreferences((prev) => ({
                    ...prev,
                    proteinTarget: Number(text) || 0,
                  }))
                }
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Preferences"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push("/main/dashboard")}
        >
          <Ionicons name="home-outline" size={28} color="#2e7d32" />
          <Text style={styles.bottomLabel}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbf7" },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#2e7d32" },

  content: {
    padding: 16,
    paddingBottom: BOTTOM_BAR_HEIGHT + 20,
  },

  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e3ece5",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },

  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#2e7d32",
  },
  chipText: {
    fontSize: 14,
    color: "#666",
  },
  chipTextActive: {
    color: "#fff",
  },

  allergyChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  allergyChipActive: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  allergyChipText: {
    color: "#ef4444",
  },
  allergyChipTextActive: {
    color: "#fff",
  },

  input: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
    marginTop: 8,
  },

  helperText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },

  row: {
    flexDirection: "row",
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },

  saveButton: {
    backgroundColor: "#2e7d32",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_BAR_HEIGHT,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e3ece5",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomButton: { alignItems: "center" },
  bottomLabel: { fontSize: 12, color: "#2e7d32", marginTop: 4 },
});
