import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/authcontext";
import { api } from "../../lib/api";

import Logo from "../../assets/SmartStockLogoTransparent.png";
import RecipeIcon from "../../assets/RecipeButton.png";
import ScanIcon from "../../assets/ScanButton.png";
import PantryIcon from "../../assets/PantryButton.png";

import AppleAvatar from "../../assets/AppleAvatar.png";
import CornAvatar from "../../assets/CornAvatar.png";
import TurkeyAvatar from "../../assets/TurkeyAvatar.png";
import BroccoliAvatar from "../../assets/BroccoliAvatar.png";

interface PantryItem {
  _id: string;
  name: string;
  quantity: number;
  unit?: string;
  expirationDate?: string;
  category?: string;
  storageLocation?: string;
}

const BOTTOM_BAR_HEIGHT = 95;

function getAvatarSource(name: string) {
  switch (name) {
    case "AppleAvatar.png":
      return AppleAvatar;
    case "CornAvatar.png":
      return CornAvatar;
    case "TurkeyAvatar.png":
      return TurkeyAvatar;
    case "BroccoliAvatar.png":
    default:
      return BroccoliAvatar;
  }
}

export default function Dashboard() {
  const router = useRouter();
  const { avatar, displayName, user } = useAuth();

  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [q, setQ] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const response = await api.get("/api/pantry");
      if (response.data.success) {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pantry items:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchItems();
    } else {
      setLoading(false);
    }
  }, [fetchItems, user]);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchItems();
      }
    }, [fetchItems, user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

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

  const formatExpiry = (expDate?: string) => {
    if (!expDate) return "-";
    const date = new Date(expDate);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Process items for display
  const processedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      status: getExpirationStatus(item.expirationDate),
      expiresFormatted: formatExpiry(item.expirationDate),
    }));
  }, [items]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return processedItems.slice(0, 10); // Show only first 10 items
    return processedItems.filter((a) => a.name.toLowerCase().includes(s)).slice(0, 10);
  }, [q, processedItems]);

  // Calculate KPIs
  const lowStock = useMemo(() => {
    return items.filter((a) => a.quantity <= 2).length;
  }, [items]);

  const expiringSoon = useMemo(() => {
    return processedItems.filter((a) => a.status === "danger" || a.status === "warn").length;
  }, [processedItems]);

  const pillColor = (status: string) => {
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

  const pillText = (status: string) => {
    switch (status) {
      case "expired":
        return "Exp";
      case "danger":
        return "Urgent";
      case "warn":
        return "Soon";
      default:
        return "OK";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with avatar and logo */}
      <View style={styles.headerBar}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => router.push("/main/profilepage")}
            activeOpacity={0.8}
          >
            <Image
              source={getAvatarSource(avatar)}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text style={styles.displayName}>{displayName}</Text>
        </View>

        <Image source={Logo} style={styles.headerLogo} resizeMode="contain" />
      </View>

      <View style={styles.contentWrapper}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2e7d32"]} />
          }
        >
          {/* KPI Cards: Low Stock + Expiring Soon side by side */}
          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.card, styles.gridItemHalf]}
              onPress={() => router.push("/main/pantry")}
            >
              <Text style={styles.cardTitle}>Low Stock</Text>
              <Text style={styles.kpi}>{loading ? "-" : lowStock}</Text>
              <Text style={styles.sub}>Items to restock</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.card, styles.gridItemHalf]}
              onPress={() => router.push("/main/pantry")}
            >
              <Text style={styles.cardTitle}>Expiring Soon</Text>
              <Text style={[styles.kpi, expiringSoon > 0 && styles.kpiWarning]}>
                {loading ? "-" : expiringSoon}
              </Text>
              <Text style={styles.sub}>Within 7 days</Text>
            </TouchableOpacity>
          </View>

          {/* Overview Card */}
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableTitle}>Pantry Overview</Text>
              <TouchableOpacity onPress={() => router.push("/main/pantry")}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.search}
              placeholder="Search items..."
              value={q}
              onChangeText={setQ}
            />

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#2e7d32" />
                <Text style={styles.loadingText}>Loading...</Text>
              </View>
            ) : (
              <View>
                {filtered.map((row) => (
                  <TouchableOpacity
                    style={styles.row}
                    key={row._id}
                    onPress={() => router.push("/main/pantry")}
                  >
                    <Text style={[styles.cell, styles.cellItem]} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={[styles.cell, styles.cellQty]}>
                      {row.quantity}
                      {row.unit ? ` ${row.unit}` : ""}
                    </Text>
                    <Text style={[styles.cell, styles.cellExpires]}>{row.expiresFormatted}</Text>
                    <View style={[styles.pillContainer, { backgroundColor: pillColor(row.status) }]}>
                      <Text style={styles.pillText}>{pillText(row.status)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {filtered.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      {q ? "No items match your search" : "Your pantry is empty"}
                    </Text>
                    {!q && (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => router.push("/main/scan")}
                      >
                        <Text style={styles.addButtonText}>Add Items</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Full-width bottom bar with icon buttons */}
        <View style={styles.bottomBarBase}>
          <View style={styles.bottomBarContent}>
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/recipes")}
            >
              <Image source={RecipeIcon} style={styles.bottomIcon} resizeMode="contain" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/scan")}
            >
              <Image source={ScanIcon} style={styles.bottomIcon} resizeMode="contain" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/pantry")}
            >
              <Image source={PantryIcon} style={styles.bottomIcon} resizeMode="contain" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/shopping")}
            >
              <Ionicons name="cart-outline" size={40} color="#2e7d32" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/mealplanner")}
            >
              <Ionicons name="calendar-outline" size={40} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbf7" },

  headerBar: {
    height: 130,
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
    backgroundColor: "#f6fbf7",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    position: "absolute",
    left: 16,
    top: 18,
    alignItems: "center",
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#2e7d32",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  displayName: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32",
  },
  headerLogo: {
    width: 150,
    height: 150,
  },

  contentWrapper: {
    flex: 1,
  },

  scroll: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: BOTTOM_BAR_HEIGHT + 20,
  },

  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  gridItemHalf: {
    width: "48%",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e3ece5",
    marginBottom: 18,
    shadowColor: "rgba(0,0,0,0.08)",
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  kpi: { fontSize: 26, fontWeight: "800", color: "#2e7d32" },
  kpiWarning: { color: "#ffb300" },
  sub: { color: "#5f6b63", marginTop: 4, fontSize: 12 },

  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    color: "#2e7d32",
    fontWeight: "600",
  },

  search: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },

  cell: {
    fontSize: 14,
  },
  cellItem: {
    flex: 2,
  },
  cellQty: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
  },
  cellExpires: {
    flex: 1,
    fontSize: 13,
  },

  pillContainer: {
    minWidth: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  pillText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b726d",
  },
  addButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#2e7d32",
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  bottomBarBase: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_BAR_HEIGHT,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e3ece5",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  bottomBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },

  bottomButton: {
    flex: 1,
    alignItems: "center",
  },

  bottomIcon: {
    width: 70,
    height: 70,
  },
});
