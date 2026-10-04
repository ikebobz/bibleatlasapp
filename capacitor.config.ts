import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.bibleatlas.app",
  appName: "Bible Atlas",
  webDir: ".output/public",
  server: {
    // Bible Atlas is a server-rendered TanStack Start app (pages and data come
    // from server functions), so the native shell loads the live site instead
    // of a static bundle. A static index.html only shows a blank white screen.
    url: "https://mybibleatlas.com",
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#7a4a24",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#7a4a24",
    },
  },
};

export default config;
