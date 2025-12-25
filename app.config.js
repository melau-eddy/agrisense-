export default {
  expo: {
    name: "AgriSense Pro",
    slug: "agrisense-pro",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.agrisense.pro",
      buildNumber: "1.0.0"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.agrisense.pro",
      versionCode: 1,
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      // Production Groq API key (hardcoded for security)
      groqApiKey: "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",
      eas: {
        projectId: "agrisense-pro"
      }
    },
    plugins: [
      "expo-font"
    ],
    updates: {
      url: "https://u.expo.dev/agrisense-11849"
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  }
};