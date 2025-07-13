import AsyncStorage from "@react-native-async-storage/async-storage";
import { PhotoService } from "./PhotoService";
import { supabase } from "./supabase";

export interface User {
  id: string;
  name: string;
  profile_photo?: string;
  created_at: string;
  updated_at: string;
}

const DEVICE_USER_ID_KEY = "@casus_device_user_id";

export class UserService {
  /**
   * Generate a simple UUID v4 (without external dependencies)
   */
  private static generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  /**
   * Generate a unique device UUID
   */
  private static async generateDeviceUserId(): Promise<string> {
    return this.generateUUID();
  }

  /**
   * Get stored device user ID (returns null if not set)
   */
  private static async getStoredDeviceUserId(): Promise<string | null> {
    return await AsyncStorage.getItem(DEVICE_USER_ID_KEY);
  }

  /**
   * Get or create device-specific user ID
   */
  private static async getOrCreateDeviceUserId(): Promise<string> {
    let deviceUserId = await AsyncStorage.getItem(DEVICE_USER_ID_KEY);

    if (!deviceUserId) {
      deviceUserId = await this.generateDeviceUserId();
      await AsyncStorage.setItem(DEVICE_USER_ID_KEY, deviceUserId);
    }

    return deviceUserId;
  }

  /**
   * Create or update user for this device
   */
  static async createOrUpdateUser(
    name: string,
    profilePhotoUri?: string
  ): Promise<User> {
    const deviceUserId = await this.getOrCreateDeviceUserId();

    // Upload profile photo if provided
    let profilePhotoUrl: string | undefined;
    if (profilePhotoUri) {
      try {
        profilePhotoUrl = await PhotoService.uploadProfilePhoto(
          deviceUserId,
          profilePhotoUri
        );
      } catch (error) {
        console.error("Error uploading profile photo:", error);
        // Continue without photo if upload fails
      }
    }

    // Check if user already exists for this device
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", deviceUserId)
      .single();

    if (existingUser) {
      // Update existing user
      const updateData: any = {
        name: name.trim(),
        updated_at: new Date().toISOString(),
      };

      // Only update profile photo if new one was uploaded
      if (profilePhotoUrl) {
        updateData.profile_photo = profilePhotoUrl;
      }

      const { data, error } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", deviceUserId)
        .select()
        .single();

      if (error) {
        console.error("Error updating user:", error);
        throw new Error("Failed to update user profile");
      }

      return data;
    } else {
      // Create new user with device-specific UUID
      const insertData: any = {
        id: deviceUserId,
        name: name.trim(),
      };

      if (profilePhotoUrl) {
        insertData.profile_photo = profilePhotoUrl;
      }

      const { data, error } = await supabase
        .from("users")
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error("Error creating user:", error);
        console.error("Device User ID:", deviceUserId); // Debug log
        throw new Error("Failed to create user profile");
      }

      return data;
    }
  }

  /**
   * Update user profile photo
   */
  static async updateProfilePhoto(
    userId: string,
    profilePhotoUri: string
  ): Promise<User> {
    try {
      // Upload new profile photo
      const profilePhotoUrl = await PhotoService.uploadProfilePhoto(
        userId,
        profilePhotoUri
      );

      // Update user record
      const { data, error } = await supabase
        .from("users")
        .update({
          profile_photo: profilePhotoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile photo:", error);
        throw new Error("Failed to update profile photo");
      }

      return data;
    } catch (error) {
      console.error("Error updating profile photo:", error);
      throw error;
    }
  }

  /**
   * Remove user profile photo
   */
  static async removeProfilePhoto(userId: string): Promise<User> {
    try {
      // Delete photo from storage
      await PhotoService.deleteProfilePhoto(userId);

      // Update user record
      const { data, error } = await supabase
        .from("users")
        .update({
          profile_photo: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error removing profile photo:", error);
        throw new Error("Failed to remove profile photo");
      }

      return data;
    } catch (error) {
      console.error("Error removing profile photo:", error);
      throw error;
    }
  }

  /**
   * Get current device user (returns null if no user exists yet)
   */
  static async getCurrentUser(): Promise<User | null> {
    try {
      // First check if we have a stored device user ID
      const deviceUserId = await this.getStoredDeviceUserId();

      // If no device ID is stored, user hasn't been created yet
      if (!deviceUserId) {
        return null;
      }

      // Query database for existing user
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", deviceUserId)
        .single();

      if (error) {
        // User doesn't exist in database (but device ID exists locally)
        // This could happen if database was reset but local storage wasn't
        console.log("User not found in database, returning null");
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      return null;
    }
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error getting user:", error);
      return null;
    }

    return data;
  }

  /**
   * Update user profile
   */
  static async updateUser(
    userId: string,
    updates: Partial<Pick<User, "name">>
  ): Promise<User> {
    const { data, error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user profile");
    }

    return data;
  }

  /**
   * Check if user exists by name (for avoiding duplicates if needed)
   */
  static async getUserByName(name: string): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("name", name.trim())
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error getting user by name:", error);
      return null;
    }

    return data;
  }

  /**
   * Get all users (for admin purposes or leaderboards)
   */
  static async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting all users:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Clear device user (for testing/reset purposes)
   */
  static async clearDeviceUser(): Promise<void> {
    await AsyncStorage.removeItem(DEVICE_USER_ID_KEY);
  }

  /**
   * Force regenerate device user ID (for fixing old format IDs)
   */
  static async regenerateDeviceUserId(): Promise<void> {
    // Clear old device ID
    await AsyncStorage.removeItem(DEVICE_USER_ID_KEY);

    // Generate new UUID
    const newDeviceUserId = await this.generateDeviceUserId();
    await AsyncStorage.setItem(DEVICE_USER_ID_KEY, newDeviceUserId);

    console.log("New device user ID generated:", newDeviceUserId);
  }

  /**
   * Check if current device ID is in old format and regenerate if needed
   */
  static async fixOldFormatDeviceId(): Promise<void> {
    const currentDeviceId = await this.getStoredDeviceUserId();

    if (currentDeviceId && currentDeviceId.startsWith("device_")) {
      console.log("Old format device ID detected, regenerating...");
      await this.regenerateDeviceUserId();
    }
  }
}
