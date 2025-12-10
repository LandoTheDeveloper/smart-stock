// app/main/scan.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";

import Logo from "../../assets/SmartStockLogoTransparent.png";
import LightIcon from "../../assets/LightIcon.png";
import LightOnIcon from "../../assets/LightOnIcon.png";

const BOTTOM_BAR_HEIGHT = 95;

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

interface ProductData {
  product_name?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  serving_size?: string;
  allergens_tags?: string[];
  labels_tags?: string[];
  nutriments?: {
    energy_value?: number;
    energy_unit?: string;
    "energy-kcal_100g"?: number;
    "energy-kcal_serving"?: number;
    proteins_100g?: number;
    proteins_serving?: number;
    carbohydrates_100g?: number;
    carbohydrates_serving?: number;
    sugars_100g?: number;
    fat_100g?: number;
    fat_serving?: number;
    "saturated-fat_100g"?: number;
    fiber_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
  nutrient_levels?: {
    fat?: string;
    "saturated-fat"?: string;
    sugars?: string;
    salt?: string;
  };
}

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add to pantry modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingToPantry, setAddingToPantry] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    quantity: "1",
    unit: "",
    expirationDate: "",
    category: "" as Category | "",
    storageLocation: "Pantry" as StorageLocation,
  });

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.infoText}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>
          We need your permission to use the camera.
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={requestPermission}>
          <Text style={styles.backText}>Grant permission</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backButton, { marginTop: 12, backgroundColor: "#555" }]}
          onPress={() => router.replace("/main/dashboard")}
        >
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const guessCategory = (product: ProductData): Category => {
    const categories = product.categories_tags || [];
    const categoriesStr = (product.categories || "").toLowerCase();

    if (categories.some(c => c.includes("dairy") || c.includes("milk") || c.includes("cheese") || c.includes("yogurt")) ||
        categoriesStr.includes("dairy") || categoriesStr.includes("milk")) {
      return "Dairy";
    }
    if (categories.some(c => c.includes("meat") || c.includes("beef") || c.includes("pork") || c.includes("chicken")) ||
        categoriesStr.includes("meat")) {
      return "Meat";
    }
    if (categories.some(c => c.includes("seafood") || c.includes("fish")) ||
        categoriesStr.includes("seafood") || categoriesStr.includes("fish")) {
      return "Seafood";
    }
    if (categories.some(c => c.includes("frozen")) || categoriesStr.includes("frozen")) {
      return "Frozen";
    }
    if (categories.some(c => c.includes("bread") || c.includes("bakery")) ||
        categoriesStr.includes("bread") || categoriesStr.includes("bakery")) {
      return "Bakery";
    }
    if (categories.some(c => c.includes("canned")) || categoriesStr.includes("canned")) {
      return "Canned Goods";
    }
    if (categories.some(c => c.includes("pasta") || c.includes("rice") || c.includes("grain")) ||
        categoriesStr.includes("pasta") || categoriesStr.includes("rice")) {
      return "Grains & Pasta";
    }
    if (categories.some(c => c.includes("snack") || c.includes("chip") || c.includes("cookie")) ||
        categoriesStr.includes("snack")) {
      return "Snacks";
    }
    if (categories.some(c => c.includes("beverage") || c.includes("drink") || c.includes("juice") || c.includes("soda")) ||
        categoriesStr.includes("beverage") || categoriesStr.includes("drink")) {
      return "Beverages";
    }
    if (categories.some(c => c.includes("sauce") || c.includes("condiment") || c.includes("ketchup") || c.includes("mustard")) ||
        categoriesStr.includes("sauce") || categoriesStr.includes("condiment")) {
      return "Condiments";
    }
    if (categories.some(c => c.includes("spice") || c.includes("herb") || c.includes("seasoning")) ||
        categoriesStr.includes("spice")) {
      return "Spices";
    }
    if (categories.some(c => c.includes("fruit") || c.includes("vegetable") || c.includes("produce")) ||
        categoriesStr.includes("fruit") || categoriesStr.includes("vegetable")) {
      return "Produce";
    }
    return "Other";
  };

  const fetchProductData = async (barcode: string) => {
    setLoading(true);
    setError(null);
    setProductData(null);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        setProductData(data.product);
        // Pre-fill form data
        const product = data.product as ProductData;
        setFormData({
          name: product.product_name || "",
          quantity: "1",
          unit: product.quantity || "",
          expirationDate: "",
          category: guessCategory(product),
          storageLocation: "Pantry",
        });
      } else {
        setError("Product not found in OpenFoodFacts database");
        setFormData({
          name: "",
          quantity: "1",
          unit: "",
          expirationDate: "",
          category: "",
          storageLocation: "Pantry",
        });
      }
    } catch (err) {
      setError("Failed to fetch product data. Please try again.");
      console.error("OpenFoodFacts API error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ data }: any) => {
    setScanned(true);
    setScannedBarcode(data);
    fetchProductData(data);
  };

  const handleBackToDashboard = () => {
    router.replace("/main/dashboard");
  };

  const toggleTorch = () => {
    setTorchOn((prev) => !prev);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedBarcode(null);
    setProductData(null);
    setError(null);
  };

  const handleAddToPantry = () => {
    setShowAddModal(true);
  };

  const handleSaveToPantry = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Item name is required");
      return;
    }

    setAddingToPantry(true);
    try {
      const macros = productData?.nutriments ? {
        kcal: productData.nutriments["energy-kcal_100g"] || 0,
        protein: productData.nutriments.proteins_100g || 0,
        carbs: productData.nutriments.carbohydrates_100g || 0,
        fat: productData.nutriments.fat_100g || 0,
        serving: "100g",
      } : undefined;

      const payload = {
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity) || 1,
        unit: formData.unit.trim() || undefined,
        expirationDate: formData.expirationDate || undefined,
        category: formData.category || undefined,
        storageLocation: formData.storageLocation,
        barcode: scannedBarcode,
        macros,
      };

      await api.post("/api/pantry", payload);
      setShowAddModal(false);
      Alert.alert("Success", `${formData.name} added to pantry!`, [
        { text: "Scan More", onPress: handleScanAgain },
        { text: "Go to Pantry", onPress: () => router.replace("/main/pantry") },
      ]);
    } catch (error: any) {
      console.error("Error adding to pantry:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to add item to pantry");
    } finally {
      setAddingToPantry(false);
    }
  };

  const handleManualAddToPantry = () => {
    // For when product is not found, allow manual entry with barcode
    setFormData({
      name: "",
      quantity: "1",
      unit: "",
      expirationDate: "",
      category: "",
      storageLocation: "Pantry",
    });
    setShowAddModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullScreen}>
        {/* Camera fills the background */}
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          enableTorch={torchOn}
          barcodeScannerSettings={{
            barcodeTypes: [
              "qr",
              "ean13",
              "ean8",
              "upc_a",
              "upc_e",
              "code39",
              "code128",
            ],
          }}
          onBarcodeScanned={scanned ? undefined : (e) => handleBarCodeScanned(e)}
        />

        {/* Transparent Header Overlay */}
        <View style={styles.headerBar}>
          {/* Arrow back to dashboard */}
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={handleBackToDashboard}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={32} color="#2e7d32" />
          </TouchableOpacity>

          {/* Center logo */}
          <Image source={Logo} style={styles.headerLogo} resizeMode="contain" />

          {/* Torch toggle on the right */}
          <TouchableOpacity
            style={styles.headerRight}
            onPress={toggleTorch}
            activeOpacity={0.7}
          >
            <Image
              source={torchOn ? LightOnIcon : LightIcon}
              style={styles.lightIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Scan box overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanBox}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          {!scanned && (
            <Text style={styles.scanHint}>Position barcode within the frame</Text>
          )}
        </View>

        {/* Result box */}
        {(loading || productData || error) && (
          <View style={styles.resultBox}>
            <ScrollView style={styles.resultScroll}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#2e7d32" size="large" />
                  <Text style={styles.loadingText}>
                    Fetching product information...
                  </Text>
                </View>
              )}

              {error && (
                <View>
                  <Text style={styles.errorText}>{error}</Text>
                  <Text style={styles.barcodeText}>Barcode: {scannedBarcode}</Text>
                  <Text style={styles.helperText}>
                    You can still add this item manually
                  </Text>
                </View>
              )}

              {productData && (
                <View>
                  {productData.image_url && (
                    <Image
                      source={{ uri: productData.image_url }}
                      style={styles.productImage}
                      resizeMode="contain"
                    />
                  )}

                  <Text style={styles.productTitle}>
                    {productData.product_name || "Unknown Product"}
                  </Text>

                  {productData.brands && (
                    <Text style={styles.productBrand}>{productData.brands}</Text>
                  )}

                  {/* Quick Info Row */}
                  <View style={styles.quickInfoRow}>
                    {productData.quantity && (
                      <View style={styles.quickInfoItem}>
                        <Ionicons name="cube-outline" size={14} color="#aaa" />
                        <Text style={styles.quickInfoText}>{productData.quantity}</Text>
                      </View>
                    )}
                    {productData.serving_size && (
                      <View style={styles.quickInfoItem}>
                        <Ionicons name="restaurant-outline" size={14} color="#aaa" />
                        <Text style={styles.quickInfoText}>Serving: {productData.serving_size}</Text>
                      </View>
                    )}
                  </View>

                  {/* Health Scores Row */}
                  <View style={styles.scoresRow}>
                    {productData.nutriscore_grade && (
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Nutri-Score</Text>
                        <View style={[styles.scoreBadge, { backgroundColor: getNutriScoreColor(productData.nutriscore_grade) }]}>
                          <Text style={styles.scoreBadgeText}>{productData.nutriscore_grade.toUpperCase()}</Text>
                        </View>
                      </View>
                    )}
                    {productData.nova_group && (
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>NOVA</Text>
                        <View style={[styles.scoreBadge, { backgroundColor: getNovaColor(productData.nova_group) }]}>
                          <Text style={styles.scoreBadgeText}>{productData.nova_group}</Text>
                        </View>
                      </View>
                    )}
                    {productData.ecoscore_grade && productData.ecoscore_grade !== 'unknown' && (
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreLabel}>Eco-Score</Text>
                        <View style={[styles.scoreBadge, { backgroundColor: getNutriScoreColor(productData.ecoscore_grade) }]}>
                          <Text style={styles.scoreBadgeText}>{productData.ecoscore_grade.toUpperCase()}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Nutrition Facts */}
                  {productData.nutriments && (
                    <View style={styles.nutritionSection}>
                      <Text style={styles.sectionLabel}>Nutrition per 100g</Text>
                      <View style={styles.nutritionGrid}>
                        {productData.nutriments["energy-kcal_100g"] != null && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{Math.round(productData.nutriments["energy-kcal_100g"])}</Text>
                            <Text style={styles.nutritionLabel}>kcal</Text>
                          </View>
                        )}
                        {productData.nutriments.proteins_100g != null && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{productData.nutriments.proteins_100g.toFixed(1)}g</Text>
                            <Text style={styles.nutritionLabel}>protein</Text>
                          </View>
                        )}
                        {productData.nutriments.carbohydrates_100g != null && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{productData.nutriments.carbohydrates_100g.toFixed(1)}g</Text>
                            <Text style={styles.nutritionLabel}>carbs</Text>
                          </View>
                        )}
                        {productData.nutriments.fat_100g != null && (
                          <View style={styles.nutritionItem}>
                            <Text style={styles.nutritionValue}>{productData.nutriments.fat_100g.toFixed(1)}g</Text>
                            <Text style={styles.nutritionLabel}>fat</Text>
                          </View>
                        )}
                      </View>
                      {/* Additional nutrition info */}
                      <View style={styles.nutritionExtra}>
                        {productData.nutriments.sugars_100g != null && (
                          <Text style={styles.nutritionExtraText}>Sugar: {productData.nutriments.sugars_100g.toFixed(1)}g</Text>
                        )}
                        {productData.nutriments.fiber_100g != null && (
                          <Text style={styles.nutritionExtraText}>Fiber: {productData.nutriments.fiber_100g.toFixed(1)}g</Text>
                        )}
                        {productData.nutriments.salt_100g != null && (
                          <Text style={styles.nutritionExtraText}>Salt: {productData.nutriments.salt_100g.toFixed(2)}g</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Nutrient Levels (warnings) */}
                  {productData.nutrient_levels && Object.keys(productData.nutrient_levels).length > 0 && (
                    <View style={styles.warningsSection}>
                      {productData.nutrient_levels.fat === 'high' && (
                        <View style={[styles.warningBadge, styles.warningHigh]}>
                          <Text style={styles.warningText}>High Fat</Text>
                        </View>
                      )}
                      {productData.nutrient_levels["saturated-fat"] === 'high' && (
                        <View style={[styles.warningBadge, styles.warningHigh]}>
                          <Text style={styles.warningText}>High Sat. Fat</Text>
                        </View>
                      )}
                      {productData.nutrient_levels.sugars === 'high' && (
                        <View style={[styles.warningBadge, styles.warningHigh]}>
                          <Text style={styles.warningText}>High Sugar</Text>
                        </View>
                      )}
                      {productData.nutrient_levels.salt === 'high' && (
                        <View style={[styles.warningBadge, styles.warningHigh]}>
                          <Text style={styles.warningText}>High Salt</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Allergens */}
                  {productData.allergens_tags && productData.allergens_tags.length > 0 && (
                    <View style={styles.allergensSection}>
                      <Text style={styles.sectionLabel}>⚠️ Allergens</Text>
                      <View style={styles.allergensRow}>
                        {productData.allergens_tags.map((allergen, idx) => (
                          <View key={idx} style={styles.allergenBadge}>
                            <Text style={styles.allergenText}>
                              {allergen.replace('en:', '').replace(/-/g, ' ')}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Labels (Vegan, Organic, etc.) */}
                  {productData.labels_tags && productData.labels_tags.length > 0 && (
                    <View style={styles.labelsSection}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {productData.labels_tags.slice(0, 6).map((label, idx) => (
                          <View key={idx} style={styles.labelBadge}>
                            <Text style={styles.labelText}>
                              {label.replace('en:', '').replace(/-/g, ' ')}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <Text style={styles.barcodeText}>Barcode: {scannedBarcode}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={handleScanAgain}
              >
                <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.scanAgainText}>Scan Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addToPantryButton}
                onPress={error ? handleManualAddToPantry : handleAddToPantry}
              >
                <Ionicons name="add-circle" size={18} color="#fff" style={{ marginRight: 6 }} /><Text style={styles.addToPantryText}>Add to Pantry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Full-width bottom Back bar */}
        <TouchableOpacity
          style={styles.bottomBar}
          onPress={handleBackToDashboard}
          activeOpacity={0.8}
        >
          <Text style={styles.bottomLabel}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Pantry Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Pantry</Text>
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
                    onPress={() => setFormData({ ...formData, category: cat })}
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
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveToPantry} disabled={addingToPantry}>
              <Text style={styles.saveButtonText}>{addingToPantry ? "Adding..." : "Add to Pantry"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getNutriScoreColor = (grade: string) => {
  switch (grade.toLowerCase()) {
    case "a": return "#038141";
    case "b": return "#85bb2f";
    case "c": return "#fecb02";
    case "d": return "#ee8100";
    case "e": return "#e63e11";
    default: return "#888";
  }
};

const getNovaColor = (group: number) => {
  switch (group) {
    case 1: return "#038141"; // Unprocessed
    case 2: return "#85bb2f"; // Processed culinary ingredients
    case 3: return "#fecb02"; // Processed foods
    case 4: return "#e63e11"; // Ultra-processed
    default: return "#888";
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  fullScreen: {
    flex: 1,
    position: "relative",
  },

  /*Transparent Header Overlay*/
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  headerLeft: {
    position: "absolute",
    left: 16,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
  },
  headerRight: {
    position: "absolute",
    right: 16,
    padding: 4,
  },
  headerLogo: {
    width: 140,
    height: 140,
  },
  lightIcon: {
    width: 40,
    height: 40,
  },

  /*Overlay & scan box*/
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanBox: {
    width: 260,
    height: 260,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#2e7d32",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanHint: {
    marginTop: 20,
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  /*Result box */
  resultBox: {
    position: "absolute",
    bottom: BOTTOM_BAR_HEIGHT + 20,
    left: 16,
    right: 16,
    maxHeight: 420,
    backgroundColor: "rgba(0,0,0,0.95)",
    borderRadius: 16,
    padding: 16,
  },
  resultScroll: {
    maxHeight: 300,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 14,
  },
  productImage: {
    width: "100%",
    height: 120,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  productTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  productBrand: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  quickInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  quickInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  quickInfoText: {
    color: "#ccc",
    fontSize: 13,
    marginLeft: 4,
  },
  scoresRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  scoreItem: {
    alignItems: "center",
    marginRight: 16,
  },
  scoreLabel: {
    color: "#888",
    fontSize: 10,
    marginBottom: 4,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: "center",
  },
  scoreBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionLabel: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  nutritionSection: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  nutritionGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  nutritionItem: {
    alignItems: "center",
  },
  nutritionValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  nutritionLabel: {
    color: "#888",
    fontSize: 10,
  },
  nutritionExtra: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  nutritionExtraText: {
    color: "#aaa",
    fontSize: 12,
    marginRight: 12,
    marginBottom: 4,
  },
  warningsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  warningBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  warningHigh: {
    backgroundColor: "#e63e11",
  },
  warningText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  allergensSection: {
    marginBottom: 10,
  },
  allergensRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  allergenBadge: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  allergenText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  labelsSection: {
    marginBottom: 8,
  },
  labelBadge: {
    backgroundColor: "rgba(46, 125, 50, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  labelText: {
    color: "#81c784",
    fontSize: 11,
    textTransform: "capitalize",
  },
  barcodeText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  helperText: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  scanAgainButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#555",
    marginRight: 5,
  },
  scanAgainText: { color: "#fff", fontWeight: "600" },
  addToPantryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#2e7d32",
    marginLeft: 5,
  },
  addToPantryText: { color: "#fff", fontWeight: "600" },

  /*Full-width bottom Back bar*/
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_BAR_HEIGHT,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e3ece5",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2e7d32",
  },

  /* Permission screens*/
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#000",
  },
  infoText: { color: "#fff", textAlign: "center", marginTop: 12 },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2e7d32",
  },
  backText: { color: "#fff", fontWeight: "600" },

  /* Modal styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
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
