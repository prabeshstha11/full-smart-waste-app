import 'dotenv/config';

export default {
  expo: {
    name: 'Sajilo Waste',
    slug: 'sajilo-waste',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'sajilo-waste',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#4caf50',
    },
    assetBundlePatterns: [
      '**/*',
    ],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#4caf50',
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-web-browser',
        {
          package: 'expo-web-browser',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      DATABASE_URL: process.env.DATABASE_URL,
    },
  },
}; 