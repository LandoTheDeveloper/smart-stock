
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

const BOTTOM_BAR_HEIGHT = 90;

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedText, setScannedText] = useState<string | null>(null);

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
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = ({ type, data }: any) => {
    setScanned(true);
    setScannedText(`Type: ${type}\nData: ${data}`);
  };

  return (
    <View style={styles.container}>

      <View style={styles.cameraWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code39", "code128"],
          }}
          onBarcodeScanned={scanned ? undefined : (event) => handleBarCodeScanned(event)}
        />

        {/* Overlay box */}
        <View style={styles.overlay}>
          <View style={styles.scanBox} />
        </View>

        {/* Result box */}
        {scannedText && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>{scannedText}</Text>

            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => {
                setScanned(false);
                setScannedText(null);
              }}
            >
              <Text style={styles.scanAgainText}>Scan again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Full-width bottom bar as the Back button */}
      <TouchableOpacity
        style={styles.bottomBar}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.bottomLabel}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraWrapper: {
    flex: 1,
    marginBottom: BOTTOM_BAR_HEIGHT, // keep camera above back bar
    position: "relative",
  },
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
  resultBox: {
    position: "absolute",
    bottom: 110,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    padding: 12,
  },
  resultText: {
    color: "#fff",
    marginBottom: 8,
  },
  scanAgainButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#2e7d32",
  },
  scanAgainText: {
    color: "#fff",
    fontWeight: "600",
  },
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#000",
  },
  infoText: {
    color: "#ffffff",
    textAlign: "center",
    marginTop: 12,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#2e7d32",
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
  },
});


