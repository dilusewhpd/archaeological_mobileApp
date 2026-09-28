import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Field Officer",
  slug: "archaeology-field-officer",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "Use your location to record archaeological site coordinates and locate your sites on the map.",
      NSCameraUsageDescription: "Take photographs of archaeological sites for your report.",
      NSPhotoLibraryUsageDescription: "Choose site photographs to attach to your report.",
    },
  },
  android: {
    permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "CAMERA", "READ_MEDIA_IMAGES"],
    usesCleartextTraffic: true,
    ...(process.env.GOOGLE_MAPS_API_KEY ? {
      config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY } },
    } : {}),
  },
  plugins: [
    ["expo-location", { locationWhenInUsePermission: "Allow Field Officer to use your location for site coordinates and the map." }],
    ["expo-image-picker", {
      photosPermission: "Allow Field Officer to select site photographs.",
      cameraPermission: "Allow Field Officer to photograph archaeological sites.",
    }],
    "expo-secure-store",
  ],
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.8.101:3000",
  },
};

export default config;