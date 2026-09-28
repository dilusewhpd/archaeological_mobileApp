import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SiteStatus } from "../api/client";
import { colors, statusColors } from "../theme";

export function Page({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {scroll ? <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">{children}</ScrollView> : children}
    </SafeAreaView>
  );
}

export function Heading({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        <Text style={styles.eyebrow}>FIELD NOTES / SRI LANKA</Text>
        <Text style={styles.heading}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Button({ label, onPress, variant = "primary", disabled, icon }: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  disabled?: boolean;
  icon?: string;
}) {
  const background = variant === "primary" ? colors.forest : variant === "danger" ? colors.dangerBg : colors.surface;
  const foreground = variant === "primary" ? "#FFFFFF" : variant === "danger" ? colors.rejected : colors.forest;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [
      styles.button,
      { backgroundColor: background, borderColor: variant === "primary" ? colors.forest : variant === "danger" ? "#E8C6C0" : colors.line },
      variant === "quiet" && styles.quietButton,
      pressed && !disabled && styles.pressed,
      disabled && styles.disabled,
    ]}>
      {icon ? <Text style={[styles.buttonIcon, { color: foreground }]}>{icon}</Text> : null}
      <Text style={[styles.buttonText, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, error, hint, ...props }: TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9A9F97"
        style={[styles.input, props.multiline && styles.multiline, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function ChoiceField({ label, value, placeholder, options, onSelect, error }: {
  label: string;
  value: string;
  placeholder: string;
  options: { label: string; value: string }[];
  onSelect: (value: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value)?.label;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setOpen(true)} style={[styles.input, styles.choice, error && styles.inputError]}>
        <Text style={[styles.choiceText, !selected && styles.placeholder]}>{selected ?? placeholder}</Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{label}</Text>
            <ScrollView>
              {options.map((option) => (
                <Pressable key={option.value} onPress={() => { onSelect(option.value); setOpen(false); }} style={styles.option}>
                  <Text style={[styles.optionText, option.value === value && styles.selectedOption]}>{option.label}</Text>
                  {option.value === value ? <Text style={styles.selectedOption}>✓</Text> : null}
                </Pressable>
              ))}
            </ScrollView>
            <Button label="Cancel" variant="secondary" onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function StatusTag({ status }: { status: SiteStatus }) {
  const labels: Record<SiteStatus, string> = { DRAFT: "Draft", PENDING: "Pending review", APPROVED: "Approved", REJECTED: "Rejected" };
  return (
    <View style={[styles.statusTag, { borderColor: `${statusColors[status]}55`, backgroundColor: `${statusColors[status]}12` }]}>
      <View style={[styles.statusDot, { backgroundColor: statusColors[status] }]} />
      <Text style={[styles.statusText, { color: statusColors[status] }]}>{labels[status]}</Text>
    </View>
  );
}

export function Notice({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" | "success" }) {
  const palette = tone === "error"
    ? { bg: colors.dangerBg, ink: colors.rejected, border: "#E8C6C0" }
    : tone === "success"
      ? { bg: colors.forestLight, ink: colors.approved, border: "#C6D7C9" }
      : { bg: "#EDF1F2", ink: "#46636E", border: "#CEDADD" };
  return <View style={[styles.notice, { backgroundColor: palette.bg, borderColor: palette.border }]}><Text style={{ color: palette.ink, fontSize: 13, lineHeight: 19 }}>{children}</Text></View>;
}

export function Loading({ label = "Loading live records…" }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.forest} /><Text style={styles.loadingText}>{label}</Text></View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  page: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 32, gap: 18 },
  headingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 },
  headingCopy: { flex: 1 },
  eyebrow: { color: colors.ochre, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  heading: { color: colors.ink, fontSize: 27, fontWeight: "700", marginTop: 6 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  button: { minHeight: 48, borderWidth: 1, borderRadius: 5, paddingHorizontal: 15, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  quietButton: { borderColor: "transparent", backgroundColor: "transparent" },
  buttonText: { fontSize: 14, fontWeight: "700" },
  buttonIcon: { fontSize: 17, fontWeight: "600" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  field: { gap: 6 },
  label: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.line, borderRadius: 4, backgroundColor: colors.surface, paddingHorizontal: 12, color: colors.ink, fontSize: 14 },
  inputError: { borderColor: colors.rejected },
  multiline: { minHeight: 104, textAlignVertical: "top", paddingTop: 12 },
  fieldError: { color: colors.rejected, fontSize: 11, lineHeight: 15 },
  hint: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  choice: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  choiceText: { color: colors.ink, fontSize: 14 },
  placeholder: { color: "#9A9F97" },
  chevron: { color: colors.muted, fontSize: 18 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#121B19AA" },
  modalSheet: { maxHeight: "82%", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28, backgroundColor: colors.paper, borderTopLeftRadius: 12, borderTopRightRadius: 12, gap: 12 },
  modalHandle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: colors.line },
  modalTitle: { color: colors.ink, fontSize: 19, fontWeight: "700", paddingVertical: 6 },
  option: { minHeight: 50, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionText: { color: colors.ink, fontSize: 14 },
  selectedOption: { color: colors.forest, fontWeight: "700" },
  statusTag: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 3, minHeight: 25, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  notice: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10 },
  loading: { minHeight: 140, justifyContent: "center", alignItems: "center", gap: 10 },
  loadingText: { color: colors.muted, fontSize: 12 },
  sectionLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 1 },
});