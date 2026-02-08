import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PREVIEW ? 'Dojo Kiosk (Staging)' : 'Dojo Kiosk',
  slug: 'mmd-kiosk-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PREVIEW ? 'com.mmd.kioskapp.staging' : 'com.mmd.kioskapp',
    icon: './assets/icon.png',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: IS_PREVIEW ? 'com.mmd.kioskapp.staging' : 'com.mmd.kioskapp',
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#ffffff',
    },
  },
  web: {},
  scheme: 'mmd-kiosk-app',
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    router: {},
    eas: {
      projectId: '6bb3228d-db45-48f0-ba25-2011fc935e73',
    },
  },
});
