import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import DeviceInfo from "react-native-device-info";
import axios from "axios";


const BACKEND_URL = "http://10.58.37.43:5000";

export default function UserPanel() {
  const [deviceId, setDeviceId] = useState<string>("");
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolvedCount, setResolvedCount] = useState<number>(0);
  const [unresolvedCount, setUnresolvedCount] = useState<number>(0);

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

  // Fetch user reports when deviceId is available
  useEffect(() => {
    if (!deviceId) return;

    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BACKEND_URL}/reports`, { timeout: 5000 });

        const userReports = res.data.filter((r: any) => r.deviceId === deviceId);
        setReports(userReports);

        const resolved = userReports.filter((r: any) => r.status === "resolved").length;
        const unresolved = userReports.filter((r: any) => r.status !== "resolved").length;
        setResolvedCount(resolved);
        setUnresolvedCount(unresolved);

        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching reports:", err.message || err);
        Alert.alert("Error", "Failed to fetch user reports");
        setLoading(false);
      }
    };

    fetchReports();
  }, [deviceId]);


  const fetchUserReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/reports`, { timeout: 5000 });

      // Filter reports for this device
      const userReports = res.data.filter((r: any) => r.deviceId === deviceId);
      setReports(userReports);

      // Count resolved and unresolved
      const resolved = userReports.filter((r: any) => r.status === "resolved").length;
      const unresolved = userReports.filter((r: any) => r.status !== "resolved").length;
      setResolvedCount(resolved);
      setUnresolvedCount(unresolved);

      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching reports:", err.message || err);
      Alert.alert("Error", "Failed to fetch user reports");
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.panel}>
      <Text style={styles.panelText}>👤 User Panel</Text>
      {loading ? (
        <Text>Loading statistics...</Text>
      ) : (
        <View style={{ width: "100%" }}>
          <Text style={styles.statText}>Device ID: {deviceId}</Text>
          <Text style={styles.statText}>Total Reports: {reports.length}</Text>
          <Text style={styles.statText}>Resolved Reports: {resolvedCount}</Text>
          <Text style={styles.statText}>Unresolved Reports: {unresolvedCount}</Text>

          <Text style={[styles.statText, { marginTop: 12, fontWeight: "bold" }]}>
            Reports Details:
          </Text>
          {reports.map((r) => (
            <View key={r._id} style={styles.reportItem}>
              <Text style={{ fontWeight: "600" }}>{r.caption}</Text>
              <Text>Status: {r.status}</Text>
              {r.address ? <Text>Address: {r.address}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: { flexGrow: 1, justifyContent: "flex-start", alignItems: "center", padding: 16 },
  panelText: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  statText: { fontSize: 16, marginBottom: 6 },
  reportItem: { backgroundColor: "#f0f0f0", padding: 10, borderRadius: 8, marginVertical: 6, width: "100%" },
});
