import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider } from "./src/auth/AuthContext";
import { clearToken, getMe, readToken, type Officer } from "./src/api/client";
import { AppNavigation } from "./src/navigation";
import { colors } from "./src/theme";

export default function App() {
  const [initialUser, setInitialUser] = useState<Officer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      const token = await readToken();
      if (token) {
        try {
          const officer = await getMe();
          if (officer.role?.name?.toUpperCase() === "FIELD_OFFICER") {
            if (active) setInitialUser(officer);
          } else {
            await clearToken();
          }
        } catch {
          await clearToken();
        }
      }
      if (active) setReady(true);
    }
    void restoreSession();
    return () => { active = false; };
  }, []);

  if (!ready) {
    return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.paper }}><ActivityIndicator color={colors.forest} /></View>;
  }

  return (
    <AuthProvider initialUser={initialUser}>
      <StatusBar style="dark" />
      <AppNavigation />
    </AuthProvider>
  );
}
