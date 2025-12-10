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

const PRIORITIES = ["low", "normal", "high"] as const;

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
  "tbsp",
  "tsp",
  "dozen",
  "pack",
  "box",
  "can",
  "bottle",
  "bag",
] as const;

type Category = (typeof CATEGORIES)[number];
type Priority = (typeof PRIORITIES)[number];
type Unit = (typeof UNITS)[number];

interface ShoppingItem {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: Category;
  priority: Priority;
  checked: boolean;
  pantryItemId?: string;
}

const BOTTOM_BAR_HEIGHT = 95;

export default function ShoppingScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "1",
    unit: "",
    category: "" as Category | "",
    priority: "normal" as Priority,
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get("/api/shopping-list");
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching shopping list:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "high":
        return "#d32f2f";
      case "low":
        return "#888";
      default:
        return "#2e7d32";
    }
  };

  const handleToggleItem = async (item: ShoppingItem) => {
    try {
      await api.patch(`/api/shopping-list/${item._id}/toggle`);
      fetchItems();
    } catch (error) {
      Alert.alert("Error", "Failed to update item");
    }
  };

  const handleDeleteItem = (item: ShoppingItem) => {
    Alert.alert("Delete Item", `Remove "${item.name}" from shopping list?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/api/shopping-list/${item._id}`);
            fetchItems();
          } catch (error) {
            Alert.alert("Error", "Failed to delete item");
          }
        },
      },
    ]);
  };

  const handleAddToPantry = async (item: ShoppingItem) => {
    try {
      await api.post(`/api/shopping-list/${item._id}/add-to-pantry`);
      Alert.alert("Success", `${item.name} added to pantry!`);
      fetchItems();
    } catch (error) {
      Alert.alert("Error", "Failed to add item to pantry");
    }
  };

  const handleClearChecked = () => {
    if (checkedItems.length === 0) return;

    Alert.alert(
      "Clear Checked Items",
      `Remove ${checkedItems.length} checked item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/api/shopping-list/clear-checked");
              fetchItems();
            } catch (error) {
              Alert.alert("Error", "Failed to clear checked items");
            }
          },
        },
      ]
    );
  };

  const handleGenerateFromLowStock = async () => {
    try {
      const response = await api.post("/api/shopping-list/generate-from-low-stock");
      if (response.data.success) {
        const count = response.data.data.length;
        if (count > 0) {
          Alert.alert("Success", `Added ${count} item(s) from low stock`);
        } else {
          Alert.alert("Info", "No low stock items to add");
        }
        fetchItems();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to generate from low stock");
    }
  };

  const openAddModal = () => {
    setFormData({
      name: "",
      quantity: "1",
      unit: "",
      category: "",
      priority: "normal",
    });
    setShowAddModal(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/shopping-list", {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity) || 1,
        unit: formData.unit.trim() || undefined,
        category: formData.category || undefined,
        priority: formData.priority,
      });
      setShowAddModal(false);
      fetchItems();
    } catch (error) {
      Alert.alert("Error", "Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const renderItem = (item: ShoppingItem) => (
    <View key={item._id} style={styles.itemCard}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => handleToggleItem(item)}
      >
        <Ionicons
          name={item.checked ? "checkbox" : "square-outline"}
          size={24}
          color={item.checked ? "#2e7d32" : "#888"}
        />
      </TouchableOpacity>

      <View style={styles.itemInfo}>
        <Text
          style={[styles.itemName, item.checked && styles.itemNameChecked]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.metaText}>
            {item.quantity}
            {item.unit ? ` ${item.unit}` : ""}
          </Text>
          {item.category && (
            <Text style={styles.metaText}> • {item.category}</Text>
          )}
        </View>
      </View>

      <View
        style={[
          styles.priorityBadge,
          { backgroundColor: getPriorityColor(item.priority) },
        ]}
      >
        <Text style={styles.priorityText}>{item.priority}</Text>
      </View>

      <View style={styles.itemActions}>
        {item.checked && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddToPantry(item)}
          >
            <Ionicons name="add-circle-outline" size={22} color="#2e7d32" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteItem(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#d32f2f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading shopping list...</Text>
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
        <Text style={styles.headerTitle}>Shopping List</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={openAddModal}>
          <Ionicons name="add" size={18} color="#2e7d32" /><Text style={styles.quickButtonText}>Add Item</Text>
        </TouchableOpacity>
        {checkedItems.length > 0 && (
          <TouchableOpacity
            style={[styles.quickButton, styles.clearButton]}
            onPress={handleClearChecked}
          >
            <Ionicons name="trash-outline" size={18} color="#d32f2f" /><Text style={[styles.quickButtonText, { color: "#d32f2f" }]}>Clear Checked ({checkedItems.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Items List */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2e7d32"]}
          />
        }
      >
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Your shopping list is empty</Text>
            <Text style={styles.emptySubtext}>
              Add items or generate from low stock
            </Text>
          </View>
        ) : (
          <>
            {uncheckedItems.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  To Buy ({uncheckedItems.length})
                </Text>
                {uncheckedItems.map(renderItem)}
              </View>
            )}

            {checkedItems.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: "#888" }]}>
                  Checked ({checkedItems.length})
                </Text>
                {checkedItems.map(renderItem)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

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
          onPress={handleGenerateFromLowStock}
        >
          <Ionicons name="alert-circle-outline" size={24} color="#2e7d32" />
          <Text style={styles.bottomLabel}>Low Stock</Text>
        </TouchableOpacity>
      </View>

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Item name"
              />

              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={formData.quantity}
                onChangeText={(text) =>
                  setFormData({ ...formData, quantity: text })
                }
                keyboardType="numeric"
                placeholder="1"
              />

              <Text style={styles.label}>Unit</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u || "none"}
                    style={[
                      styles.chip,
                      formData.unit === u && styles.chipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, unit: u })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.unit === u && styles.chipTextActive,
                      ]}
                    >
                      {u || "None"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityChip,
                      formData.priority === p && {
                        backgroundColor: getPriorityColor(p),
                      },
                    ]}
                    onPress={() => setFormData({ ...formData, priority: p })}
                  >
                    <Text
                      style={[
                        styles.priorityChipText,
                        formData.priority === p && { color: "#fff" },
                      ]}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipScroll}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.chip,
                      formData.category === cat && styles.chipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category: cat })}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.category === cat && styles.chipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveItem}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Adding..." : "Add to List"}
              </Text>
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

  quickActions: {
    flexDirection: "row",
    padding: 12,
  },
  quickButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#e8f5e9",
    borderRadius: 20,
    marginRight: 10,
  },
  clearButton: {
    backgroundColor: "#ffebee",
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 6,
  },

  content: {
    padding: 16,
    paddingBottom: BOTTOM_BAR_HEIGHT + 80,
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
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },

  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e3ece5",
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  itemMeta: {
    flexDirection: "row",
    marginTop: 4,
  },
  metaText: {
    fontSize: 13,
    color: "#888",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  itemActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 4,
  },

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
    paddingHorizontal: 20,
  },
  bottomButton: { alignItems: "center", paddingVertical: 8 },
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
    maxHeight: "75%",
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

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row" },
  halfInput: { flex: 1, marginRight: 6 },

  priorityRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  priorityChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    marginRight: 10,
  },
  priorityChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },

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

  saveButton: {
    backgroundColor: "#2e7d32",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
