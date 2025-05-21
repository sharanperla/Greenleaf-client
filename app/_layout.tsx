import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
function AuthWrapper() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('not logged in');
      
      router.replace("/login");
    }
  }, [user]);



  return <Slot />;
}

export default function RootLayout() {
  return (
   <GestureHandlerRootView style={{flex:1}}>
   <SafeAreaProvider style={styles.container}>
      <AuthProvider>
        <Toaster />
        <AuthWrapper />
      </AuthProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView> 
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none",
  },
});