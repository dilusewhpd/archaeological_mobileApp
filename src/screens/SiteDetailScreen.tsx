import { useCallback, useState } from "react";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image, StyleSheet, Text, View } from "react-native";
import { ApiError, getSite, sitePhotoUrl, type SiteDetail } from "../api/client";
import { Button, Heading, Loading, Notice, Page, SectionLabel, StatusTag } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

type DetailRoute = RouteProp<RootStackParamList, "SiteDetail">;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function SiteDetailScreen() {
  const { params } = useRoute<DetailRoute>();
  const navigation = useNavigation<RootNavigation>();
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    getSite(params.siteId).then((detail) => { if (active) { setSite(detail); setError(""); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof ApiError ? reason.message : "Could not load site details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.siteId]);
  useFocusEffect(load);

  if (loading && !site) return <Page><Loading label="Loading site details…" /></Page>;
  if (!site) return <Page><Heading title="Site details" /><Notice>{error || "This site is unavailable."}</Notice><Button label="Back to my sites" variant="secondary" onPress={() => navigation.goBack()} /></Page>;

  const editable = site.status === "DRAFT" || site.status === "REJECTED";
  return (
    <Page>
      <Button label="←  My sites" variant="quiet" onPress={() => navigation.goBack()} />
      <Heading title={site.name} subtitle={`${site.siteCode} · ${site.district} District`} />
      <StatusTag status={site.status} />
      {error ? <Notice>{error}</Notice> : null}
      {site.rejectionReason ? <Notice>Review note: {site.rejectionReason}</Notice> : null}
      <View style={styles.card}>
        <SectionLabel>LOCATION</SectionLabel>
        <Detail label="Province" value={site.province} />
        <Detail label="District" value={site.district} />
        <Detail label="Divisional Secretariat" value={site.divisionalSecretariat} />
        <Detail label="Coordinates" value={`${Number(site.latitude).toFixed(6)}, ${Number(site.longitude).toFixed(6)}`} />
      </View>
      <View style={styles.card}>
        <SectionLabel>SITE RECORD</SectionLabel>
        <Detail label="Historical period" value={titleCase(site.historicalPeriod)} />
        <Detail label="Site type" value={titleCase(site.siteType)} />
        <Detail label="Land use" value={site.landUse} />
        <Detail label="Terrain" value={site.terrain} />
        <Detail label="Description" value={site.description || "Not provided"} />
        {site.distanceToRiver != null ? <Detail label="Distance to river" value={`${site.distanceToRiver} km`} /> : null}
        {site.rainfall != null ? <Detail label="Rainfall" value={`${site.rainfall} mm/year`} /> : null}
        {site.proximityToDevelopment != null ? <Detail label="Proximity to development" value={`${site.proximityToDevelopment} km`} /> : null}
      </View>
      {site.photos.length ? <View style={styles.card}><SectionLabel>PHOTOGRAPHS · {site.photos.length}</SectionLabel><View style={styles.photos}>{site.photos.map((photo) => <Image key={photo.id} source={{ uri: sitePhotoUrl(photo.imageUrl) }} style={styles.photo} />)}</View></View> : <View style={styles.card}><SectionLabel>PHOTOGRAPHS</SectionLabel><Text style={styles.muted}>No photos attached to this record.</Text></View>}
      {editable ? <Button label="Edit site report" onPress={() => navigation.navigate("SiteForm", { siteId: site.id })} /> : null}
    </Page>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  card: { padding: 15, gap: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 5 },
  detail: { gap: 3 },
  label: { color: colors.muted, fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  value: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  photos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photo: { width: 92, height: 92, backgroundColor: colors.line, borderRadius: 3 },
  muted: { color: colors.muted, fontSize: 12 },
});