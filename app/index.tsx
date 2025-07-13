import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { GameService } from "../services/gameService";
import { User } from "../services/UserService";

const USER_STORAGE_KEY = "@casus_user";

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        // No user profile found, redirect to profile creation
        router.push("/profile");
        return;
      }
    } catch (error) {
      console.error("Error checking user profile:", error);
      router.push("/profile");
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const createRoom = async () => {
    setIsCreating(true);
    try {
      const { room, player } = await GameService.createRoom();

      // Navigate to lobby with room and player data
      router.push({
        pathname: "/lobby",
        params: {
          roomId: room.id,
          playerId: player.id,
          inviteCode: room.inviteCode,
        },
      });
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Oda oluşturulamadı");
      console.error("Create room error:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loading}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>casus</Text>
          {user && <Text style={styles.welcome}>Hoş geldin, {user.name}!</Text>}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={isCreating ? "Oda Oluşturuluyor..." : "Oluştur"}
            onPress={createRoom}
            disabled={isCreating}
            size="large"
            style={styles.button}
          />

          <Button
            title="Katıl"
            onPress={() => router.push("/join-room")}
            variant="secondary"
            size="large"
            style={styles.button}
          />
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Spyfall Nasıl Oynanır?</Text>
          <Text style={styles.infoText}>
            • Herkes aynı lokasyonu bilir, sadece 1 kişi casus{"\n"}• Sorular
            sorarak casusları bulmaya çalışın{"\n"}• Casus ise lokasyonu tahmin
            etmeye çalışın{"\n"}• Oyunun sonunda oylama yapılır
          </Text>
        </Card>
      </View>
    </SafeAreaView>
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
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  welcome: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
  },
  loading: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 30,
  },
  button: {
    width: "100%",
  },
  profileSection: {
    alignItems: "center",
  },
  infoCard: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#4b5563",
    lineHeight: 24,
    textAlign: "left",
  },
});
