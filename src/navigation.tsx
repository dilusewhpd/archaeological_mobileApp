import { useCallback } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Text } from "react-native";
import { useAuth } from "./auth/AuthContext";
import { LoginScreen } from "./screens/LoginScreen";
import { DashboardScreen, MySitesScreen, MoreScreen } from "./screens/OverviewScreens";
import { SiteDetailScreen } from "./screens/SiteDetailScreen";
import { SiteFormScreen } from "./screens/SiteFormScreen";
import { MapScreen } from "./screens/MapScreen";
import { ReportsScreen, SettingsScreen } from "./screens/AccountScreens";
import type { RootStackParamList, TabParamList } from "./navigation/types";
import { colors } from "./theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

function RegisterShortcut() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  useFocusEffect(useCallback(() => { navigation.navigate("SiteForm", {}); }, [navigation]));
  return null;
}

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.forest,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { height: 62, paddingTop: 7, paddingBottom: 7, backgroundColor: colors.surface, borderTopColor: colors.line },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
      tabBarIcon: ({ focused }) => {
        const glyphs: Record<keyof TabParamList, string> = { Dashboard: "⌂", Sites: "▤", Register: "+", Map: "◎", More: "•••" };
        return <Text style={{ color: focused ? colors.forest : colors.muted, fontSize: 19, fontWeight: "700" }}>{glyphs[route.name]}</Text>;
      },
    })}>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Overview" }} />
      <Tabs.Screen name="Sites" component={MySitesScreen} options={{ title: "My sites" }} />
      <Tabs.Screen name="Register" component={RegisterShortcut} options={{ title: "New report" }} />
      <Tabs.Screen name="Map" component={MapScreen} options={{ title: "GIS map" }} />
      <Tabs.Screen name="More" component={MoreScreen} options={{ title: "More" }} />
    </Tabs.Navigator>
  );
}

export function AppNavigation() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}>
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="SiteDetail" component={SiteDetailScreen} />
            <Stack.Screen name="SiteForm" component={SiteFormScreen} />
            <Stack.Screen name="Reports" component={ReportsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
}