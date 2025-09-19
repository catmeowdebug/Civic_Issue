import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import DeviceInfo from "react-native-device-info";

const BACKEND_URL = "http://10.58.37.43:5000";

export default function ReportsList() {
  const [reports, setReports] = useState<any[]>([]);
  const [deviceId, setDeviceId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Fetch deviceId on mount
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

  // ✅ Fetch reports only for this device
  const fetchReports = useCallback(async () => {
    if (!deviceId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/reports`, { timeout: 5000 });
      if (Array.isArray(res.data)) {
        const userReports = res.data.filter((report: any) => report.deviceId === deviceId);
        setReports(userReports);
      } else {
        setReports([]);
      }
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching reports:", error.message || error);
      Alert.alert("Error", "Failed to fetch reports");
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const showReportStatus = (report: any) => {
    Alert.alert("Report Status", `Status: ${report.status || "unresolved"}`, [{ text: "OK" }]);
  };

  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Loading reports...</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        <ScrollView style={styles.reportList}>
          {reports.length > 0 ? (
              reports.map((r) => (
                  <TouchableOpacity key={r._id} onPress={() => showReportStatus(r)}>
                    <View style={styles.reportItem}>
                      <Image source={{ uri: r.imageUrl }} style={styles.reportImage} />
                      <Text style={styles.reportCaption}>{r.caption}</Text>
                    </View>
                  </TouchableOpacity>
              ))
          ) : (
              <Text style={{ textAlign: "center", marginTop: 10 }}>
                No reports found for this device.
              </Text>
          )}
        </ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f8f8f8" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  reportList: { marginTop: 10, width: "100%" },
  reportItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reportImage: { width: 150, height: 150, borderRadius: 8 },
  reportCaption: { marginTop: 8, fontSize: 16, fontWeight: "500" },
});
