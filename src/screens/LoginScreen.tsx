import { useEffect, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../auth/AuthContext";
import { ApiError, login } from "../api/client";
import { Button, Field, Notice } from "../components/ui";
import { colors } from "../theme";

const slides = [
  { image: require("../../assets/login/carousel-1.jpg"), title: "Exploration Data Management System", caption: "Field records from archaeological sites across Sri Lanka." },
  { image: require("../../assets/login/carousel-2.jpg"), title: "Mapping Sri Lanka's Heritage", caption: "Site surveys and monument records, ready for conservation." },
  { image: require("../../assets/login/carousel-3.jpg"), title: "Field Data, Digitised", caption: "Structured capture for every site visit." },
];

export function LoginScreen() {
  const { signIn } = useAuth();
  const [slide, setSlide] = useState(0);
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSlide((current) => (current + 1) % slides.length), 5500);
    return () => clearInterval(timer);
  }, []);

  async function handleLogin() {
    setError("");
    const entered = identity.trim();
    if (!entered || !password) {
      setError("Enter your department username or email and password.");
      return;
    }
    const email = entered.includes("@") ? entered : `${entered}@doa.lk`;
    setBusy(true);
    try {
      const result = await login(email, password);
      if (result.user.role?.name?.toUpperCase() !== "FIELD_OFFICER") {
        setError("This app is for Field Officer accounts. Sign in with an account assigned to that role.");
        return;
      }
      await signIn(result.accessToken, result.user);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const current = slides[slide];
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ImageBackground source={current.image} resizeMode="cover" style={styles.hero}>
          <View style={styles.imageShade} />
          <View style={styles.heroContent}>
            <Text style={styles.department}>DEPARTMENT OF ARCHAEOLOGY · SRI LANKA</Text>
            <Text style={styles.heroTitle}>{current.title}</Text>
            <Text style={styles.caption}>{current.caption}</Text>
            <View style={styles.dots}>
              {slides.map((item, index) => (
                <Pressable key={item.title} onPress={() => setSlide(index)} accessibilityLabel={`Show slide ${index + 1}`}>
                  <View style={[styles.dot, slide === index && styles.activeDot]} />
                </Pressable>
              ))}
            </View>
          </View>
          <Text style={styles.slideNumber}>{String(slide + 1).padStart(2, "0")} / 03</Text>
        </ImageBackground>

        <View style={styles.form}>
          <Text style={styles.eyebrow}>FIELD OFFICER ACCESS</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.intro}>Use your department account to continue.</Text>
          <View style={styles.fields}>
            <Field label="Username or email" value={identity} onChangeText={setIdentity} autoCapitalize="none" autoCorrect={false} autoComplete="username" placeholder="j.perera" returnKeyType="next" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" placeholder="Password" onSubmitEditing={handleLogin} />
            {error ? <Notice>{error}</Notice> : null}
            <Button label={busy ? "Signing in…" : "Continue"} icon={busy ? undefined : "→"} onPress={handleLogin} disabled={busy} />
          </View>
          <Text style={styles.footer}>GIS ARCHAEOLOGICAL EXPLORATION SYSTEM</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1 },
  hero: { height: 340, justifyContent: "flex-end", backgroundColor: colors.forest },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: "#13221EB0" },
  heroContent: { paddingHorizontal: 25, paddingBottom: 29, maxWidth: 460 },
  department: { color: "#E5BC64", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  heroTitle: { marginTop: 12, color: "#FFFFFF", fontSize: 28, lineHeight: 33, fontWeight: "700" },
  caption: { marginTop: 8, color: "#F0EEE7", fontSize: 13, lineHeight: 19, maxWidth: 300 },
  dots: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 20 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#FFFFFF80" },
  activeDot: { width: 25, backgroundColor: "#E5BC64" },
  slideNumber: { position: "absolute", top: 28, right: 22, color: "#FFFFFFCC", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  form: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 26, paddingBottom: 25 },
  eyebrow: { color: colors.ochre, fontSize: 10, fontWeight: "800", letterSpacing: 1.3 },
  title: { color: colors.ink, fontSize: 30, fontWeight: "700", marginTop: 5 },
  intro: { color: colors.muted, fontSize: 13, marginTop: 3 },
  fields: { marginTop: 21, gap: 14 },
  footer: { color: "#97998E", fontSize: 9, letterSpacing: 1.1, fontWeight: "700", marginTop: 27 },
});