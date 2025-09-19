import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  Switch,
} from "react-native";
import axios from "axios";
import {
  launchCamera,
  launchImageLibrary,
  Asset,
} from "react-native-image-picker";
import DeviceInfo from "react-native-device-info";

const BACKEND_URL = "http://10.58.37.43:5000";

export default function ReportScreen() {
  const [selectedImage, setSelectedImage] = useState<Asset | null>(null);
  const [caption, setCaption] = useState("");
  const [address, setAddress] = useState("");
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  const [postToCommunity, setPostToCommunity] = useState(false);

  // Check backend status
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Get device ID
  useEffect(() => {
    const fetchDeviceId = async () => {
      try {
        const id = await DeviceInfo.getUniqueId();
        setDeviceId(id);
      } catch (err) {
        console.error("Failed to get device ID:", err);
      }
    };

    fetchDeviceId();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/reports`, {
        timeout: 3000,
      });
      setBackendConnected(Array.isArray(res.data));
    } catch (error: any) {
      console.error("Backend connection failed:", error.message);
      setBackendConnected(false);
    }
  };

  const pickImage = () => {
    Alert.alert("Create Report", "Choose an option", [
      {
        text: "Camera",
        onPress: () =>
            launchCamera({ mediaType: "photo" }, handleResponse),
      },
      {
        text: "Gallery",
        onPress: () =>
            launchImageLibrary({ mediaType: "photo" }, handleResponse),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleResponse = (response: any) => {
    if (response.assets && response.assets.length > 0) {
      setSelectedImage(response.assets[0]);
    }
  };

  const submitReport = async () => {
    if (!selectedImage || !caption.trim() || !address.trim()) {
      Alert.alert(
          "Missing Fields",
          "Please select an image, enter a caption and address."
      );
      return;
    }

    try {
      // Form data for regular report
      const formData = new FormData();
      formData.append("caption", caption);
      formData.append("address", address);
      formData.append("deviceId", deviceId);
      formData.append("userId", deviceId);

      const uri = selectedImage.uri ?? "";
      const name = selectedImage.fileName ?? `photo_${Date.now()}.jpg`;
      const type = selectedImage.type ?? "image/jpeg";

      formData.append("image", {
        uri: Platform.OS === "android" ? uri : uri.replace("file://", ""),
        name,
        type,
      } as any);

      // Submit to private reports
      await axios.post(`${BACKEND_URL}/reports`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
      });

      // Optionally submit to community
      if (postToCommunity) {
        await axios.post(`${BACKEND_URL}/community`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 10000,
        });
      }

      // Reset form
      setSelectedImage(null);
      setCaption("");
      setAddress("");
      setPostToCommunity(false);
      Alert.alert("Success", "Report created ✅");
    } catch (error: any) {
      console.error(
          "Error submitting report:",
          error.response?.data || error.message
      );
      Alert.alert("Error", "Failed to create report");
    }
  };

  return (
      <View style={styles.container}>
        {/* Backend status */}
        {backendConnected === null ? (
            <Text style={styles.statusChecking}>Checking backend connection...</Text>
        ) : backendConnected ? (
            <Text style={styles.statusConnected}>✅ Backend Connected</Text>
        ) : (
            <Text style={styles.statusDisconnected}>❌ Backend Not Reachable</Text>
        )}

        {/* Post to Community Toggle */}
        <View style={styles.communityToggle}>
          <Text style={{ fontSize: 16 }}>Post to Community?</Text>
          <Switch value={postToCommunity} onValueChange={setPostToCommunity} />
        </View>

        {/* Create report button */}
        <TouchableOpacity style={styles.buttonSecondary} onPress={pickImage}>
          <Text style={styles.buttonText}>Create Report</Text>
        </TouchableOpacity>

        {/* Image + inputs */}
        {selectedImage && (
            <View style={styles.previewContainer}>
              <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.previewImage}
              />
              <TextInput
                  placeholder="Write a caption..."
                  style={styles.captionInput}
                  value={caption}
                  onChangeText={setCaption}
              />
              <TextInput
                  placeholder="Enter address..."
                  style={styles.captionInput}
                  value={address}
                  onChangeText={setAddress}
              />
              <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
                <Text style={styles.buttonText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f8f8f8",
  },
  statusChecking: {
    textAlign: "center",
    marginBottom: 8,
    color: "#555",
  },
  statusConnected: {
    textAlign: "center",
    marginBottom: 8,
    color: "green",
    fontWeight: "bold",
  },
  statusDisconnected: {
    textAlign: "center",
    marginBottom: 8,
    color: "red",
    fontWeight: "bold",
  },
  communityToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
  },
  buttonSecondary: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  previewContainer: {
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  captionInput: {
    width: "90%",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
