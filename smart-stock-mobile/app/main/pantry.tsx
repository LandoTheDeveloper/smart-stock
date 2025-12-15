import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";

const CATEGORIES = [
  "Dairy",
  "Produce",
  "Meat",
  "Seafood",
  "Bakery",
  "Frozen",
  "Canned Goods",
  "Grains & Pasta",
  "Snacks",
  "Beverages",
  "Condiments",
  "Spices",
  "Other",
] as const;

const STORAGE_LOCATIONS = ["Fridge", "Freezer", "Pantry", "Counter"] as const;

const UNITS = [
  "",
  "pcs",
  "kg",
  "g",
  "lb",
  "oz",
  "L",
  "ml",
  "gal",
  "cup",
  "dozen",
  "pack",
  "box",
  "can",
  "bottle",
  "bag",
] as const;

type Category = (typeof CATEGORIES)[number];
type StorageLocation = (typeof STORAGE_LOCATIONS)[number];
type Unit = (typeof UNITS)[number];

// Shelf life utilities for auto-suggesting expiration dates
const PRODUCT_SHELF_LIVES: Record<string, number> = {
  'milk': 7, 'whole milk': 7, 'skim milk': 7, '2% milk': 7, 'almond milk': 10, 'oat milk': 10,
  'yogurt': 14, 'greek yogurt': 14, 'butter': 90, 'cream cheese': 21, 'cheese': 30,
  'eggs': 28, 'bread': 7, 'bagels': 5, 'tortillas': 14,
  'apples': 28, 'oranges': 21, 'bananas': 5, 'grapes': 7, 'strawberries': 5, 'blueberries': 10,
  'lettuce': 7, 'spinach': 5, 'carrots': 21, 'broccoli': 7, 'tomatoes': 7, 'onions': 30,
  'chicken': 2, 'beef': 3, 'pork': 3, 'bacon': 7, 'fish': 2, 'salmon': 2, 'shrimp': 2,
  'ketchup': 180, 'mustard': 365, 'mayonnaise': 60, 'salsa': 14,
  'peanut butter': 90, 'jelly': 30, 'cereal': 180, 'rice': 365, 'pasta': 365,
};

const CATEGORY_TO_SHELF_LIFE: Record<string, number> = {
  'Dairy': 14, 'Produce': 7, 'Meat': 3, 'Seafood': 2, 'Bakery': 5,
  'Frozen': 180, 'Canned Goods': 730, 'Grains & Pasta': 365,
  'Snacks': 60, 'Beverages': 30, 'Condiments': 90, 'Spices': 365, 'Other': 30
};

function getSuggestedExpirationDate(productName?: string, category?: string): string {
  let shelfLifeDays: number | null = null;

  if (productName) {
    const normalized = productName.toLowerCase().trim();
    if (PRODUCT_SHELF_LIVES[normalized]) {
      shelfLifeDays = PRODUCT_SHELF_LIVES[normalized];
    } else {
      for (const [product, days] of Object.entries(PRODUCT_SHELF_LIVES)) {
        if (normalized.includes(product) || product.includes(normalized)) {
          shelfLifeDays = days;
          break;
        }
      }
    }
  }

  if (shelfLifeDays === null && category && CATEGORY_TO_SHELF_LIFE[category]) {
    shelfLifeDays = CATEGORY_TO_SHELF_LIFE[category];
  }

  if (shelfLifeDays === null) {
    shelfLifeDays = 14; // Default
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + shelfLifeDays);
  return expirationDate.toISOString().split('T')[0];
}

interface Nutrition {
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  serving?: string;
  nutriScore?: string;
  novaGroup?: number;
}

interface PantryItem {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  expirationDate?: string;
  category?: Category;
  storageLocation?: StorageLocation;
  barcode?: string;
  notes?: string;
  nutrition?: Nutrition;
}

const BOTTOM_BAR_HEIGHT = 95;

