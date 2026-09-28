import { StyleSheet, Text, View } from "react-native";
import { Heading, Page } from "../components/ui";
import { colors } from "../theme";

export function MapScreen() {
  return (
    <Page>
      <Heading title="GIS map" subtitle="Native map view" />
      <View style={styles.notice}>
        <Text style={styles.title}>GIS map is available on mobile</Text>
        <Text style={styles.message}>
          Open this screen in Expo Go or an Android/iOS device build to view the native map.
        </Text>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  notice: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 5,
    gap: 8,
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
});
