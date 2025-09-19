import * as SecureStore from 'expo-secure-store';
import { User } from './types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export class AuthStorage {
  static async saveToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      // Token save failed - silently handled
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      // Token retrieval failed - return null
      return null;
    }
  }

  static async removeToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      // Token removal failed - silently handled
    }
  }

  static async saveUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } catch (error) {
      // User save failed - silently handled
    }
  }

  static async getUser(): Promise<User | null> {
    try {
      const userString = await SecureStore.getItemAsync(USER_KEY);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      // User retrieval failed - return null
      return null;
    }
  }

  static async removeUser(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      // User removal failed - silently handled
    }
  }

  static async clearAll(): Promise<void> {
    await Promise.all([
      this.removeToken(),
      this.removeUser(),
    ]);
  }
}