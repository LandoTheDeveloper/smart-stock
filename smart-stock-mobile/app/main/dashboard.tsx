
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authcontext";

import Logo from "../../assets/SmartStockLogoTransparent.png";
import RecipeIcon from "../../assets/RecipeButton.png";
import ScanIcon from "../../assets/ScanButton.png";
import PantryIcon from "../../assets/PantryButton.png";

import AppleAvatar from "../../assets/AppleAvatar.png";
import CornAvatar from "../../assets/CornAvatar.png";
import TurkeyAvatar from "../../assets/TurkeyAvatar.png";
import BroccoliAvatar from "../../assets/BroccoliAvatar.png";

const SAMPLE = [
  { item: "Chicken Breast", qty: 2, expires: "Nov 5", status: "warn" },
  { item: "Oats", qty: 1, expires: "Mar 2026", status: "ok" },
  { item: "Greek Yogurt", qty: 5, expires: "Nov 3", status: "danger" },
];

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
  const { avatar, displayName } = useAuth();

  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SAMPLE;
    return SAMPLE.filter((a) => a.item.toLowerCase().includes(s));
  }, [q]);

  const lowStock = SAMPLE.filter((a) => a.qty <= 2).length;
  const expiringSoon = SAMPLE.filter((a) => a.status !== "ok").length;

  const pillColor = (status: string) =>
    status === "ok"
      ? "#2e7d32"
      : status === "warn"
      ? "#ffb300"
      : "#d32f2f";

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
        >
          {/* KPI Cards: Low Stock + Expiring Soon side by side */}
          <View style={styles.grid}>
            <View style={[styles.card, styles.gridItemHalf]}>
              <Text style={styles.cardTitle}>Low Stock</Text>
              <Text style={styles.kpi}>{lowStock}</Text>
              <Text style={styles.sub}>Items to restock</Text>
            </View>

            <View style={[styles.card, styles.gridItemHalf]}>
              <Text style={styles.cardTitle}>Expiring Soon</Text>
              <Text style={styles.kpi}>{expiringSoon}</Text>
              <Text style={styles.sub}>Within 5 days</Text>
            </View>
          </View>

          {/* Overview Card (formerly "Recent Activity") */}
          <View style={styles.card}>
            <Text style={styles.tableTitle}>Overview</Text>

            <TextInput
              style={styles.search}
              placeholder="Search..."
              value={q}
              onChangeText={setQ}
            />

            <View>
              {filtered.map((row, idx) => (
                <View style={styles.row} key={idx}>
                  <Text style={[styles.cell, styles.cellItem]}>{row.item}</Text>
                  <Text style={[styles.cell, styles.cellQty]}>{row.qty}</Text>
                  <Text style={[styles.cell, styles.cellExpires]}>
                    {row.expires}
                  </Text>
                  <Text
                    style={[
                      styles.pill,
                      { backgroundColor: pillColor(row.status) },
                    ]}
                  >
                    {row.status === "ok"
                      ? "OK"
                      : row.status === "warn"
                      ? "Soon"
                      : "Urgent"}
                  </Text>
                </View>
              ))}

              {filtered.length === 0 && (
                <Text style={styles.emptyText}>No results.</Text>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Full-width bottom bar with icon buttons */}
        <View style={styles.bottomBarBase}>
          <View style={styles.bottomBarContent}>
            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/recipes")}
            >
              <Image
                source={RecipeIcon}
                style={styles.bottomIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/scan")}
            >
              <Image
                source={ScanIcon}
                style={styles.bottomIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomButton}
              onPress={() => router.push("/main/pantry")}
            >
              <Image
                source={PantryIcon}
                style={styles.bottomIcon}
                resizeMode="contain"
              />
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
  sub: { color: "#5f6b63", marginTop: 4 },

  tableTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  search: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
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
  },
  cellExpires: {
    flex: 1,
  },

  pill: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    color: "white",
    textAlign: "center",
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "600",
  },

  emptyText: {
    textAlign: "center",
    color: "#6b726d",
    marginTop: 10,
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







