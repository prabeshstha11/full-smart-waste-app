import { TokenCache } from '@clerk/clerk-expo/dist/cache';
import AsyncStorage from '@react-native-async-storage/async-storage';

const createTokenCache = (): TokenCache => {
  return {
    async getToken(key: string) {
      try {
        const token = await AsyncStorage.getItem(key);
        return token;
      } catch (err) {
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        return await AsyncStorage.setItem(key, value);
      } catch (err) {
        return;
      }
    },
  };
};

export const tokenCache = createTokenCache(); 