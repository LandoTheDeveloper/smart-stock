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
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

import Logo from "../../assets/SmartStockLogoTransparent.png";
import LightIcon from "../../assets/LightIcon.png";
import LightOnIcon from "../../assets/LightOnIcon.png";

const BOTTOM_BAR_HEIGHT = 95;

interface ProductData {
  product_name?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  ingredients_text?: string;
  image_url?: string;
  nutriscore_grade?: string;
  nutriments?: {
    energy_value?: number;
    energy_unit?: string;
  }
  allergens?: string;
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
        console.log(data.product)
        setProductData(data.product);
      } else {
        setError("Product not found in OpenFoodFacts database");
      }
    } catch (err) {
      setError("Failed to fetch product data. Please try again.");
      console.error("OpenFoodFacts API error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
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
            <Text style={styles.arrowText}>←</Text>
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
          <View style={styles.scanBox} />
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
                    <Text style={styles.productDetail}>
                      Brand: {productData.brands}
                    </Text>
                  )}
                  
                  {productData.quantity && (
                    <Text style={styles.productDetail}>
                      Quantity: {productData.quantity}
                    </Text>
                  )}
                  
                  {productData.nutriments?.energy_value && (
                    <Text style={styles.productDetail}>
                      Calories: {productData.nutriments?.energy_value} {productData.nutriments?.energy_unit}
                    </Text>
                  )}
                  
                  {productData.nutriscore_grade && (
                    <Text style={styles.productDetail}>
                      Nutri-Score: {productData.nutriscore_grade.toUpperCase()}
                    </Text>
                  )}
                  
                  <Text style={styles.barcodeText}>Barcode: {scannedBarcode}</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={handleScanAgain}
            >
              <Text style={styles.scanAgainText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full-width bottom Back bar */}
        <TouchableOpacity
          style={styles.bottomBar}
          onPress={handleBackToDashboard}
          activeOpacity={0.8}
        >
          <Text style={styles.bottomLabel}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

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
  },
  arrowText: {
    fontSize: 40,
    fontWeight: "800",
    color: "#2e7d32",
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
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: "#2e7d32",
    borderRadius: 16,
    backgroundColor: "transparent",
  },

  /*Result box */
  resultBox: {
    position: "absolute",
    bottom: BOTTOM_BAR_HEIGHT + 20,
    left: 20,
    right: 20,
    maxHeight: 400,
    backgroundColor: "rgba(0,0,0,0.9)",
    borderRadius: 12,
    padding: 16,
  },
  resultScroll: {
    maxHeight: 320,
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
    height: 150,
    marginBottom: 12,
    borderRadius: 8,
  },
  productTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  productDetail: {
    color: "#e0e0e0",
    fontSize: 14,
    marginBottom: 6,
  },
  barcodeText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginBottom: 8,
  },
  scanAgainButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#2e7d32",
    marginTop: 12,
  },
  scanAgainText: { color: "#fff", fontWeight: "600" },

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
});