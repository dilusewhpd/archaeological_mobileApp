import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import MapView, { Marker, type Region } from "react-native-maps";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ApiError, getMySites, type SiteListItem, type SiteStatus } from "../api/client";
import { Heading, Notice, Page, StatusTag } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";
import { colors, statusColors } from "../theme";

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
type Filter = "ALL" | SiteStatus;
const initialRegion: Region = { latitude: 7.8731, longitude: 80.7718, latitudeDelta: 4.4, longitudeDelta: 3.2 };

export function MapScreen() {
  const navigation = useNavigation<RootNavigation>();
  const [sites, setSites] = useState<SiteListItem[]>([]);
  const [selected, setSelected] = useState<SiteListItem | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [locationStatus, setLocationStatus] = useState<"checking" | "granted" | "denied">("checking");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    getMySites().then((items) => { if (active) { setSites(items); setError(""); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof ApiError ? reason.message : "Could not load sites for the map."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useFocusEffect(load);

  useEffect(() => {
    let active = true;
    Location.requestForegroundPermissionsAsync().then((permission) => {
      if (active) setLocationStatus(permission.status === "granted" ? "granted" : "denied");
    }).catch(() => { if (active) setLocationStatus("denied"); });
    return () => { active = false; };
  }, []);

  const visible = sites.filter((site) => filter === "ALL" || site.status === filter);
  const filters: { label: string; value: Filter }[] = [
    { label: "All", value: "ALL" }, { label: "Draft", value: "DRAFT" }, { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <Page>
      <Heading title="GIS map" subtitle="Your sites across Sri Lanka" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((item) => <Pressable key={item.value} onPress={() => { setFilter(item.value); setSelected(null); }} style={[styles.filter, filter === item.value && styles.filterActive]}><Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}
      </ScrollView>
      {error ? <Notice>{error}</Notice> : null}
      {locationStatus === "denied" ? <Notice tone="info">Location permission is off. The map is centered on Sri Lanka; your current location is not shown.</Notice> : null}
      {locationStatus === "checking" ? <Text style={styles.permissionLine}>Checking location permission…</Text> : null}
      <View style={styles.mapFrame}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation={locationStatus === "granted"}
          showsMyLocationButton={locationStatus === "granted"}
          onPress={() => setSelected(null)}
          loadingEnabled
        >
          {visible.map((site) => {
            const latitude = Number(site.latitude);
            const longitude = Number(site.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            return <Marker key={site.id} coordinate={{ latitude, longitude }} pinColor={statusColors[site.status]} title={site.name} description={`${site.siteCode} · ${site.status.toLowerCase()}`} onPress={() => setSelected(site)} />;
          })}
        </MapView>
        {loading ? <View style={styles.loadingOverlay}><ActivityIndicator color={colors.forest} /><Text style={styles.loadingText}>Loading your sites…</Text></View> : null}
        {!loading && visible.length === 0 ? <View pointerEvents="none" style={styles.emptyOverlay}><Text style={styles.emptyTitle}>No sites in this view</Text><Text style={styles.loadingText}>{sites.length ? "Change the status filter." : "Registered sites will appear here."}</Text></View> : null}
      </View>
      <View style={styles.legend}>{(["DRAFT", "PENDING", "APPROVED", "REJECTED"] as SiteStatus[]).map((status) => <View key={status} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: statusColors[status] }]} /><Text style={styles.legendText}>{status[0] + status.slice(1).toLowerCase()}</Text></View>)}</View>
      {selected ? <Pressable onPress={() => navigation.navigate("SiteDetail", { siteId: selected.id })} style={styles.selectedCard}><View style={styles.selectedCopy}><Text style={styles.siteName} numberOfLines={1}>{selected.name}</Text><Text style={styles.siteMeta}>{selected.siteCode} · {selected.district}</Text><StatusTag status={selected.status} /></View><Text style={styles.openArrow}>View →</Text></Pressable> : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: 7, paddingRight: 20 },
  filter: { minHeight: 31, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 3 },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  permissionLine: { color: colors.muted, fontSize: 11 },
  mapFrame: { height: 440, overflow: "hidden", borderWidth: 1, borderColor: colors.line, backgroundColor: "#E5E9E4", borderRadius: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#F5F2E8DD" },
  emptyOverlay: { position: "absolute", alignSelf: "center", top: "42%", alignItems: "center", padding: 13, backgroundColor: "#FFFEFAEE", borderWidth: 1, borderColor: colors.line },
  emptyTitle: { color: colors.ink, fontSize: 13, fontWeight: "700" },
  loadingText: { color: colors.muted, fontSize: 11 },
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.muted, fontSize: 10 },
  selectedCard: { padding: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  selectedCopy: { flex: 1, gap: 4 },
  siteName: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  siteMeta: { color: colors.muted, fontSize: 11 },
  openArrow: { color: colors.forest, fontSize: 12, fontWeight: "700" },
});