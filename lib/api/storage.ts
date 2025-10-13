import * as SecureStore from 'expo-secure-store';
import { User } from './types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REMEMBERED_EMAIL_KEY = 'remembered_email';
const REMEMBER_ME_KEY = 'remember_me';

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
      this.clearRememberedCredentials(),
    ]);
  }

  // Remember Me functionality
  static async saveRememberedEmail(email: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email);
    } catch (error) {
      // Email save failed - silently handled
    }
  }

  static async getRememberedEmail(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY);
    } catch (error) {
      return null;
    }
  }

  static async saveRememberMe(remember: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(REMEMBER_ME_KEY, remember.toString());
    } catch (error) {
      // Remember me save failed - silently handled
    }
  }

  static async getRememberMe(): Promise<boolean> {
    try {
      const remember = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
      return remember === 'true';
    } catch (error) {
      return false;
    }
  }

  static async clearRememberedCredentials(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY),
        SecureStore.deleteItemAsync(REMEMBER_ME_KEY),
      ]);
    } catch (error) {
      // Clear failed - silently handled
    }
  }
}