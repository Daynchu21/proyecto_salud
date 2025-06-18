import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "Emergencias",
  slug: "miapp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icons/icon_1024.png",
  android: {
    package: "com.daynchu20.proyectosaludapp",
    googleServicesFile: "./google-services.json",
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
  },
  extra: {
    apiStatusUrl: process.env.EXPO_PUBLIC_API_KEY_STATUS,
    analyticsEnabled: process.env.EXPO_PUBLIC_ANALYTICS_ENABLED === "true",
    eas: {
      projectId: "50525bba-4d50-4097-b119-be4f6112bc17",
    },
  },
});
