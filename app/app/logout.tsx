import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

export default function Logout() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function doLogout() {
      await logout();
      router.replace("/login"); // or wherever you want to redirect after logout
    }
    doLogout();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text>Logging out...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: "center", alignItems: "center",
  },
});
