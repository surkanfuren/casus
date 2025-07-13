import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { GameService } from "../services/gameService";

export default function JoinRoom() {
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const joinRoom = async () => {
    if (!inviteCode.trim()) {
      Alert.alert("Hata", "Oda kodunu giriniz");
      return;
    }

    setIsJoining(true);
    try {
      const { room, player } = await GameService.joinRoom(
        inviteCode.trim().toUpperCase()
      );

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
      Alert.alert("Hata", error.message || "Odaya katılınamadı");
      console.error("Join room error:", error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Odaya Katıl</Text>
          </View>

          <Card>
            <Input
              label="Oda Kodu"
              value={inviteCode}
              onChangeText={setInviteCode}
              placeholder="Oda kodunu giriniz"
              autoCapitalize="characters"
              maxLength={6}
            />

            <Button
              title={isJoining ? "Odaya Katılıyor..." : "Odaya Katıl"}
              onPress={joinRoom}
              disabled={isJoining || !inviteCode.trim()}
              size="large"
              style={styles.joinButton}
            />
          </Card>
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
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  joinButton: {
    marginTop: 8,
  },
});
