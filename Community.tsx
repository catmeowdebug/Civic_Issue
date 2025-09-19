import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, Image,
  TextInput, TouchableOpacity, Alert, ActivityIndicator
} from "react-native";
import axios from "axios";
import DeviceInfo from "react-native-device-info";


const BACKEND_URL = "http://10.58.37.43:5000";

interface CommunityPost {
  _id: string;
  caption: string;
  address: string;
  imageUrl: string;
  deviceId: string;
  upvotes: { deviceId: string }[];
  comments: { text: string; deviceId: string }[];
}

export default function CommunityPanel() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deviceId, setDeviceId] = useState<string>("");
  const [commentTextMap, setCommentTextMap] = useState<{ [key: string]: string }>({});

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

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  const fetchCommunityPosts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/community`);
      setPosts(res.data);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching community posts:", err.message || err);
      Alert.alert("Error", "Failed to fetch community posts");
      setLoading(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    try {
      await axios.post(`${BACKEND_URL}/community/${postId}/upvote`, { deviceId });
      fetchCommunityPosts(); // refresh
    } catch (err: any) {
      console.error("Error upvoting:", err.message || err);
      Alert.alert("Error", "Failed to upvote");
    }
  };

  const handleComment = async (postId: string) => {
    const text = commentTextMap[postId]?.trim();
    if (!text) return;
    try {
      await axios.post(`${BACKEND_URL}/community/${postId}/comment`, { deviceId, text });
      setCommentTextMap(prev => ({ ...prev, [postId]: "" }));
      fetchCommunityPosts();
    } catch (err: any) {
      console.error("Error commenting:", err.message || err);
      Alert.alert("Error", "Failed to add comment");
    }
  };

  const renderPost = ({ item }: { item: CommunityPost }) => {
    const upvoteCount = item.upvotes?.length || 0;
    return (
      <View style={styles.postContainer}>
        {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.postImage} /> : null}
        <Text style={styles.caption}>{item.caption}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <Text style={styles.deviceId}>Posted by: {item.deviceId}</Text>
        <Text style={styles.upvotes}>Upvotes: {upvoteCount}</Text>

        <TouchableOpacity style={styles.upvoteButton} onPress={() => handleUpvote(item._id)}>
          <Text style={styles.upvoteText}>👍 Upvote</Text>
        </TouchableOpacity>

        {/* Comment input */}
        <View style={styles.commentContainer}>
          <TextInput
            placeholder="Write a comment..."
            style={styles.commentInput}
            value={commentTextMap[item._id] || ""}
            onChangeText={text => setCommentTextMap(prev => ({ ...prev, [item._id]: text }))}
          />
          <TouchableOpacity style={styles.commentButton} onPress={() => handleComment(item._id)}>
            <Text style={styles.commentButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* Display comments */}
        {item.comments?.map((c, idx) => (
          <View key={idx} style={styles.commentItem}>
            <Text style={styles.commentDeviceId}>{c.deviceId}:</Text>
            <Text style={styles.commentText}>{c.text}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading community posts...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item._id}
      renderItem={renderPost}
      contentContainerStyle={styles.container}
      ListEmptyComponent={<Text style={styles.emptyText}>No posts yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  postContainer: { backgroundColor: "#f0f0f0", borderRadius: 8, padding: 12, marginBottom: 16 },
  postImage: { width: "100%", height: 200, borderRadius: 8, marginBottom: 8 },
  caption: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  address: { fontSize: 14, color: "#555", marginBottom: 4 },
  deviceId: { fontSize: 12, color: "#888", marginBottom: 4 },
  upvotes: { fontSize: 14, color: "#007AFF", marginBottom: 8 },
  upvoteButton: { backgroundColor: "#007AFF", padding: 8, borderRadius: 6, alignSelf: "flex-start", marginBottom: 8 },
  upvoteText: { color: "#fff", fontWeight: "600" },
  commentContainer: { flexDirection: "row", marginBottom: 8 },
  commentInput: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 6, backgroundColor: "#fff" },
  commentButton: { backgroundColor: "#FF3B30", padding: 6, borderRadius: 6, marginLeft: 6 },
  commentButtonText: { color: "#fff", fontWeight: "600" },
  commentItem: { flexDirection: "row", marginBottom: 4 },
  commentDeviceId: { fontWeight: "600", marginRight: 4 },
  commentText: {},
  emptyText: { textAlign: "center", marginTop: 50, color: "#555" },
});
