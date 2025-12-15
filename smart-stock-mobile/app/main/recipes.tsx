import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";

interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
  _id?: string;
  id?: string;
  title: string;
  minutes: number;
  servings: number;
  tags: string[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: Ingredient[];
  steps: string[];
  isFavorite?: boolean;
  isCustom?: boolean;
  createdByName?: string;
}

interface RecipeHistoryItem {
  _id: string;
  prompt?: string;
  recipes: Recipe[];
  createdAt: string;
}

const BOTTOM_BAR_HEIGHT = 95;

type TabType = "saved" | "generate" | "history";

export default function RecipesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("saved");
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [savingRecipe, setSavingRecipe] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [history, setHistory] = useState<RecipeHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const fetchSavedRecipes = useCallback(async () => {
    try {
      const response = await api.get("/api/saved-recipes");
      if (response.data.success) {
        setSavedRecipes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching saved recipes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const response = await api.get("/api/recipe-history");
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedRecipes();
    fetchHistory();
  }, [fetchSavedRecipes, fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    if (tab === "history") {
      fetchHistory().finally(() => setRefreshing(false));
    } else {
      fetchSavedRecipes();
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    Alert.alert("Delete History", "Remove this generation from history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/recipe-history/${id}`);
            setHistory((prev) => prev.filter((h) => h._id !== id));
          } catch (error) {
            Alert.alert("Error", "Failed to delete history item");
          }
        },
      },
    ]);
  };

  const handleClearHistory = () => {
    Alert.alert("Clear All History", "Are you sure you want to clear all generation history?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear All",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/api/recipe-history");
            setHistory([]);
          } catch (error) {
            Alert.alert("Error", "Failed to clear history");
          }
        },
      },
    ]);
  };

  const formatHistoryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGenerateRecipes = async () => {
    setGenerating(true);
    setGeneratedRecipes([]);
    try {
      const response = await api.post("/api/ai/generate-recipes", {
        userPrompt: userPrompt.trim() || undefined,
      });
      if (response.data.success) {
        setGeneratedRecipes(response.data.recipes);
      } else {
        Alert.alert("Error", response.data.message || "Failed to generate recipes");
      }
    } catch (error: any) {
      console.error("Error generating recipes:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to generate recipes. Make sure you have items in your pantry."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    const recipeId = recipe._id || recipe.id || "";
    setSavingRecipe(recipeId);
    try {
      await api.post("/api/saved-recipes", {
        title: recipe.title,
        minutes: recipe.minutes,
        servings: recipe.servings,
        tags: recipe.tags,
        kcal: recipe.kcal,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      });
      Alert.alert("Success", "Recipe saved!");
      fetchSavedRecipes();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to save recipe");
    } finally {
      setSavingRecipe(null);
    }
  };

  const handleToggleFavorite = async (recipe: Recipe) => {
    try {
      await api.patch(`/api/saved-recipes/${recipe._id}/favorite`);
      fetchSavedRecipes();
    } catch (error) {
      Alert.alert("Error", "Failed to update favorite status");
    }
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert("Delete Recipe", `Are you sure you want to delete "${recipe.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/saved-recipes/${recipe._id}`);
            fetchSavedRecipes();
          } catch (error) {
            Alert.alert("Error", "Failed to delete recipe");
          }
        },
      },
    ]);
  };

  const renderRecipeCard = (recipe: Recipe, isSaved: boolean) => {
    const recipeId = recipe._id || recipe.id || recipe.title;
    const isExpanded = expandedRecipe === recipeId;

    return (
      <View key={recipeId} style={styles.recipeCard}>
        <TouchableOpacity
          style={styles.recipeHeader}
          onPress={() => setExpandedRecipe(isExpanded ? null : recipeId)}
        >
          <View style={styles.recipeTitleRow}>
            <View style={styles.titleAndAuthor}>
              <Text style={styles.recipeTitle} numberOfLines={2}>
                {recipe.title}
              </Text>
              {recipe.createdByName && (
                <Text style={styles.recipeAuthor}>by {recipe.createdByName}</Text>
              )}
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>

          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="#666" style={styles.metaIcon} /><Text style={styles.metaText}>{recipe.minutes} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={14} color="#666" style={styles.metaIcon} /><Text style={styles.metaText}>{recipe.servings} servings</Text>
            </View>
          </View>

          <View style={styles.macros}>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{recipe.kcal}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{recipe.protein}g</Text>
              <Text style={styles.macroLabel}>protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{recipe.carbs}g</Text>
              <Text style={styles.macroLabel}>carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroValue}>{recipe.fat}g</Text>
              <Text style={styles.macroLabel}>fat</Text>
            </View>
          </View>

          {recipe.tags && recipe.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
              {recipe.tags.slice(0, 5).map((tag, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.recipeDetails}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients.map((ing, idx) => (
              <Text key={idx} style={styles.ingredientText}>
                • {ing.amount} {ing.name}
              </Text>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Instructions</Text>
            {recipe.steps.map((step, idx) => (
              <Text key={idx} style={styles.stepText}>
                {idx + 1}. {step}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.recipeActions}>
          {isSaved ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleToggleFavorite(recipe)}
              >
                <Ionicons
                  name={recipe.isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={recipe.isFavorite ? "#d32f2f" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteRecipe(recipe)}
              >
                <Ionicons name="trash-outline" size={20} color="#d32f2f" />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveRecipe(recipe)}
              disabled={savingRecipe === recipeId}
            >
              {savingRecipe === recipeId ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="bookmark-outline" size={18} color="#fff" /><Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2e7d32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipes</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === "saved" && styles.tabActive]}
          onPress={() => setTab("saved")}
        >
          <Text style={[styles.tabText, tab === "saved" && styles.tabTextActive]}>
            My Recipes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "generate" && styles.tabActive]}
          onPress={() => setTab("generate")}
        >
          <Text style={[styles.tabText, tab === "generate" && styles.tabTextActive]}>
            Generate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "history" && styles.tabActive]}
          onPress={() => setTab("history")}
        >
          <Text style={[styles.tabText, tab === "history" && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          tab === "saved" ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />
          ) : undefined
        }
      >
        {tab === "saved" ? (
          loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#2e7d32" />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : savedRecipes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No saved recipes yet</Text>
              <Text style={styles.emptySubtext}>
                Generate recipes and save your favorites
              </Text>
              <TouchableOpacity
                style={styles.generateButton}
                onPress={() => setTab("generate")}
              >
                <Text style={styles.generateButtonText}>Generate Recipes</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.filterButton, showFavoritesOnly && styles.filterButtonActive]}
                onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Ionicons
                  name={showFavoritesOnly ? "heart" : "heart-outline"}
                  size={18}
                  color={showFavoritesOnly ? "#fff" : "#d32f2f"}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.filterButtonText, showFavoritesOnly && styles.filterButtonTextActive]}>
                  {showFavoritesOnly ? "Showing Favorites" : "Show Favorites Only"}
                </Text>
              </TouchableOpacity>
              {(showFavoritesOnly ? savedRecipes.filter(r => r.isFavorite) : savedRecipes).length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="heart-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>No favorite recipes yet</Text>
                  <Text style={styles.emptySubtext}>
                    Tap the heart icon on recipes to add them to favorites
                  </Text>
                </View>
              ) : (
                (showFavoritesOnly ? savedRecipes.filter(r => r.isFavorite) : savedRecipes).map((recipe) => renderRecipeCard(recipe, true))
              )}
            </>
          )
        ) : tab === "generate" ? (
          <View>
            <View style={styles.promptSection}>
              <Text style={styles.promptLabel}>
                Optional: Add specific requirements
              </Text>
              <TextInput
                style={styles.promptInput}
                value={userPrompt}
                onChangeText={setUserPrompt}
                placeholder="e.g., high protein, quick meals, Italian cuisine..."
                multiline
                numberOfLines={2}
              />
              <TouchableOpacity
                style={[styles.generateButton, generating && styles.buttonDisabled]}
                onPress={handleGenerateRecipes}
                disabled={generating}
              >
                {generating ? (
                  <View style={styles.generatingRow}>
                    <ActivityIndicator size="small" color="#fff" /><Text style={[styles.generateButtonText, styles.generatingText]}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={styles.generateButtonText}>
                    Generate Recipes from Pantry
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {generatedRecipes.length > 0 && (
              <View style={styles.generatedSection}>
                <Text style={styles.generatedTitle}>
                  Generated Recipes ({generatedRecipes.length})
                </Text>
                {generatedRecipes.map((recipe) => renderRecipeCard(recipe, false))}
              </View>
            )}
          </View>
        ) : tab === "history" ? (
          historyLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#2e7d32" />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No generation history</Text>
              <Text style={styles.emptySubtext}>
                Your generated recipes will appear here
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>
                  {history.length} Generation{history.length !== 1 ? "s" : ""}
                </Text>
                <TouchableOpacity onPress={handleClearHistory}>
                  <Text style={styles.clearButton}>Clear All</Text>
                </TouchableOpacity>
              </View>
              {history.map((item) => (
                <View key={item._id} style={styles.historyCard}>
                  <TouchableOpacity
                    style={styles.historyCardHeader}
                    onPress={() =>
                      setExpandedHistory(expandedHistory === item._id ? null : item._id)
                    }
                  >
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyDate}>{formatHistoryDate(item.createdAt)}</Text>
                      {item.prompt && (
                        <Text style={styles.historyPrompt} numberOfLines={1}>
                          "{item.prompt}"
                        </Text>
                      )}
                      <Text style={styles.historyRecipeCount}>
                        {item.recipes.length} recipe{item.recipes.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    <View style={styles.historyActions}>
                      <TouchableOpacity
                        style={styles.historyDeleteButton}
                        onPress={() => handleDeleteHistoryItem(item._id)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#d32f2f" />
                      </TouchableOpacity>
                      <Ionicons
                        name={expandedHistory === item._id ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#666"
                      />
                    </View>
                  </TouchableOpacity>
                  {expandedHistory === item._id && (
                    <View style={styles.historyRecipes}>
                      {item.recipes.map((recipe, idx) => (
                        <View key={idx} style={styles.historyRecipeItem}>
                          <View style={styles.historyRecipeInfo}>
                            <Text style={styles.historyRecipeName}>{recipe.title}</Text>
                            <Text style={styles.historyRecipeMeta}>
                              {recipe.minutes} min • {recipe.kcal} kcal
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.historySaveButton}
                            onPress={() => handleSaveRecipe(recipe)}
                          >
                            <Ionicons name="bookmark-outline" size={18} color="#2e7d32" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )
        ) : null}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push("/main/dashboard")}
        ><Ionicons name="home-outline" size={28} color="#2e7d32" /><Text style={styles.bottomLabel}>Home</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbf7" },

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

  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#2e7d32",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#888",
  },
  tabTextActive: {
    color: "#2e7d32",
  },

  content: {
    padding: 16,
    paddingBottom: BOTTOM_BAR_HEIGHT + 20,
  },

  centered: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
    textAlign: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d32f2f",
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  filterButtonActive: {
    backgroundColor: "#d32f2f",
    borderColor: "#d32f2f",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d32f2f",
  },
  filterButtonTextActive: {
    color: "#fff",
  },

  promptSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e3ece5",
    marginBottom: 16,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  promptInput: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  generatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  generatingText: {
    marginLeft: 8,
  },

  generatedSection: {
    marginTop: 8,
  },
  generatedTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#333",
  },

  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e3ece5",
    marginBottom: 12,
    overflow: "hidden",
  },
  recipeHeader: {
    padding: 14,
  },
  recipeTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleAndAuthor: {
    flex: 1,
    marginRight: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  recipeAuthor: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  recipeMeta: {
    flexDirection: "row",
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
  },
  macros: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    backgroundColor: "#f8faf8",
    padding: 10,
    borderRadius: 8,
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2e7d32",
  },
  macroLabel: {
    fontSize: 11,
    color: "#888",
  },
  tagsRow: {
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  tagText: {
    fontSize: 12,
    color: "#2e7d32",
  },

  recipeDetails: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },

  recipeActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    padding: 10,
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
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

  // History styles
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  clearButton: {
    fontSize: 14,
    color: "#d32f2f",
    fontWeight: "600",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e3ece5",
    marginBottom: 12,
    overflow: "hidden",
  },
  historyCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  historyPrompt: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 4,
  },
  historyRecipeCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  historyActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyDeleteButton: {
    padding: 8,
    marginRight: 4,
  },
  historyRecipes: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 8,
  },
  historyRecipeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  historyRecipeInfo: {
    flex: 1,
  },
  historyRecipeName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  historyRecipeMeta: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  historySaveButton: {
    padding: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
  },
});
