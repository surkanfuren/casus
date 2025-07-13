import * as FileSystem from "expo-file-system";
import { supabase } from "./supabase";

export class PhotoService {
  private static readonly BUCKET_NAME = "profile-photos";
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Upload a profile photo to Supabase storage
   */
  static async uploadProfilePhoto(
    userId: string,
    imageUri: string
  ): Promise<string> {
    try {
      console.log("PhotoService: Received imageUri:", imageUri);
      console.log("PhotoService: URI type check:", {
        startsWithHttp: imageUri.startsWith("http://"),
        startsWithHttps: imageUri.startsWith("https://"),
        startsWithFile: imageUri.startsWith("file://"),
        actualStart: imageUri.substring(0, 20),
        length: imageUri.length,
        type: typeof imageUri,
      });

      // Temporarily comment out validation to test core logic
      /*
      if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        console.error('PhotoService: Rejecting remote URL:', imageUri);
        throw new Error('Cannot upload remote URL. Please select a local image.');
      }
      */

      console.log("PhotoService: Proceeding with upload...");

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(imageUri);

      if (!fileInfo.exists) {
        throw new Error("Dosya bulunamadı");
      }

      // Check file size
      if (fileInfo.size && fileInfo.size > this.MAX_FILE_SIZE) {
        throw new Error("Dosya boyutu çok büyük (maksimum 5MB)");
      }

      // Generate unique filename
      const fileExtension = imageUri.split(".").pop() || "jpg";
      const fileName = `${userId}/profile.${fileExtension}`;

      console.log("PhotoService: Reading file as base64...");
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("PhotoService: Converting to Uint8Array...");
      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const uint8Array = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }

      console.log("PhotoService: Uploading to Supabase...", fileName);
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, uint8Array, {
          cacheControl: "3600",
          upsert: true, // Replace if exists
          contentType: `image/${fileExtension}`,
        });

      if (error) {
        console.error("Upload error:", error);
        throw new Error("Fotoğraf yüklenemedi");
      }

      console.log("PhotoService: Upload successful, getting public URL...");
      // Get public URL
      const { data: publicData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log("PhotoService: Public URL:", publicData.publicUrl);
      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      throw error;
    }
  }

  /**
   * Delete a profile photo from Supabase storage
   */
  static async deleteProfilePhoto(userId: string): Promise<void> {
    try {
      // List all files for this user
      const { data: files, error: listError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId);

      if (listError) {
        console.error("Error listing files:", listError);
        return;
      }

      if (files && files.length > 0) {
        // Delete all files for this user
        const filesToDelete = files.map((file) => `${userId}/${file.name}`);

        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filesToDelete);

        if (deleteError) {
          console.error("Error deleting files:", deleteError);
        }
      }
    } catch (error) {
      console.error("Error deleting profile photo:", error);
    }
  }

  /**
   * Get the public URL for a profile photo
   */
  static getPublicUrl(fileName: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  /**
   * Check if URI is a local file (not a remote URL)
   */
  static isLocalFileUri(uri: string): boolean {
    return !uri.startsWith("http://") && !uri.startsWith("https://");
  }

  /**
   * Check if image URI is valid
   */
  static isValidImageUri(uri: string): boolean {
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"];
    const extension = uri.split(".").pop()?.toLowerCase();
    return imageExtensions.includes(extension || "");
  }
}
