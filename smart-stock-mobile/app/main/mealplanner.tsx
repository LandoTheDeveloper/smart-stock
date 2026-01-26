import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import axios from "axios";

interface Ingredient {
  name: string;
  amount: string;
}

interface Recipe {
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
}

interface MealPlan {
  _id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  recipe: Recipe;
  completed: boolean;
  notes?: string;
  createdByName?: string;
}

interface SavedRecipe {
  _id: string;
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
  isFavorite: boolean;
  isCustom: boolean;
}

interface PantryItem {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
}

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const BOTTOM_BAR_HEIGHT = 95;

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MealPlannerScreen() {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<(typeof MEAL_TYPES)[number]>("dinner");

  // Recipe selection
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);
  const [recipePrompt, setRecipePrompt] = useState("");
  const [addMealTab, setAddMealTab] = useState<"favorites" | "generate">("favorites");

  // Abort controller for cancelling recipe generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pantry and ingredients modal
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const fetchMealPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/meal-plans", {
        params: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
        },
      });
      if (response.data.success) {
        setMealPlans(response.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch meal plans:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekStart, weekEnd]);

  const fetchSavedRecipes = useCallback(async () => {
    try {
      const response = await api.get("/api/saved-recipes");
      if (response.data.success) {
        setSavedRecipes(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch saved recipes:", err);
    }
  }, []);

  const fetchPantryItems = useCallback(async () => {
    try {
      const response = await api.get("/api/pantry");
      if (response.data.success) {
        setPantryItems(response.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch pantry items:", err);
    }
  }, []);

  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  useEffect(() => {
    fetchSavedRecipes();
    fetchPantryItems();
  }, [fetchSavedRecipes, fetchPantryItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMealPlans();
  };

  const getMealsForDay = (date: Date, mealType: string) => {
    const dateStr = date.toISOString().split("T")[0];
    return mealPlans.filter((m) => {
      const mealDateStr = new Date(m.date).toISOString().split("T")[0];
      return mealDateStr === dateStr && m.mealType === mealType;
    });
  };

  const handleGenerateRecipes = async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setGeneratingRecipes(true);
    try {
      const response = await api.post("/api/ai/generate-recipes", {
        userPrompt: recipePrompt.trim() || undefined,
      }, {
        signal: abortControllerRef.current.signal
      });
      if (response.data.success) {
        setGeneratedRecipes(response.data.recipes);
      }
    } catch (err: any) {
      if (axios.isCancel(err)) {
        // Request was cancelled by user - don't show error
        return;
      }
      Alert.alert("Error", err.response?.data?.message || "Failed to generate recipes");
    } finally {
      setGeneratingRecipes(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setGeneratingRecipes(false);
    }
  };

  const handleAddMeal = async (recipe: Recipe) => {
    if (!selectedDate) return;

    try {
      const response = await api.post("/api/meal-plans", {
        date: selectedDate.toISOString(),
        mealType: selectedMealType,
        recipe,
      });

      if (response.data.success) {
        setMealPlans((prev) => [...prev, response.data.data]);
        setShowAddModal(false);
        setGeneratedRecipes([]);
        setRecipePrompt("");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to add meal");
    }
  };

  const handleAddSavedRecipe = (savedRecipe: SavedRecipe) => {
    const recipe: Recipe = {
      id: savedRecipe._id,
      title: savedRecipe.title,
      minutes: savedRecipe.minutes,
      servings: savedRecipe.servings,
      tags: savedRecipe.tags,
      kcal: savedRecipe.kcal,
      protein: savedRecipe.protein,
      carbs: savedRecipe.carbs,
      fat: savedRecipe.fat,
      ingredients: savedRecipe.ingredients,
      steps: savedRecipe.steps,
    };
    handleAddMeal(recipe);
  };

  const handleToggleCompleted = async (id: string) => {
    try {
      const response = await api.put(`/api/meal-plans/${id}/toggle`);
      if (response.data.success) {
        setMealPlans((prev) => prev.map((m) => (m._id === id ? response.data.data : m)));
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update meal");
    }
  };

  const handleDeleteMeal = (id: string, title: string) => {
    Alert.alert("Remove Meal", `Remove "${title}" from plan?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await api.delete(`/api/meal-plans/${id}`);
            if (response.data.success) {
              setMealPlans((prev) => prev.filter((m) => m._id !== id));
            }
          } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to remove meal");
          }
        },
      },
    ]);
  };

  const navigateWeek = (direction: number) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setWeekStart(newStart);
  };

  const handleGenerateShoppingList = () => {
    const missingIngredients = categorizedIngredients.missing;

    if (missingIngredients.length === 0) {
      if (mealPlans.length === 0) {
        Alert.alert("No Meals", "Add some meals to your plan first.");
      } else {
        Alert.alert("All Set!", "You have all ingredients in your pantry!");
      }
      return;
    }

    Alert.alert(
      "Add Missing Ingredients",
      `Add ${missingIngredients.length} missing ingredients to your shopping list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add",
          onPress: async () => {
            try {
              let added = 0;
              for (const ing of missingIngredients) {
                try {
                  // Parse amount string like "1 cup" into quantity (number) and unit (string)
                  const amountStr = ing.amount || "1";
                  const match = amountStr.match(/^([\d.\/]+)\s*(.*)$/);
                  let quantity = 1;
                  let unit = "";

                  if (match) {
                    // Handle fractions like "1/2"
                    const numStr = match[1];
                    if (numStr.includes("/")) {
                      const [num, denom] = numStr.split("/");
                      quantity = parseFloat(num) / parseFloat(denom);
                    } else {
                      quantity = parseFloat(numStr) || 1;
                    }
                    unit = match[2]?.trim() || "";
                  }

                  await api.post("/api/shopping-list", {
                    name: ing.name,
                    quantity: quantity,
                    unit: unit || undefined,
                    checked: false,
                  });
                  added++;
                } catch (err: any) {
                  // Skip duplicates silently
                  if (!err.response?.data?.message?.includes("already exists")) {
                    console.error("Failed to add:", ing.name, err.response?.data || err.message);
                  }
                }
              }
              Alert.alert(
                "Success",
                `Added ${added} items to your shopping list!`,
                [
                  { text: "OK" },
                  {
                    text: "View Shopping List",
                    onPress: () => router.push("/main/shopping"),
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert("Error", "Failed to add items to shopping list");
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const openAddModal = (date: Date, mealType: (typeof MEAL_TYPES)[number]) => {
    setSelectedDate(date);
    setSelectedMealType(mealType);
    setShowAddModal(true);
    setGeneratedRecipes([]);
    setRecipePrompt("");
    setAddMealTab("favorites");
  };

  const favoriteRecipes = useMemo(() => {
    return savedRecipes.filter((r) => r.isFavorite);
  }, [savedRecipes]);

  // Categorize ingredients as available or missing (only for uncompleted meals)
  const categorizedIngredients = useMemo(() => {
    const ingredientMap = new Map<string, { amount: string; inPantry: boolean }>();
    const pantryNamesLower = pantryItems.map(p => p.name.toLowerCase().trim());

    // Only include ingredients from meals that are NOT completed (not crossed out)
    const uncompletedMeals = mealPlans.filter(meal => !meal.completed);

    uncompletedMeals.forEach((meal) => {
      meal.recipe.ingredients.forEach((ing) => {
        const cleanName = ing.name.toLowerCase().replace(/\s*\[buy\]\s*/gi, "").trim();
        if (!ingredientMap.has(cleanName)) {
          const inPantry = pantryNamesLower.some(pName =>
            pName.includes(cleanName) || cleanName.includes(pName)
          );
          ingredientMap.set(cleanName, { amount: ing.amount, inPantry });
        }
      });
    });

    const available: { name: string; amount: string }[] = [];
    const missing: { name: string; amount: string }[] = [];

    ingredientMap.forEach((value, name) => {
      const item = { name, amount: value.amount };
      if (value.inPantry) {
        available.push(item);
      } else {
        missing.push(item);
      }
    });

    return { available, missing };
  }, [mealPlans, pantryItems]);

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2e7d32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Planner</Text>
        <TouchableOpacity onPress={() => setWeekStart(getStartOfWeek(new Date()))}>
          <Text style={styles.todayButton}>Today</Text>
        </TouchableOpacity>
      </View>

      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#2e7d32" />
        </TouchableOpacity>
        <Text style={styles.weekTitle}>
          {formatDate(weekStart)} - {formatDate(weekEnd)}
        </Text>
        <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {/* Ingredients Summary Banner - only show if there are meals */}
      {mealPlans.length > 0 && !loading && (
        <TouchableOpacity
          style={styles.ingredientsBanner}
          onPress={() => setShowIngredientsModal(true)}
        >
          <View style={styles.ingredientsBannerContent}>
            <View style={styles.ingredientsStat}>
              <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
              <Text style={styles.ingredientsStatText}>
                {categorizedIngredients.available.length} in pantry
              </Text>
            </View>
            <View style={styles.ingredientsDivider} />
            <View style={styles.ingredientsStat}>
              <Ionicons name="alert-circle" size={18} color={categorizedIngredients.missing.length > 0 ? "#d32f2f" : "#888"} />
              <Text style={[
                styles.ingredientsStatText,
                categorizedIngredients.missing.length > 0 && styles.ingredientsStatMissing
              ]}>
                {categorizedIngredients.missing.length} missing
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#888" />
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />
        }
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingText}>Loading meal plans...</Text>
          </View>
        ) : (
          weekDays.map((day) => (
            <View key={day.toISOString()} style={styles.dayCard}>
              <View style={[styles.dayHeader, isToday(day) && styles.dayHeaderToday]}>
                <Text style={[styles.dayName, isToday(day) && styles.dayNameToday]}>
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </Text>
                <Text style={[styles.dayDate, isToday(day) && styles.dayDateToday]}>
                  {day.getDate()}
                </Text>
              </View>

              <View style={styles.mealsContainer}>
                {MEAL_TYPES.map((mealType) => {
                  const meals = getMealsForDay(day, mealType);
                  return (
                    <View key={mealType} style={styles.mealSection}>
                      <Text style={styles.mealTypeLabel}>{mealType}</Text>
                      {meals.map((meal) => (
                        <TouchableOpacity
                          key={meal._id}
                          style={[styles.mealItem, meal.completed && styles.mealItemCompleted]}
                          onPress={() => handleToggleCompleted(meal._id)}
                          onLongPress={() => handleDeleteMeal(meal._id, meal.recipe.title)}
                        >
                          <View style={styles.mealContent}>
                            <Text
                              style={[styles.mealTitle, meal.completed && styles.mealTitleCompleted]}
                              numberOfLines={1}
                            >
                              {meal.recipe.title}
                            </Text>
                            {meal.createdByName && (
                              <Text style={styles.mealAuthor}>by {meal.createdByName}</Text>
                            )}
                          </View>
                          <Text style={styles.mealMeta}>
                            {meal.recipe.minutes}min
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.addMealButton}
                        onPress={() => openAddModal(day, mealType)}
                      >
                        <Ionicons name="add" size={16} color="#888" />
                        <Text style={styles.addMealText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push("/main/dashboard")}
        >
          <Ionicons name="home-outline" size={24} color="#2e7d32" />
          <Text style={styles.bottomLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => setShowIngredientsModal(true)}
        >
          <Ionicons name="list-outline" size={24} color="#2e7d32" />
          <Text style={styles.bottomLabel}>Ingredients</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleGenerateShoppingList}
        >
          <Ionicons name="cart-outline" size={24} color="#2e7d32" />
          <Text style={styles.bottomLabel}>Add Missing</Text>
        </TouchableOpacity>
      </View>

      {/* Add Meal Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {selectedMealType} - {selectedDate && formatDate(selectedDate)}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, addMealTab === "favorites" && styles.tabActive]}
                onPress={() => setAddMealTab("favorites")}
              >
                <Text style={[styles.tabText, addMealTab === "favorites" && styles.tabTextActive]}>
                  My Recipes ({savedRecipes.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, addMealTab === "generate" && styles.tabActive]}
                onPress={() => setAddMealTab("generate")}
              >
                <Text style={[styles.tabText, addMealTab === "generate" && styles.tabTextActive]}>
                  Generate New
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {addMealTab === "favorites" ? (
                savedRecipes.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No saved recipes yet</Text>
                    <Text style={styles.emptySubtext}>
                      Go to Recipes to save some, or generate new ones!
                    </Text>
                  </View>
                ) : (
                  <>
                    {favoriteRecipes.length > 0 && (
                      <View style={styles.recipeSection}>
                        <Text style={styles.recipeSectionTitle}>Favorites</Text>
                        {favoriteRecipes.map((recipe) => (
                          <TouchableOpacity
                            key={recipe._id}
                            style={styles.recipeCard}
                            onPress={() => handleAddSavedRecipe(recipe)}
                          >
                            <View style={styles.recipeTitleRow}>
                              <Text style={styles.recipeCardTitle}>{recipe.title}</Text>
                              <Ionicons name="heart" size={16} color="#d32f2f" />
                            </View>
                            <Text style={styles.recipeCardMeta}>
                              {recipe.minutes} min - {recipe.kcal} kcal
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <View style={styles.recipeSection}>
                      <Text style={styles.recipeSectionTitle}>All Recipes</Text>
                      {savedRecipes.map((recipe) => (
                        <TouchableOpacity
                          key={recipe._id}
                          style={styles.recipeCard}
                          onPress={() => handleAddSavedRecipe(recipe)}
                        >
                          <View style={styles.recipeTitleRow}>
                            <Text style={styles.recipeCardTitle}>{recipe.title}</Text>
                            {recipe.isFavorite && (
                              <Ionicons name="heart" size={16} color="#d32f2f" />
                            )}
                          </View>
                          <Text style={styles.recipeCardMeta}>
                            {recipe.minutes} min - {recipe.kcal} kcal
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )
              ) : (
                <View>
                  <View style={styles.generateSection}>
                    <TextInput
                      style={styles.promptInput}
                      placeholder="Optional: dietary preferences, cuisine type..."
                      value={recipePrompt}
                      onChangeText={setRecipePrompt}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.generateButton, generatingRecipes && styles.buttonDisabled]}
                      onPress={handleGenerateRecipes}
                      disabled={generatingRecipes}
                    >
                      <Text style={styles.generateButtonText}>
                        {generatingRecipes ? "Generating..." : "Generate Recipes"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {generatingRecipes && (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator size="large" color="#2e7d32" />
                      <Text style={styles.generatingTitle}>Generating Recipes...</Text>
                      <Text style={styles.generatingSubtext}>
                        AI is analyzing your pantry and creating personalized recipes. This may take 15-30 seconds.
                      </Text>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancelGeneration}
                      >
                        <Ionicons name="close-circle-outline" size={18} color="#d32f2f" />
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {generatedRecipes.length > 0 && (
                    <View style={styles.recipeSection}>
                      <Text style={styles.recipeSectionTitle}>Select a recipe:</Text>
                      {generatedRecipes.map((recipe, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.recipeCard}
                          onPress={() => handleAddMeal(recipe)}
                        >
                          <Text style={styles.recipeCardTitle}>{recipe.title}</Text>
                          <Text style={styles.recipeCardMeta}>
                            {recipe.minutes} min - {recipe.kcal} kcal
                          </Text>
                          <View style={styles.tagRow}>
                            {recipe.tags.slice(0, 3).map((tag, i) => (
                              <View key={i} style={styles.tag}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ingredients Modal */}
      <Modal visible={showIngredientsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Week's Ingredients</Text>
              <TouchableOpacity onPress={() => setShowIngredientsModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {categorizedIngredients.available.length === 0 && categorizedIngredients.missing.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No meals planned yet</Text>
                  <Text style={styles.emptySubtext}>
                    Add meals to see ingredients
                  </Text>
                </View>
              ) : (
                <>
                  {/* Missing Ingredients */}
                  {categorizedIngredients.missing.length > 0 && (
                    <View style={styles.ingredientSection}>
                      <View style={styles.ingredientSectionHeader}>
                        <Ionicons name="alert-circle" size={18} color="#d32f2f" />
                        <Text style={styles.ingredientSectionTitle}>
                          Missing ({categorizedIngredients.missing.length})
                        </Text>
                      </View>
                      {categorizedIngredients.missing.map((ing, idx) => (
                        <View key={idx} style={[styles.ingredientItem, styles.ingredientMissing]}>
                          <Text style={styles.ingredientName}>{ing.name}</Text>
                          <Text style={styles.ingredientAmount}>{ing.amount}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Available Ingredients */}
                  {categorizedIngredients.available.length > 0 && (
                    <View style={styles.ingredientSection}>
                      <View style={styles.ingredientSectionHeader}>
                        <Ionicons name="checkmark-circle" size={18} color="#2e7d32" />
                        <Text style={[styles.ingredientSectionTitle, { color: "#2e7d32" }]}>
                          In Pantry ({categorizedIngredients.available.length})
                        </Text>
                      </View>
                      {categorizedIngredients.available.map((ing, idx) => (
                        <View key={idx} style={[styles.ingredientItem, styles.ingredientAvailable]}>
                          <Text style={styles.ingredientName}>{ing.name}</Text>
                          <Text style={styles.ingredientAmount}>{ing.amount}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {categorizedIngredients.missing.length > 0 && (
              <TouchableOpacity
                style={styles.addMissingButton}
                onPress={() => {
                  setShowIngredientsModal(false);
                  handleGenerateShoppingList();
                }}
              >
                <Ionicons name="cart-outline" size={20} color="#fff" />
                <Text style={styles.addMissingButtonText}>
                  Add {categorizedIngredients.missing.length} Missing to Shopping List
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
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
  todayButton: { fontSize: 14, fontWeight: "600", color: "#2e7d32" },

  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  navButton: { padding: 4 },
  weekTitle: { fontSize: 16, fontWeight: "600", color: "#333" },

  ingredientsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  ingredientsBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  ingredientsStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  ingredientsStatText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 6,
  },
  ingredientsStatMissing: {
    color: "#d32f2f",
    fontWeight: "600",
  },
  ingredientsDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e3ece5",
    marginHorizontal: 16,
  },

  content: {
    padding: 16,
    paddingBottom: BOTTOM_BAR_HEIGHT + 20,
  },

  centered: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  dayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e3ece5",
    overflow: "hidden",
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#f8faf8",
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  dayHeaderToday: {
    backgroundColor: "#2e7d32",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginRight: 8,
  },
  dayNameToday: {
    color: "#fff",
  },
  dayDate: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  dayDateToday: {
    color: "#fff",
  },

  mealsContainer: {
    padding: 12,
  },
  mealSection: {
    marginBottom: 8,
  },
  mealTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#888",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  mealItemCompleted: {
    opacity: 0.5,
  },
  mealContent: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  mealTitleCompleted: {
    textDecorationLine: "line-through",
  },
  mealAuthor: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  mealMeta: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  addMealButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 6,
  },
  addMealText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
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
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  bottomButton: { alignItems: "center" },
  bottomLabel: { fontSize: 12, color: "#2e7d32", marginTop: 4 },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    textTransform: "capitalize",
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },

  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#2e7d32",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
  },
  tabTextActive: {
    color: "#2e7d32",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },

  recipeSection: {
    marginBottom: 16,
  },
  recipeSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  recipeCard: {
    backgroundColor: "#f8faf8",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  recipeTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recipeCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  recipeCardMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  tagRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: "#2e7d32",
  },

  generateSection: {
    marginBottom: 16,
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
  generatingContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#f8faf8",
    borderRadius: 12,
    marginTop: 8,
  },
  generatingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e7d32",
    marginTop: 12,
    marginBottom: 6,
  },
  generatingSubtext: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d32f2f",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#d32f2f",
    marginLeft: 4,
  },

  // Ingredients modal styles
  ingredientSection: {
    marginBottom: 20,
  },
  ingredientSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ingredientSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#d32f2f",
    marginLeft: 6,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  ingredientMissing: {
    backgroundColor: "#ffebee",
  },
  ingredientAvailable: {
    backgroundColor: "#e8f5e9",
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textTransform: "capitalize",
    flex: 1,
  },
  ingredientAmount: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  addMissingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
    margin: 16,
    padding: 14,
    borderRadius: 10,
  },
  addMissingButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
