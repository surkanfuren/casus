import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { User, UserService } from "../services/UserService";

const USER_STORAGE_KEY = "@casus_user";

// Helper function to store user data without profile_photo to avoid caching issues
const storeUserWithoutPhoto = async (user: User) => {
  const userWithoutPhoto = {
    id: user.id,
    name: user.name,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
  await AsyncStorage.setItem(
    USER_STORAGE_KEY,
    JSON.stringify(userWithoutPhoto)
  );
};

export default function Profile() {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [existingUser, setExistingUser] = useState<User | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshUserData = async () => {
        try {
          const user = await UserService.getCurrentUser();
          if (user) {
            setExistingUser(user);
            setName(user.name);
            setProfilePhoto(user.profile_photo || null);
            console.log(
              "[DEBUG] useFocusEffect - profilePhoto refreshed to:",
              user.profile_photo || null
            );
          } else {
            console.log("[DEBUG] useFocusEffect - no user found");
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      };

      refreshUserData();
    }, [])
  );

  const initializeUser = async () => {
    try {
      // First, fix old format device IDs if needed
      await UserService.fixOldFormatDeviceId();

      // Then try to load existing user from database (always fetch fresh data)
      const user = await UserService.getCurrentUser();
      if (user) {
        setExistingUser(user);
        setName(user.name);
        setProfilePhoto(user.profile_photo || null);
        console.log(
          "[DEBUG] initializeUser - profilePhoto set to:",
          user.profile_photo || null
        );
      } else {
        console.log("[DEBUG] initializeUser - no user found");
      }
    } catch (error) {
      console.error("Error initializing user:", error);
    }
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "İzin Gerekli",
        "Fotoğraf seçebilmek için galeri erişim iznine ihtiyacımız var."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
      console.log(
        "[DEBUG] pickImage - profilePhoto set to:",
        result.assets[0].uri
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "İzin Gerekli",
        "Fotoğraf çekebilmek için kamera erişim iznine ihtiyacımız var."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfilePhoto(result.assets[0].uri);
      console.log(
        "[DEBUG] takePhoto - profilePhoto set to:",
        result.assets[0].uri
      );
    }
  };

  const showPhotoOptions = () => {
    console.log(
      "[DEBUG] showPhotoOptions - current profilePhoto:",
      profilePhoto
    );
    Alert.alert("Profil Fotoğrafı", "Fotoğrafınızı nasıl eklemek istersiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Galeriden Seç", onPress: pickImage },
      { text: "Fotoğraf Çek", onPress: takePhoto },
      ...(profilePhoto
        ? [
            {
              text: "Fotoğrafı Kaldır",
              onPress: () => {
                setProfilePhoto(null);
                console.log(
                  "[DEBUG] showPhotoOptions - profilePhoto removed, set to null"
                );
              },
              style: "destructive" as const,
            },
          ]
        : []),
    ]);
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Hata", "Adınızı giriniz");
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert("Hata", "Adınız en az 2 karakter olmalıdır");
      return;
    }

    setIsCreating(true);
    try {
      // Create or update user for this device
      const user = await UserService.createOrUpdateUser(
        name.trim(),
        profilePhoto || undefined
      );

      // Store user data locally (without profile_photo to avoid caching)
      await storeUserWithoutPhoto(user);

      // Navigate to main screen
      router.push("/");
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Profil kaydedilemedi");
      console.error("Profile save error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const updateProfilePhoto = async () => {
    if (!existingUser || !profilePhoto) return;

    console.log(
      "[DEBUG] updateProfilePhoto - starting with profilePhoto:",
      profilePhoto
    );

    // Ensure we're only uploading local file URIs, not remote URLs
    if (
      profilePhoto.startsWith("http://") ||
      profilePhoto.startsWith("https://")
    ) {
      console.error("Attempted to upload remote URL:", profilePhoto);
      Alert.alert("Hata", "Lütfen yeni bir fotoğraf seçin");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      console.log("Uploading photo from URI:", profilePhoto);
      await UserService.updateProfilePhoto(existingUser.id, profilePhoto);

      // Refetch fresh user data from database to get the latest profile photo URL
      const freshUser = await UserService.getCurrentUser();
      if (freshUser) {
        setExistingUser(freshUser);
        setProfilePhoto(freshUser.profile_photo || null);
        console.log(
          "[DEBUG] updateProfilePhoto - after update, profilePhoto set to:",
          freshUser.profile_photo || null
        );

        // Update local storage (without profile_photo to avoid caching)
        await storeUserWithoutPhoto(freshUser);
      }

      Alert.alert("Başarılı", "Profil fotoğrafınız güncellendi");
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Profil fotoğrafı güncellenemedi");
      console.error("Profile photo update error:", error);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removeProfilePhoto = async () => {
    if (!existingUser) return;

    Alert.alert(
      "Profil Fotoğrafını Kaldır",
      "Profil fotoğrafınızı kaldırmak istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: async () => {
            setIsUploadingPhoto(true);
            try {
              await UserService.removeProfilePhoto(existingUser.id);

              // Refetch fresh user data from database to ensure clean state
              const freshUser = await UserService.getCurrentUser();
              if (freshUser) {
                setExistingUser(freshUser);
                setProfilePhoto(freshUser.profile_photo || null);
                console.log(
                  "[DEBUG] removeProfilePhoto - after removal, profilePhoto set to:",
                  freshUser.profile_photo || null
                );

                // Update local storage (without profile_photo to avoid caching)
                await storeUserWithoutPhoto(freshUser);
              }

              Alert.alert("Başarılı", "Profil fotoğrafınız kaldırıldı");
            } catch (error: any) {
              Alert.alert(
                "Hata",
                error.message || "Profil fotoğrafı kaldırılamadı"
              );
              console.error("Profile photo removal error:", error);
            } finally {
              setIsUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  // Check if photo was changed and needs to be saved
  // Only consider it changed if we have a local file URI that's different from stored URL
  const hasPhotoChanged =
    profilePhoto &&
    profilePhoto !== (existingUser?.profile_photo || null) &&
    !profilePhoto.startsWith("http://") &&
    !profilePhoto.startsWith("https://");

  console.log("[DEBUG] render - current profilePhoto:", profilePhoto);
  console.log(
    "[DEBUG] render - existingUser profile_photo:",
    existingUser?.profile_photo || null
  );
  console.log("[DEBUG] render - hasPhotoChanged:", hasPhotoChanged);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>casus</Text>
            <Text style={styles.subtitle}>
              {existingUser
                ? "Profilinizi güncelleyin"
                : "Profilinizi oluşturun"}
            </Text>
          </View>

          <Card>
            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={showPhotoOptions}
              >
                {profilePhoto ? (
                  <>
                    {console.log(
                      "[DEBUG] rendering Image with URI:",
                      profilePhoto
                    )}
                    {(() => {
                      const cacheBustedUri =
                        profilePhoto +
                        (profilePhoto.includes("?") ? "&" : "?") +
                        "t=" +
                        Date.now();
                      console.log(
                        "[DEBUG] final cache-busted URI:",
                        cacheBustedUri
                      );
                      return (
                        <Image
                          source={{ uri: cacheBustedUri }}
                          style={styles.profilePhoto}
                          contentFit="cover"
                          cachePolicy="none"
                          recyclingKey={profilePhoto + "_" + Date.now()}
                        />
                      );
                    })()}
                  </>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Text style={styles.photoPlaceholderText}>
                      Fotoğraf{"\n"}Ekle
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {existingUser && hasPhotoChanged && (
                <Button
                  title={
                    isUploadingPhoto ? "Kaydediliyor..." : "Fotoğrafı Kaydet"
                  }
                  onPress={updateProfilePhoto}
                  disabled={isUploadingPhoto}
                  size="small"
                  style={styles.photoButton}
                />
              )}

              {existingUser &&
                existingUser.profile_photo &&
                !hasPhotoChanged && (
                  <Button
                    title="Fotoğrafı Kaldır"
                    onPress={removeProfilePhoto}
                    disabled={isUploadingPhoto}
                    variant="danger"
                    size="small"
                    style={styles.photoButton}
                  />
                )}
            </View>

            <Input
              label="Adınız"
              value={name}
              onChangeText={setName}
              placeholder="Adınızı giriniz"
              autoCapitalize="words"
              maxLength={20}
            />

            <Button
              title={
                isCreating
                  ? "Kaydediliyor..."
                  : existingUser
                  ? "Güncelle"
                  : "Devam Et"
              }
              onPress={saveProfile}
              disabled={isCreating || !name.trim()}
              size="large"
              style={styles.continueButton}
            />
          </Card>

          <View style={styles.info}>
            <Text style={styles.infoText}>
              {existingUser
                ? "Bu cihaza kayıtlı profil bilgilerinizi güncelleyebilirsiniz."
                : "Bu bilgilerle oyunlara katılacaksınız. Daha sonra değiştirebilirsiniz."}
            </Text>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    justifyContent: "flex-start",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "#e5e7eb",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  photoPlaceholderText: {
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  photoButton: {
    marginTop: 4,
  },
  continueButton: {
    marginTop: 8,
  },
  info: {
    alignItems: "center",
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
