// app/main/dashboard.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from "react-native";

import Logo from "../../assets/SmartStockLogo.png";

const SAMPLE = [
  { item: "Chicken Breast", qty: 2, expires: "Nov 5", status: "warn" },
  { item: "Oats", qty: 1, expires: "Mar 2026", status: "ok" },
  { item: "Greek Yogurt", qty: 5, expires: "Nov 3", status: "danger" },
];

export default function Dashboard() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SAMPLE;
    return SAMPLE.filter((a) => a.item.toLowerCase().includes(s));
  }, [q]);

  const lowStock = SAMPLE.filter((a) => a.qty <= 2).length;
  const expiringSoon = SAMPLE.filter((a) => a.status !== "ok").length;
  const pantrySize = 42;

  const pillColor = (status: string) =>
    status === "ok"
      ? "#2e7d32"
      : status === "warn"
      ? "#ffb300"
      : "#d32f2f";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo */}
        <Image
          source={Logo}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* KPI Cards */}
        <View style={styles.grid}>
          <View style={[styles.card, styles.gridItem]}>
            <Text style={styles.cardTitle}>Low Stock</Text>
            <Text style={styles.kpi}>{lowStock} items</Text>
            <Text style={styles.sub}>Needs restock soon</Text>
          </View>

          <View style={[styles.card, styles.gridItem]}>
            <Text style={styles.cardTitle}>Expiring Soon</Text>
            <Text style={styles.kpi}>{expiringSoon}</Text>
            <Text style={styles.sub}>Within 5 days</Text>
          </View>

          <View style={[styles.card, styles.gridItem]}>
            <Text style={styles.cardTitle}>Pantry Size</Text>
            <Text style={styles.kpi}>{pantrySize}</Text>
            <Text style={styles.sub}>Total tracked items</Text>
          </View>
        </View>

        {/* Activity Table */}
        <View style={styles.card}>
          <Text style={styles.tableTitle}>Recent Activity</Text>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbf7" },
  scroll: {
    padding: 20,
    paddingBottom: 32,
  },

  logo: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  gridItem: {
    width: "100%",
    marginBottom: 12,
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
});

