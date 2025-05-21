import { Drawer } from "expo-router/drawer";

export default function AppLayout() {
  return (
     <Drawer
      screenOptions={{
        headerShown: true, // show top header with burger menu by default
      }}
    >
      <Drawer.Screen
        name="home"
        options={{ title: "Home" }}
      />
      <Drawer.Screen
        name="settings"
        options={{ title: "Settings" }}
      />
         <Drawer.Screen
        name="logout"
        options={{ title: "Logout" }}
      />
    </Drawer>
  );
}