import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
  Clipboard,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";

type HouseholdMember = {
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  name: string;
};

type Household = {
  _id: string;
  name: string;
  inviteCode: string;
  inviteCodeExpiresAt: string;
  members: HouseholdMember[];
};

type HouseholdSummary = {
  _id: string;
  name: string;
  role: "owner" | "member";
  memberCount: number;
};

const BOTTOM_BAR_HEIGHT = 95;

export default function HouseholdScreen() {
  const router = useRouter();
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [allHouseholds, setAllHouseholds] = useState<HouseholdSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [creating, setCreating] = useState(false);

  // Join form
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  // Edit form
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    fetchHouseholdData();
  }, []);

  const fetchHouseholdData = async () => {
    setLoading(true);
    try {
      const [activeRes, allRes] = await Promise.all([
        api.get("/api/household"),
        api.get("/api/household/all"),
      ]);
      if (activeRes.data.success) {
        setActiveHousehold(activeRes.data.data);
      }
      if (allRes.data.success) {
        setAllHouseholds(allRes.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch household data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHousehold = async () => {
    if (!newHouseholdName.trim()) return;
    setCreating(true);
    try {
      const response = await api.post("/api/household", {
        name: newHouseholdName.trim(),
      });
      if (response.data.success) {
        Alert.alert("Success", "Household created!");
        setNewHouseholdName("");
        setShowCreateForm(false);
        fetchHouseholdData();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to create household");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const response = await api.post("/api/household/join", {
        inviteCode: joinCode.trim().toUpperCase(),
      });
      if (response.data.success) {
        Alert.alert("Success", "Joined household!");
        setJoinCode("");
        setShowJoinForm(false);
        fetchHouseholdData();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to join household");
    } finally {
      setJoining(false);
    }
  };

  const handleSwitchHousehold = async (householdId: string) => {
    try {
      const response = await api.put(`/api/household/${householdId}/switch`);
      if (response.data.success) {
        Alert.alert("Success", "Switched household");
        fetchHouseholdData();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to switch household");
    }
  };

  const handleGoPersonal = async () => {
    try {
      const response = await api.post("/api/household/personal");
      if (response.data.success) {
        Alert.alert("Success", "Switched to personal mode");
        fetchHouseholdData();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to switch to personal mode");
    }
  };

  const handleUpdateName = async () => {
    if (!activeHousehold || !editedName.trim()) return;
    try {
      const response = await api.put(`/api/household/${activeHousehold._id}`, {
        name: editedName.trim(),
      });
      if (response.data.success) {
        Alert.alert("Success", "Household name updated");
        setEditingName(false);
        fetchHouseholdData();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to update household name");
    }
  };

  const handleRegenerateCode = async () => {
    if (!activeHousehold) return;
    try {
      const response = await api.post(`/api/household/${activeHousehold._id}/regenerate-code`);
      if (response.data.success) {
        Alert.alert("Success", "Invite code regenerated");
        fetchHouseholdData();
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to regenerate code");
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!activeHousehold) return;
    Alert.alert(
      "Remove Member",
      `Are you sure you want to remove ${memberName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.delete(`/api/household/${activeHousehold._id}/members/${memberId}`);
              if (response.data.success) {
                Alert.alert("Success", "Member removed");
                fetchHouseholdData();
              }
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.message || "Failed to remove member");
            }
          },
        },
      ]
    );
  };

  const handleLeaveHousehold = () => {
    if (!activeHousehold) return;
    Alert.alert(
      "Leave Household",
      "Are you sure you want to leave this household?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.post(`/api/household/${activeHousehold._id}/leave`);
              if (response.data.success) {
                Alert.alert("Success", "Left household");
                fetchHouseholdData();
              }
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.message || "Failed to leave household");
            }
          },
        },
      ]
    );
  };

  const handleDeleteHousehold = () => {
    if (!activeHousehold) return;
    Alert.alert(
      "Delete Household",
      "Are you sure you want to delete this household? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.delete(`/api/household/${activeHousehold._id}`);
              if (response.data.success) {
                Alert.alert("Success", "Household deleted");
                fetchHouseholdData();
              }
            } catch (err: any) {
              Alert.alert("Error", err.response?.data?.message || "Failed to delete household");
            }
          },
        },
      ]
    );
  };

  const copyInviteCode = () => {
    if (!activeHousehold) return;
    Clipboard.setString(activeHousehold.inviteCode);
    Alert.alert("Copied!", "Invite code copied to clipboard");
  };

  const shareInviteCode = async () => {
    if (!activeHousehold) return;
    try {
      await Share.share({
        message: `Join my household "${activeHousehold.name}" on Smart Stock! Use code: ${activeHousehold.inviteCode}`,
      });
    } catch (err) {
      console.error("Share error:", err);
    }
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    if (diffMs <= 0) return "Expired";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const currentUserRole = allHouseholds.find((h) => h._id === activeHousehold?._id)?.role || "member";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2e7d32" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Household</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Mode</Text>

          {activeHousehold ? (
            <>
              {/* Household Name */}
              {editingName ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={editedName}
                    onChangeText={setEditedName}
                    placeholder="Household name"
                  />
                  <TouchableOpacity style={styles.smallButton} onPress={handleUpdateName}>
                    <Text style={styles.smallButtonText}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallButton, styles.smallButtonOutline]}
                    onPress={() => setEditingName(false)}
                  >
                    <Text style={[styles.smallButtonText, { color: "#666" }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.householdHeader}>
                  <View>
                    <Text style={styles.householdName}>{activeHousehold.name}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, currentUserRole === "owner" && styles.badgeOwner]}>
                        <Text style={styles.badgeText}>{currentUserRole === "owner" ? "Owner" : "Member"}</Text>
                      </View>
                      <Text style={styles.memberCount}>{activeHousehold.members.length} members</Text>
                    </View>
                  </View>
                  <View style={styles.headerButtons}>
                    {currentUserRole === "owner" && (
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          setEditedName(activeHousehold.name);
                          setEditingName(true);
                        }}
                      >
                        <Ionicons name="pencil" size={20} color="#2e7d32" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.iconButton} onPress={handleGoPersonal}>
                      <Ionicons name="person-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Invite Code */}
              <View style={styles.inviteSection}>
                <View style={styles.inviteHeader}>
                  <Text style={styles.inviteLabel}>Invite Code</Text>
                  <Text style={styles.expiryText}>Expires: {getTimeUntilExpiry(activeHousehold.inviteCodeExpiresAt)}</Text>
                </View>
                <View style={styles.codeRow}>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText}>{activeHousehold.inviteCode}</Text>
                  </View>
                  <TouchableOpacity style={styles.iconButton} onPress={copyInviteCode}>
                    <Ionicons name="copy-outline" size={22} color="#2e7d32" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton} onPress={shareInviteCode}>
                    <Ionicons name="share-outline" size={22} color="#2e7d32" />
                  </TouchableOpacity>
                  {currentUserRole === "owner" && (
                    <TouchableOpacity style={styles.iconButton} onPress={handleRegenerateCode}>
                      <Ionicons name="refresh" size={22} color="#2e7d32" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Members */}
              <Text style={styles.membersLabel}>Members</Text>
              {activeHousehold.members.map((member) => (
                <View key={member.userId} style={styles.memberRow}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>{member.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <Text style={styles.memberRole}>
                      {member.role === "owner" ? "Owner" : "Member"} · Joined{" "}
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {currentUserRole === "owner" && member.role !== "owner" && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveMember(member.userId, member.name)}
                    >
                      <Ionicons name="close" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Actions */}
              <View style={styles.actionsRow}>
                {currentUserRole !== "owner" && (
                  <TouchableOpacity style={styles.dangerButton} onPress={handleLeaveHousehold}>
                    <Text style={styles.dangerButtonText}>Leave Household</Text>
                  </TouchableOpacity>
                )}
                {currentUserRole === "owner" && (
                  <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteHousehold}>
                    <Text style={styles.dangerButtonText}>Delete Household</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          ) : (
            <View style={styles.personalMode}>
              <Ionicons name="person" size={48} color="#2e7d32" />
              <Text style={styles.personalTitle}>Personal Mode</Text>
              <Text style={styles.personalSubtitle}>
                You're using your personal pantry and lists. Create or join a household to share with family.
              </Text>
              <View style={styles.personalButtons}>
                <TouchableOpacity style={styles.primaryButton} onPress={() => setShowCreateForm(true)}>
                  <Text style={styles.primaryButtonText}>Create Household</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineButton} onPress={() => setShowJoinForm(true)}>
                  <Text style={styles.outlineButtonText}>Join with Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Create Household Form */}
        {showCreateForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Create New Household</Text>
            <TextInput
              style={styles.input}
              placeholder="Household name (e.g., Smith Family)"
              value={newHouseholdName}
              onChangeText={setNewHouseholdName}
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, creating && styles.buttonDisabled]}
                onPress={handleCreateHousehold}
                disabled={creating}
              >
                <Text style={styles.primaryButtonText}>{creating ? "Creating..." : "Create"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setShowCreateForm(false)}>
                <Text style={styles.outlineButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Join Household Form */}
        {showJoinForm && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join Household</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="Enter 8-character code"
              value={joinCode}
              onChangeText={(text) => setJoinCode(text.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
            />
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, joining && styles.buttonDisabled]}
                onPress={handleJoinHousehold}
                disabled={joining}
              >
                <Text style={styles.primaryButtonText}>{joining ? "Joining..." : "Join"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setShowJoinForm(false)}>
                <Text style={styles.outlineButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* All Households */}
        {allHouseholds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Households</Text>
            {allHouseholds.map((household) => (
              <TouchableOpacity
                key={household._id}
                style={[
                  styles.householdItem,
                  household._id === activeHousehold?._id && styles.householdItemActive,
                ]}
                onPress={() => {
                  if (household._id !== activeHousehold?._id) {
                    handleSwitchHousehold(household._id);
                  }
                }}
              >
                <View>
                  <Text style={styles.householdItemName}>{household.name}</Text>
                  <Text style={styles.householdItemMeta}>
                    {household.role === "owner" ? "Owner" : "Member"} · {household.memberCount} members
                  </Text>
                </View>
                {household._id === activeHousehold?._id ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                )}
              </TouchableOpacity>
            ))}
            <View style={styles.formButtons}>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setShowCreateForm(true)}>
                <Text style={styles.outlineButtonText}>Create New</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setShowJoinForm(true)}>
                <Text style={styles.outlineButtonText}>Join Another</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomButton} onPress={() => router.push("/main/dashboard")}>
          <Ionicons name="home-outline" size={28} color="#2e7d32" />
          <Text style={styles.bottomLabel}>Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbf7" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e3ece5",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#2e7d32" },

  content: { padding: 16, paddingBottom: BOTTOM_BAR_HEIGHT + 20 },

  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e3ece5",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 12 },

  householdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  householdName: { fontSize: 22, fontWeight: "700", color: "#2e7d32" },
  badgeRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  badge: {
    backgroundColor: "#e3ece5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeOwner: { backgroundColor: "#2e7d32" },
  badgeText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  memberCount: { fontSize: 13, color: "#666" },
  headerButtons: { flexDirection: "row" },
  iconButton: { padding: 8, marginLeft: 4 },

  editRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  smallButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  smallButtonOutline: { backgroundColor: "#f0f0f0" },
  smallButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  inviteSection: { backgroundColor: "#f6fbf7", padding: 12, borderRadius: 10, marginBottom: 16 },
  inviteHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  inviteLabel: { fontWeight: "600", color: "#333" },
  expiryText: { fontSize: 12, color: "#888" },
  codeRow: { flexDirection: "row", alignItems: "center" },
  codeBox: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e3ece5",
  },
  codeText: { fontSize: 20, fontWeight: "700", letterSpacing: 2, textAlign: "center", color: "#2e7d32" },

  membersLabel: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 8 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6fbf7",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  memberInfo: { flex: 1 },
  memberName: { fontWeight: "600", color: "#333" },
  memberRole: { fontSize: 12, color: "#888" },
  removeButton: { padding: 6 },

  actionsRow: { marginTop: 12 },
  dangerButton: {
    borderWidth: 1,
    borderColor: "#ef4444",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  dangerButtonText: { color: "#ef4444", fontWeight: "600" },

  personalMode: { alignItems: "center", paddingVertical: 20 },
  personalTitle: { fontSize: 22, fontWeight: "700", color: "#2e7d32", marginTop: 12 },
  personalSubtitle: { textAlign: "center", color: "#666", marginTop: 8, lineHeight: 20 },
  personalButtons: { flexDirection: "row", marginTop: 20 },

  input: {
    borderWidth: 1,
    borderColor: "#e3ece5",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: "#f9f9f9",
    marginBottom: 12,
  },
  codeInput: { textAlign: "center", letterSpacing: 4, fontSize: 18, fontWeight: "600" },

  formButtons: { flexDirection: "row", gap: 10 },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2e7d32",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2e7d32",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  outlineButtonText: { color: "#2e7d32", fontWeight: "600" },
  buttonDisabled: { backgroundColor: "#a5d6a7" },

  householdItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f6fbf7",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  householdItemActive: { borderWidth: 2, borderColor: "#2e7d32" },
  householdItemName: { fontWeight: "600", color: "#333" },
  householdItemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  activeBadge: { backgroundColor: "#2e7d32", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activeBadgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: BOTTOM_BAR_HEIGHT,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e3ece5",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomButton: { alignItems: "center" },
  bottomLabel: { fontSize: 12, color: "#2e7d32", marginTop: 4 },
});