// Helper functions for nutrition score colors
function getNutriScoreColor(grade: string): string {
  switch (grade.toLowerCase()) {
    case 'a': return '#038141';
    case 'b': return '#85bb2f';
    case 'c': return '#fecb02';
    case 'd': return '#ee8100';
    case 'e': return '#e63e11';
    default: return '#888';
  }
}

export default function PantryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "">("");
  const [filterLocation, setFilterLocation] = useState<StorageLocation | "">("");
  const [showFilters, setShowFilters] = useState(false);

  // Add/Edit modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "1",
    unit: "",
    expirationDate: "",
    category: "" as Category | "",
    storageLocation: "Pantry" as StorageLocation,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const params: any = {};
      if (filterCategory) params.category = filterCategory;
      if (filterLocation) params.storageLocation = filterLocation;

      const response = await api.get("/api/pantry", { params });
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error: any) {
      console.error("Error fetching pantry items:", error);
      Alert.alert("Error", "Failed to load pantry items");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory, filterLocation]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getExpirationStatus = (expDate?: string) => {
    if (!expDate) return "ok";
    const now = new Date();
    const exp = new Date(expDate);
    const daysUntil = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return "expired";
    if (daysUntil <= 3) return "danger";
    if (daysUntil <= 7) return "warn";
    return "ok";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "expired":
        return "#9e9e9e";
      case "danger":
        return "#d32f2f";
      case "warn":
        return "#ffb300";
      default:
        return "#2e7d32";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "No expiry";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      quantity: "1",
      unit: "",
      expirationDate: "",
      category: "",
      storageLocation: "Pantry",
      notes: "",
    });
    setModalVisible(true);
  };

  const openEditModal = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit || "",
      expirationDate: item.expirationDate ? item.expirationDate.split("T")[0] : "",
      category: item.category || "",
      storageLocation: item.storageLocation || "Pantry",
      notes: item.notes || "",
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity) || 1,
        unit: formData.unit.trim() || undefined,
        expirationDate: formData.expirationDate || undefined,
        category: formData.category || undefined,
        storageLocation: formData.storageLocation,
        notes: formData.notes.trim() || undefined,
      };

      if (editingItem) {
        await api.put(`/api/pantry/${editingItem._id}`, payload);
      } else {
        await api.post("/api/pantry", payload);
      }

      setModalVisible(false);
      fetchItems();
    } catch (error: any) {
      console.error("Error saving item:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (item: PantryItem) => {
    Alert.alert("Delete Item", `Are you sure you want to delete "${item.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/pantry/${item._id}`);
            fetchItems();
          } catch (error: any) {
            Alert.alert("Error", "Failed to delete item");
          }
        },
      },
    ]);
  };

  const handleQuickQuantityChange = async (item: PantryItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity < 0) return;

    if (newQuantity === 0) {
      handleDelete(item);
      return;
    }

    try {
      await api.put(`/api/pantry/${item._id}`, { quantity: newQuantity });
      fetchItems();
    } catch (error) {
      Alert.alert("Error", "Failed to update quantity");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading pantry...</Text>
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
        <Text style={styles.headerTitle}>My Pantry</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterButton}>
          <Ionicons name="filter" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, !filterCategory && styles.filterChipActive]}
              onPress={() => setFilterCategory("")}
            >
              <Text style={[styles.filterChipText, !filterCategory && styles.filterChipTextActive]}>
                All Categories
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                onPress={() => setFilterCategory(cat)}
              >
                <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={[styles.filterChip, !filterLocation && styles.filterChipActive]}
              onPress={() => setFilterLocation("")}
            >
              <Text style={[styles.filterChipText, !filterLocation && styles.filterChipTextActive]}>
                All Locations
              </Text>
            </TouchableOpacity>
            {STORAGE_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.filterChip, filterLocation === loc && styles.filterChipActive]}
                onPress={() => setFilterLocation(loc)}
              >
                <Text style={[styles.filterChipText, filterLocation === loc && styles.filterChipTextActive]}>
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Items List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No items match your search" : "Your pantry is empty"}
            </Text>
            <Text style={styles.emptySubtext}>Tap + to add items or scan a barcode</Text>
          </View>
        ) : (
          filteredItems.map((item) => {
            const status = getExpirationStatus(item.expirationDate);
            return (
              <TouchableOpacity key={item._id} style={styles.itemCard} onPress={() => openEditModal(item)}>
                <View style={styles.itemMain}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMeta}>
                      {item.category && <Text style={styles.metaText}>{item.category}</Text>}
                      {item.storageLocation && (
                        <Text style={styles.metaText}> • {item.storageLocation}</Text>
                      )}
                    </View>
                    {/* Nutrition display */}
                    {item.nutrition && (item.nutrition.kcal != null || item.nutrition.nutriScore) && (
                      <View style={styles.nutritionRow}>
                        {item.nutrition.nutriScore && (
                          <View style={[styles.nutriScoreBadge, { backgroundColor: getNutriScoreColor(item.nutrition.nutriScore) }]}>
                            <Text style={styles.nutriScoreText}>{item.nutrition.nutriScore.toUpperCase()}</Text>
                          </View>
                        )}
                        {item.nutrition.kcal != null && (
                          <Text style={styles.macroText}>{Math.round(item.nutrition.kcal)} kcal</Text>
                        )}
                        {item.nutrition.protein != null && (
                          <Text style={styles.macroText}>
                            <Text style={{ color: '#e74c3c', fontWeight: '600' }}>{item.nutrition.protein.toFixed(0)}g</Text> P
                          </Text>
                        )}
                        {item.nutrition.carbs != null && (
                          <Text style={styles.macroText}>
                            <Text style={{ color: '#3498db', fontWeight: '600' }}>{item.nutrition.carbs.toFixed(0)}g</Text> C
                          </Text>
                        )}
                        {item.nutrition.fat != null && (
                          <Text style={styles.macroText}>
                            <Text style={{ color: '#f39c12', fontWeight: '600' }}>{item.nutrition.fat.toFixed(0)}g</Text> F
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.itemRight}>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleQuickQuantityChange(item, -1)}
                      >
                        <Ionicons name="remove" size={18} color="#2e7d32" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>
                        {item.quantity}
                        {item.unit ? ` ${item.unit}` : ""}
                      </Text>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => handleQuickQuantityChange(item, 1)}
                      >
                        <Ionicons name="add" size={18} color="#2e7d32" />
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.expiryBadge, { backgroundColor: getStatusColor(status) }]}>
                      <Text style={styles.expiryText}>
                        {status === "expired" ? "Expired" : formatDate(item.expirationDate)}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                  <Ionicons name="trash-outline" size={20} color="#d32f2f" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Scan Button */}
      <TouchableOpacity style={styles.scanFab} onPress={() => router.push("/main/scan")}>
        <Ionicons name="barcode-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButton} onPress={() => router.push("/main/dashboard")}><Ionicons name="home-outline" size={28} color="#2e7d32" /><Text style={styles.bottomLabel}>Home</Text></TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? "Edit Item" : "Add Item"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => {
                  // Auto-suggest expiration date based on name
                  const suggestedDate = getSuggestedExpirationDate(text, formData.category);
                  setFormData({
                    ...formData,
                    name: text,
                    expirationDate: formData.expirationDate || suggestedDate
                  });
                }}
                onBlur={() => {
                  // Update expiration date on blur if not set
                  if (!formData.expirationDate && formData.name) {
                    setFormData({
                      ...formData,
                      expirationDate: getSuggestedExpirationDate(formData.name, formData.category)
                    });
                  }
                }}
                placeholder="Item name"
              />

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                keyboardType="numeric"
                placeholder="1"
              />

              <Text style={styles.label}>Unit</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u || "none"}
                    style={[styles.chip, formData.unit === u && styles.chipActive]}
                    onPress={() => setFormData({ ...formData, unit: u })}
                  >
                    <Text style={[styles.chipText, formData.unit === u && styles.chipTextActive]}>
                      {u || "None"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Expiration Date</Text>
              <TextInput
                style={styles.input}
                value={formData.expirationDate}
                onChangeText={(text) => setFormData({ ...formData, expirationDate: text })}
                placeholder="YYYY-MM-DD"
              />

              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, formData.category === cat && styles.chipActive]}
                    onPress={() => {
                      // Recalculate expiration date when category changes
                      const suggestedDate = getSuggestedExpirationDate(formData.name, cat);
                      setFormData({ ...formData, category: cat, expirationDate: suggestedDate });
                    }}
                  >
                    <Text style={[styles.chipText, formData.category === cat && styles.chipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Storage Location</Text>
              <View style={styles.locationRow}>
                {STORAGE_LOCATIONS.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.locationChip, formData.storageLocation === loc && styles.locationChipActive]}
                    onPress={() => setFormData({ ...formData, storageLocation: loc })}
                  >
                    <Text
                      style={[
                        styles.locationChipText,
                        formData.storageLocation === loc && styles.locationChipTextActive,
                      ]}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Optional notes"
                multiline
                numberOfLines={3}
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbf7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },

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
  filterButton: { padding: 4 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e3ece5",
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },

  filterContainer: { paddingHorizontal: 16, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e3ece5",
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  filterChipText: { fontSize: 13, color: "#666" },
  filterChipTextActive: { color: "#fff" },

  listContainer: { padding: 16, paddingBottom: BOTTOM_BAR_HEIGHT + 80 },

  emptyState: { alignItems: "center", marginTop: 60 },
  emptyText: { fontSize: 18, color: "#666", marginTop: 16 },
  emptySubtext: { fontSize: 14, color: "#999", marginTop: 8 },

  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e3ece5",
    flexDirection: "row",
    alignItems: "center",
  },
  itemMain: { flex: 1, flexDirection: "row", alignItems: "center" },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "600", color: "#333" },
  itemMeta: { flexDirection: "row", marginTop: 2, flexWrap: "wrap" },
  metaText: { fontSize: 11, color: "#888" },
  nutritionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
    gap: 6,
  },
  nutriScoreBadge: {
    width: 18,
    height: 18,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  nutriScoreText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  macroText: { fontSize: 11, color: "#888" },
  macroValue: { fontSize: 12, fontWeight: "700", color: "#333" },
  macroLabel: { fontSize: 9, color: "#888", marginTop: -1 },
  itemRight: { alignItems: "flex-end" },
  quantityControls: { flexDirection: "row", alignItems: "center" },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: { marginHorizontal: 8, fontSize: 14, fontWeight: "600" },
  expiryBadge: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  expiryText: { fontSize: 11, color: "#fff", fontWeight: "500" },
  deleteButton: { marginLeft: 12, padding: 4 },

  fab: {
    position: "absolute",
    right: 20,
    bottom: BOTTOM_BAR_HEIGHT + 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  scanFab: {
    position: "absolute",
    right: 20,
    bottom: BOTTOM_BAR_HEIGHT + 90,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1565c0",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#333" },
  modalForm: { padding: 16 },

  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row" },
  halfInput: { flex: 1, marginRight: 6 },

  chipScroll: { marginVertical: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#2e7d32" },
  chipText: { fontSize: 13, color: "#666" },
  chipTextActive: { color: "#fff" },

  locationRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 8 },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
    marginBottom: 8,
  },
  locationChipActive: { backgroundColor: "#2e7d32" },
  locationChipText: { fontSize: 14, color: "#666" },
  locationChipTextActive: { color: "#fff" },

  saveButton: {
    backgroundColor: "#2e7d32",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
