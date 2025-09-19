import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import ReportScreen from "./ReportScreen"; // your existing file
import ReportsList from "./ReportsList";
import User from "./user.tsx";
import Community from "./Community";
function ReportsPanel() {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelText}>📜 Reports Panel</Text>
      <ReportsList/>
    </View>
  );
}

function UserPanel() {
  return (
    <View style={styles.panel}>
     <User/>
    </View>
  );
}

export default function MainScreen() {
  const [activeTab, setActiveTab] = useState<"create" | "reports"| "community" | "user" >("create");

  const renderPanel = () => {
    switch (activeTab) {
      case "reports":
        return <ReportsPanel />;
      case "user":
        return <UserPanel />;
      case "community":
        return <Community />;
      case "create":
      default:
        return <ReportScreen />;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Main content */}
      <View style={{ flex: 1 }}>{renderPanel()}</View>

      {/* Custom Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "create" && styles.activeTab]}
          onPress={() => setActiveTab("create")}
        >
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "reports" && styles.activeTab]}
          onPress={() => setActiveTab("reports")}
        >
          <Text style={styles.navText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, activeTab === "user" && styles.activeTab]}
          onPress={() => setActiveTab("user")}
        >
          <Text style={styles.navText}>User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, activeTab === "community" && styles.activeTab]}
          onPress={() => setActiveTab("community")}
        >
          <Text style={styles.navText}>Community</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navText: {
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: "#007AFF",
  },
  panel: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  panelText: {
    fontSize: 20,
    fontWeight: "bold",
  },
});
