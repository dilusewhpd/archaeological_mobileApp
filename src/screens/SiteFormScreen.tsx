import { useEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ApiError, createSite, getSite, submitSite, updateSite, uploadSitePhoto, type SiteDetail, type SitePayload } from "../api/client";
import { Button, ChoiceField, Field, Heading, Notice, Page, SectionLabel } from "../components/ui";
import { districts, historicalPeriods, isOnSriLanka, optionLabel, provinces, siteTypes } from "../data/siteOptions";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";

type FormRoute = RouteProp<RootStackParamList, "SiteForm">;
type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
type Photo = { uri: string; name: string; type: string; size?: number };
type FormValues = {
  siteCode: string; name: string; province: string; district: string; divisionalSecretariat: string;
  historicalPeriod: string; siteType: string; landUse: string; terrain: string; description: string;
  latitude: string; longitude: string; distanceToRiver: string; rainfall: string; proximityToDevelopment: string;
};

const empty: FormValues = {
  siteCode: "", name: "", province: "", district: "", divisionalSecretariat: "", historicalPeriod: "", siteType: "",
  landUse: "", terrain: "", description: "", latitude: "", longitude: "", distanceToRiver: "", rainfall: "", proximityToDevelopment: "",
};

export function SiteFormScreen() {
  const route = useRoute<FormRoute>();
  const navigation = useNavigation<RootNavigation>();
  const siteId = route.params?.siteId;
  const [values, setValues] = useState<FormValues>(empty);
  const [existingSite, setExistingSite] = useState<SiteDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pageError, setPageError] = useState("");
  const [locationNotice, setLocationNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(siteId));

  useEffect(() => {
    if (!siteId) return;
    let active = true;
    getSite(siteId).then((site) => {
      if (!active) return;
      setExistingSite(site);
      setValues({
        siteCode: site.siteCode, name: site.name, province: site.province, district: site.district,
        divisionalSecretariat: site.divisionalSecretariat, historicalPeriod: site.historicalPeriod, siteType: site.siteType,
        landUse: site.landUse, terrain: site.terrain, description: site.description ?? "", latitude: String(site.latitude),
        longitude: String(site.longitude), distanceToRiver: site.distanceToRiver == null ? "" : String(site.distanceToRiver),
        rainfall: site.rainfall == null ? "" : String(site.rainfall),
        proximityToDevelopment: site.proximityToDevelopment == null ? "" : String(site.proximityToDevelopment),
      });
    }).catch((reason: unknown) => setPageError(reason instanceof ApiError ? reason.message : "Could not load this site for editing."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [siteId]);

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
  }

  async function captureLocation() {
    setLocationNotice("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setLocationNotice("Location permission was not granted. Enter the coordinates manually or enable location access in Settings.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      set("latitude", position.coords.latitude.toFixed(7));
      set("longitude", position.coords.longitude.toFixed(7));
      setLocationNotice(`Device fix accuracy: approximately ${Math.round(position.coords.accuracy ?? 0)} m. You can adjust either coordinate below.`);
    } catch {
      setLocationNotice("Could not read device location. Enter coordinates manually.");
    }
  }

  function appendAssets(assets: ImagePicker.ImagePickerAsset[]) {
    const next: Photo[] = [];
    const messages: string[] = [];
    for (const asset of assets) {
      const type = asset.mimeType ?? "image/jpeg";
      const name = asset.fileName ?? asset.uri.split("/").pop() ?? `site-photo-${Date.now()}.jpg`;
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(type)) {
        messages.push(`${name}: use JPEG, PNG or WebP.`);
      } else if ((asset.fileSize ?? 0) > 10 * 1024 * 1024) {
        messages.push(`${name}: the maximum file size is 10 MB.`);
      } else {
        next.push({ uri: asset.uri, name, type, size: asset.fileSize });
      }
    }
    setPhotos((previous) => [...previous, ...next]);
    setPageError(messages.join("\n"));
  }

  async function choosePhotos() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPageError("Photo library permission was not granted. Enable it in Settings to attach a photograph.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, quality: 0.82 });
    if (!result.canceled) appendAssets(result.assets);
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPageError("Camera permission was not granted. Enable it in Settings or choose an existing photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.82 });
    if (!result.canceled) appendAssets(result.assets);
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    const required = (key: keyof FormValues, label: string, min: number, max: number) => {
      const value = values[key].trim();
      if (value.length < min || value.length > max) next[key] = `${label} must be between ${min} and ${max} characters.`;
    };
    required("siteCode", "Site code", 3, 50);
    required("name", "Site name", 3, 255);
    if (!provinces.includes(values.province)) next.province = "Select a province.";
    if (!districts.includes(values.district)) next.district = "Select a district.";
    required("divisionalSecretariat", "Divisional Secretariat", 2, 150);
    const latitude = Number(values.latitude);
    const longitude = Number(values.longitude);
    if (!values.latitude || !Number.isFinite(latitude) || latitude < -90 || latitude > 90) next.latitude = "Enter a latitude between -90 and 90.";
    if (!values.longitude || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) next.longitude = "Enter a longitude between -180 and 180.";
    if (values.latitude && values.longitude && Number.isFinite(latitude) && Number.isFinite(longitude) && !isOnSriLanka(latitude, longitude)) next.latitude = "The coordinate is outside Sri Lanka's land mass. Adjust the GPS position.";
    if (!historicalPeriods.includes(values.historicalPeriod)) next.historicalPeriod = "Select a historical period.";
    if (!siteTypes.includes(values.siteType)) next.siteType = "Select a site type.";
    required("landUse", "Land use", 2, 255);
    required("terrain", "Terrain", 2, 255);
    if (values.description.trim().length > 5000) next.description = "Description cannot exceed 5000 characters.";
    for (const key of ["distanceToRiver", "rainfall", "proximityToDevelopment"] as const) {
      const raw = values[key].trim();
      if (raw && (!Number.isFinite(Number(raw)) || Number(raw) < 0)) next[key] = "Enter a number of 0 or more.";
    }
    for (const photo of photos) if ((photo.size ?? 0) > 10 * 1024 * 1024) next.photos = "Each photo must be 10 MB or smaller.";
    return next;
  }

  function makePayload(): SitePayload {
    const payload: SitePayload = {
      siteCode: values.siteCode.trim(), name: values.name.trim(), province: values.province, district: values.district,
      divisionalSecretariat: values.divisionalSecretariat.trim(), latitude: Number(values.latitude), longitude: Number(values.longitude),
      historicalPeriod: values.historicalPeriod, siteType: values.siteType, landUse: values.landUse.trim(), terrain: values.terrain.trim(),
    };
    if (values.description.trim()) payload.description = values.description.trim();
    for (const key of ["distanceToRiver", "rainfall", "proximityToDevelopment"] as const) {
      if (values[key].trim()) payload[key] = Number(values[key]);
    }
    return payload;
  }

  async function save(submitForReview: boolean) {
    const localErrors = validate();
    setErrors(localErrors);
    setPageError("");
    if (Object.keys(localErrors).length) return;
    setBusy(true);
    try {
      const saved = siteId ? await updateSite(siteId, makePayload()) : await createSite(makePayload());
      const photoFailures: string[] = [];
      for (const photo of photos) {
        try { await uploadSitePhoto(saved.id, photo); }
        catch (reason) { photoFailures.push(reason instanceof ApiError ? reason.message : `Could not upload ${photo.name}.`); }
      }
      const finalSite = submitForReview ? await submitSite(saved.id) : saved;
      const message = `${finalSite.name} ${submitForReview ? "was submitted for review" : "was saved as a draft"}.${photoFailures.length ? ` ${photoFailures.length} photo upload(s) failed: ${photoFailures.join("; ")}` : ""}`;
      Alert.alert(submitForReview ? "Report submitted" : "Draft saved", message, [{ text: "View site", onPress: () => navigation.replace("SiteDetail", { siteId: saved.id }) }]);
    } catch (reason) {
      if (reason instanceof ApiError) {
        const serverFields = reason.fieldErrors;
        if (Object.keys(serverFields).length) setErrors(serverFields);
        else setPageError(reason.message);
      } else setPageError("Could not save this report. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Page><Heading title="Edit site report" /><Text style={styles.muted}>Loading existing site…</Text></Page>;

  return (
    <Page>
      <Heading title={siteId ? "Edit site report" : "Submit exploration report"} subtitle={siteId ? "Update a draft or rejected record." : "Record a site for review by a Senior Officer."} />
      {existingSite?.rejectionReason ? <Notice>Review note: {existingSite.rejectionReason}</Notice> : null}
      {pageError ? <Notice>{pageError}</Notice> : null}
      <View style={styles.formSection}>
        <SectionLabel>SITE IDENTIFICATION</SectionLabel>
        <Field label="Site code" value={values.siteCode} onChangeText={(value) => set("siteCode", value)} error={errors.siteCode} placeholder="e.g. SITE-KDY-103" autoCapitalize="characters" />
        <Field label="Site name" value={values.name} onChangeText={(value) => set("name", value)} error={errors.name} placeholder="Name used in site records" />
        <ChoiceField label="Province" value={values.province} placeholder="Select province" options={provinces.map((value) => ({ value, label: value }))} onSelect={(value) => set("province", value)} error={errors.province} />
        <ChoiceField label="District" value={values.district} placeholder="Select district" options={districts.map((value) => ({ value, label: value }))} onSelect={(value) => set("district", value)} error={errors.district} />
        <Field label="Divisional Secretariat" value={values.divisionalSecretariat} onChangeText={(value) => set("divisionalSecretariat", value)} error={errors.divisionalSecretariat} placeholder="e.g. Dambulla" />
        <ChoiceField label="Historical period" value={values.historicalPeriod} placeholder="Select period" options={historicalPeriods.map((value) => ({ value, label: optionLabel(value) }))} onSelect={(value) => set("historicalPeriod", value)} error={errors.historicalPeriod} />
        <ChoiceField label="Site type" value={values.siteType} placeholder="Select site type" options={siteTypes.map((value) => ({ value, label: optionLabel(value) }))} onSelect={(value) => set("siteType", value)} error={errors.siteType} />
      </View>

      <View style={styles.formSection}>
        <SectionLabel>FIELD OBSERVATION</SectionLabel>
        <Field label="Land use" value={values.landUse} onChangeText={(value) => set("landUse", value)} error={errors.landUse} placeholder="e.g. Archaeological Reserve" />
        <Field label="Terrain" value={values.terrain} onChangeText={(value) => set("terrain", value)} error={errors.terrain} placeholder="e.g. Rocky foothill" />
        <Field label="Description (optional)" value={values.description} onChangeText={(value) => set("description", value)} error={errors.description} placeholder="Features, condition, access notes…" multiline maxLength={5000} />
      </View>

      <View style={styles.formSection}>
        <SectionLabel>GPS COORDINATES</SectionLabel>
        <Text style={styles.bodyText}>Capture the device fix or enter coordinates below. Both values remain editable.</Text>
        <Button label="◎  Use device location" variant="secondary" onPress={captureLocation} />
        {locationNotice ? <Notice tone={locationNotice.startsWith("Device fix") ? "success" : "info"}>{locationNotice}</Notice> : null}
        <View style={styles.coordinateRow}>
          <View style={styles.coordinateCell}><Field label="Latitude" value={values.latitude} onChangeText={(value) => set("latitude", value)} error={errors.latitude} keyboardType="decimal-pad" placeholder="7.8731" /></View>
          <View style={styles.coordinateCell}><Field label="Longitude" value={values.longitude} onChangeText={(value) => set("longitude", value)} error={errors.longitude} keyboardType="decimal-pad" placeholder="80.7718" /></View>
        </View>
      </View>

      <View style={styles.formSection}>
        <SectionLabel>ENVIRONMENTAL ATTRIBUTES · OPTIONAL</SectionLabel>
        <Field label="Distance to river (km)" value={values.distanceToRiver} onChangeText={(value) => set("distanceToRiver", value)} error={errors.distanceToRiver} keyboardType="decimal-pad" placeholder="0" />
        <Field label="Rainfall (mm/year)" value={values.rainfall} onChangeText={(value) => set("rainfall", value)} error={errors.rainfall} keyboardType="decimal-pad" placeholder="0" />
        <Field label="Proximity to development (km)" value={values.proximityToDevelopment} onChangeText={(value) => set("proximityToDevelopment", value)} error={errors.proximityToDevelopment} keyboardType="decimal-pad" placeholder="0" />
      </View>

      <View style={styles.formSection}>
        <SectionLabel>PHOTOGRAPHS</SectionLabel>
        <Text style={styles.bodyText}>JPEG, PNG or WebP · up to 10 MB per photo.</Text>
        <View style={styles.photoActions}><View style={styles.actionCell}><Button label="Take photo" icon="◎" variant="secondary" onPress={takePhoto} /></View><View style={styles.actionCell}><Button label="Choose photos" icon="＋" variant="secondary" onPress={choosePhotos} /></View></View>
        {errors.photos ? <Text style={styles.formError}>{errors.photos}</Text> : null}
        {existingSite?.photos.length ? <Text style={styles.bodyText}>{existingSite.photos.length} existing photo(s) are already attached.</Text> : null}
        <View style={styles.photoList}>{photos.map((photo, index) => <View key={`${photo.uri}-${index}`} style={styles.photoItem}><Image source={{ uri: photo.uri }} style={styles.preview} /><Pressable onPress={() => setPhotos((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}><Text style={styles.remove}>Remove</Text></Pressable></View>)}</View>
      </View>

      <View style={styles.submitButtons}>
        <Button label={busy ? "Saving…" : siteId ? existingSite?.status === "REJECTED" ? "Resubmit for approval" : "Save changes" : "Submit for approval"} onPress={() => void save(!siteId || existingSite?.status === "REJECTED")} disabled={busy} />
        {(!siteId || existingSite?.status === "DRAFT") ? <Button label="Save as draft" variant="secondary" onPress={() => void save(false)} disabled={busy} /> : null}
      </View>
      {siteId && existingSite?.status === "REJECTED" ? <Text style={styles.bodyText}>Saving changes will keep the record rejected. Use Submit for approval to resubmit it.</Text> : null}
    </Page>
  );
}

const styles = StyleSheet.create({
  formSection: { padding: 15, gap: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 5 },
  bodyText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  coordinateRow: { flexDirection: "row", gap: 10 },
  coordinateCell: { flex: 1 },
  photoActions: { flexDirection: "row", gap: 8 },
  actionCell: { flex: 1 },
  photoList: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  photoItem: { width: 86, gap: 4 },
  preview: { width: 86, height: 86, backgroundColor: colors.line, borderRadius: 3 },
  remove: { color: colors.rejected, fontSize: 11, fontWeight: "700" },
  formError: { color: colors.rejected, fontSize: 11 },
  submitButtons: { gap: 8 },
  muted: { color: colors.muted, fontSize: 13 },
});