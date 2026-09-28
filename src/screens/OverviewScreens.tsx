import { useCallback, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError, getDashboard, getMySites, type DashboardStats, type SiteListItem, type SiteStatus } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Button, Heading, Notice, Page, SectionLabel, StatusTag } from "../components/ui";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export function DashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<RootNavigation>();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<SiteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([getDashboard(), getMySites()])
      .then(([currentStats, sites]) => {
        if (!active) return;
        setStats(currentStats);
        setRecent(sites.slice(0, 4));
        setError("");
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof ApiError ? reason.message : "Could not load dashboard."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(load);
  const name = user?.firstName ?? "Field officer";
  const total = stats?.total ?? 0;

  return (
    <Page>
      <Heading title={`Good day, ${name}`} subtitle="Your field submissions, at a glance." />
      {error ? <Notice>{error}</Notice> : null}
      <View style={styles.statsGrid}>
        <Stat label="SITES REGISTERED" value={stats?.total} loading={loading} color={colors.forest} />
        <Stat label="PENDING REVIEW" value={stats?.pending} loading={loading} color={colors.pending} />
        <Stat label="APPROVED" value={stats?.approved} loading={loading} color={colors.approved} />
        <Stat label="REJECTED" value={stats?.rejected} loading={loading} color={colors.rejected} />
      </View>

      <View style={styles.sectionHeader}>
        <SectionLabel>RECENT FIELD RECORDS</SectionLabel>
        <Pressable onPress={() => navigation.navigate("MainTabs", { screen: "Sites" } as never)}>
          <Text style={styles.link}>All sites →</Text>
        </Pressable>
      </View>
      <View style={styles.records}>
        {loading ? <View style={styles.loading}><ActivityIndicator color={colors.forest} /></View> : recent.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyTitle}>No sites recorded yet</Text><Text style={styles.emptyText}>Your live submissions will appear here.</Text></View>
        ) : recent.map((site) => <SiteRow key={site.id} site={site} onPress={() => navigation.navigate("SiteDetail", { siteId: site.id })} />)}
      </View>
      <View style={styles.footerButtons}>
        <Button label="Register a site" icon="+" onPress={() => navigation.navigate("SiteForm", {})} />
        <Button label="Open GIS map" variant="secondary" icon="◎" onPress={() => navigation.navigate("MainTabs", { screen: "Map" } as never)} />
      </View>
      <Text style={styles.accountLine}>{user?.email}</Text>
      {stats && total > 0 ? <Text style={styles.note}>{stats.draft} draft · {stats.pending} pending · {stats.approved} approved · {stats.rejected} rejected</Text> : null}
    </Page>
  );
}

export function MySitesScreen() {
  const navigation = useNavigation<RootNavigation>();
  const [sites, setSites] = useState<SiteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | SiteStatus>("ALL");

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    getMySites().then((items) => {
      if (active) { setSites(items); setError(""); }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof ApiError ? reason.message : "Could not load your sites.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useFocusEffect(load);

  const visible = sites.filter((site) => {
    const matchesStatus = filter === "ALL" || site.status === filter;
    const term = query.trim().toLowerCase();
    return matchesStatus && (!term || site.name.toLowerCase().includes(term) || site.siteCode.toLowerCase().includes(term));
  });
  const filters: { label: string; value: "ALL" | SiteStatus }[] = [
    { label: "All", value: "ALL" }, { label: "Draft", value: "DRAFT" }, { label: "Pending", value: "PENDING" },
    { label: "Approved", value: "APPROVED" }, { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <Page>
      <Heading title="My sites" subtitle={`${sites.length} live records from your account`} right={<Pressable onPress={() => navigation.navigate("SiteForm", {})} style={styles.addCircle}><Text style={styles.addGlyph}>+</Text></Pressable>} />
      <TextInput value={query} onChangeText={setQuery} placeholder="Search name or site code" placeholderTextColor="#959A91" style={styles.search} autoCapitalize="none" />
      <View style={styles.filterWrap}>{filters.map((item) => <Pressable key={item.value} onPress={() => setFilter(item.value)} style={[styles.filter, filter === item.value && styles.filterActive]}><Text style={[styles.filterText, filter === item.value && styles.filterTextActive]}>{item.label}</Text></Pressable>)}</View>
      {error ? <Notice>{error}</Notice> : null}
      {loading ? <View style={styles.loading}><ActivityIndicator color={colors.forest} /><Text style={styles.emptyText}>Refreshing your records…</Text></View> : visible.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyTitle}>{sites.length ? "No matching sites" : "No sites registered yet"}</Text><Text style={styles.emptyText}>{sites.length ? "Try another status or search." : "Create your first site report to get started."}</Text></View>
      ) : <View style={styles.records}>{visible.map((site) => <SiteRow key={site.id} site={site} onPress={() => navigation.navigate("SiteDetail", { siteId: site.id })} />)}</View>}
      <Button label="Refresh records" variant="secondary" onPress={() => load()} />
    </Page>
  );
}

export function MoreScreen() {
  const navigation = useNavigation<RootNavigation>();
  return (
    <Page>
      <Heading title="Field tools" subtitle="Reports and account details." />
      <Pressable onPress={() => navigation.navigate("Reports")} style={styles.moreRow}><View style={styles.moreIcon}><Text style={styles.moreGlyph}>▤</Text></View><View style={styles.moreCopy}><Text style={styles.rowTitle}>Reports</Text><Text style={styles.rowMeta}>Download your live site log as a PDF</Text></View><Text style={styles.arrow}>→</Text></Pressable>
      <Pressable onPress={() => navigation.navigate("Settings")} style={styles.moreRow}><View style={[styles.moreIcon, { backgroundColor: "#ECECE2" }]}><Text style={[styles.moreGlyph, { color: colors.ink }]}>◉</Text></View><View style={styles.moreCopy}><Text style={styles.rowTitle}>Settings</Text><Text style={styles.rowMeta}>Your profile and sign out</Text></View><Text style={styles.arrow}>→</Text></Pressable>
      <Text style={styles.accountLine}>DEPARTMENT OF ARCHAEOLOGY · SRI LANKA</Text>
    </Page>
  );
}

function Stat({ label, value, loading, color }: { label: string; value?: number; loading: boolean; color: string }) {
  return <View style={styles.stat}><View style={[styles.statMark, { backgroundColor: color }]} /><Text style={styles.statLabel}>{label}</Text>{loading ? <ActivityIndicator style={styles.statValue} size="small" color={color} /> : <Text style={[styles.statValue, { color }]}>{value ?? 0}</Text>}</View>;
}

function SiteRow({ site, onPress }: { site: SiteListItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.siteRow, pressed && { opacity: 0.72 }]}>
      <View style={styles.siteCopy}>
        <Text style={styles.rowTitle} numberOfLines={1}>{site.name}</Text>
        <Text style={styles.rowMeta}>{site.siteCode} · {site.district} District</Text>
        <Text style={styles.dateText}>Updated {new Date(site.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</Text>
      </View>
      <View style={styles.siteSide}><StatusTag status={site.status} /><Text style={styles.arrow}>›</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "48%", minHeight: 116, padding: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 5, justifyContent: "space-between" },
  statMark: { width: 22, height: 3, borderRadius: 2 },
  statLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.7, marginTop: 8 },
  statValue: { fontSize: 27, fontWeight: "700", marginTop: 3, alignSelf: "flex-start" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  link: { color: colors.forest, fontSize: 12, fontWeight: "700" },
  records: { borderTopWidth: 1, borderTopColor: colors.line },
  siteRow: { minHeight: 78, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: 10 },
  siteCopy: { flex: 1, gap: 3 },
  rowTitle: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  rowMeta: { color: colors.muted, fontSize: 11 },
  dateText: { color: "#92978E", fontSize: 10 },
  siteSide: { alignItems: "flex-end", gap: 5 },
  arrow: { color: colors.ochre, fontSize: 18, fontWeight: "600" },
  empty: { minHeight: 150, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 6 },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" },
  emptyText: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  loading: { minHeight: 100, alignItems: "center", justifyContent: "center", gap: 10 },
  footerButtons: { gap: 9, marginTop: 2 },
  accountLine: { color: "#97998E", fontSize: 9, fontWeight: "700", letterSpacing: 0.7 },
  note: { color: colors.muted, fontSize: 11 },
  search: { minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: colors.surface, color: colors.ink, paddingHorizontal: 12, fontSize: 13 },
  filterWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  filter: { paddingHorizontal: 11, minHeight: 30, justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 2, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  filterText: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  addCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  addGlyph: { color: "#FFFFFF", fontSize: 24, lineHeight: 26, fontWeight: "400" },
  moreRow: { minHeight: 82, borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", gap: 12 },
  moreIcon: { width: 42, height: 42, backgroundColor: colors.forestLight, alignItems: "center", justifyContent: "center" },
  moreGlyph: { color: colors.forest, fontSize: 20, fontWeight: "700" },
  moreCopy: { flex: 1, gap: 3 },
});