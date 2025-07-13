import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { GameService } from "../services/gameService";
import { supabase } from "../services/supabase";
import { Player, Room } from "../types";

export default function Results() {
  const { roomId, playerId } = useLocalSearchParams<{
    roomId: string;
    playerId: string;
  }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [loadingOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!roomId || !playerId) return;

    console.log(
      "Setting up results subscription for room:",
      roomId,
      "player:",
      playerId
    );

    // First, try to fetch the room data directly
    const fetchRoomData = async () => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (error) {
          console.error("Error fetching results room:", error);
          return;
        }

        console.log("Results room data fetched:", data);
        setRoom(data);
      } catch (err) {
        console.error("Results room fetch error:", err);
      }
    };

    fetchRoomData();

    // Subscribe to room updates
    const subscription = GameService.subscribeToRoom(roomId, (updatedRoom) => {
      console.log("Results room update received:", updatedRoom);

      // Validate room data before processing
      if (!updatedRoom || !updatedRoom.id || !updatedRoom.players) {
        console.warn(
          "Invalid results room data received, ignoring:",
          updatedRoom
        );
        return;
      }

      setRoom(updatedRoom);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, playerId]);

  useEffect(() => {
    if (room && playerId) {
      const player = room.players?.find((p) => p.id === playerId);
      setCurrentPlayer(player || null);
    }
  }, [room, playerId]);

  const goHome = () => {
    router.replace("/");
  };

  const playAgain = () => {
    router.replace("/");
  };

  // Start loading animation
  useEffect(() => {
    if (!room || !currentPlayer) {
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [room, currentPlayer, loadingOpacity]);

  if (!room || !currentPlayer) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[styles.loadingContainer, { opacity: loadingOpacity }]}
        >
          {/* Header Section */}
          <View style={styles.loadingHeader}>
            <View style={styles.loadingIconContainer}>
              <ActivityIndicator size="large" color="#6366f1" />
            </View>
            <Text style={styles.loadingTitle}>Sonuçlar Yükleniyor</Text>
            <Text style={styles.loadingSubtitle}>
              Oyun sonuçları hesaplanıyor, lütfen bekleyiniz...
            </Text>
          </View>

          {/* Results Status Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Oyun Durumu</Text>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Hesaplanıyor</Text>
              </View>
            </View>

            <View style={styles.statusContent}>
              <View style={styles.statusItem}>
                <Text style={styles.statusIcon}>🏆</Text>
                <Text style={styles.statusText}>Kazanan belirleniyor</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusIcon}>📊</Text>
                <Text style={styles.statusText}>Oylar sayılıyor</Text>
              </View>
            </View>
          </Card>

          {/* Game Summary Card */}
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Oyun Özeti</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryIcon}>🎯</Text>
                <Text style={styles.summaryText}>Spyfall tamamlandı</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryIcon}>⏱️</Text>
                <Text style={styles.summaryText}>8 dakika oyun</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryIcon}>🗳️</Text>
                <Text style={styles.summaryText}>Oylama tamamlandı</Text>
              </View>
            </View>
          </Card>

          {/* Action Button */}
          <View style={styles.loadingActions}>
            <Button
              title="Ana Sayfaya Dön"
              onPress={() => router.replace("/")}
              variant="secondary"
              size="large"
              style={styles.backButton}
            />
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  const spy = room.players?.find((p) => p.isSpy);

  // Simplified results logic - check if all players voted
  const allVoted = room.players?.every((p) => p.hasVoted) || false;
  const spyWins = room.timer <= 0 || !allVoted;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Oyun Sonuçları</Text>
          <Text
            style={[styles.result, { color: spyWins ? "#ef4444" : "#10b981" }]}
          >
            {spyWins ? "CASUS KAZANDI!" : "OYUNCULAR KAZANDI!"}
          </Text>
        </View>

        <Card>
          <Text style={styles.sectionTitle}>Oyun Özeti</Text>
          <Text style={styles.summary}>
            Lokasyon: {room.currentWord}
            {"\n"}
            Casus: {spy?.name || "Bilinmiyor"}
            {"\n"}
            Oyuncu Sayısı: {room.players?.length || 0}
            {"\n"}
            Oyun Süresi: {Math.floor((480 - room.timer) / 60)} dakika{" "}
            {(480 - room.timer) % 60} saniye
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Oyuncular</Text>
          {room.players?.map((player) => (
            <View key={player.id} style={styles.playerItem}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>
                  {player.name}
                  {player.isSpy ? " (Casus)" : ""}
                  {player.id === currentPlayer.id ? " (Sen)" : ""}
                </Text>
                <Text style={styles.playerStatus}>
                  {player.hasVoted ? "Oy verdi" : "Oy vermedi"}
                </Text>
              </View>
            </View>
          )) || []}
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            title="Tekrar Oyna"
            onPress={playAgain}
            size="large"
            style={styles.button}
          />
          <Button
            title="Ana Sayfaya Dön"
            onPress={goHome}
            variant="secondary"
            size="large"
            style={styles.button}
          />
        </View>
      </ScrollView>
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
  },
  loading: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 50,
    color: "#6b7280",
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  result: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  summary: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  voteItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  voteName: {
    fontSize: 16,
    color: "#374151",
  },
  noVotes: {
    fontSize: 16,
    color: "#6b7280",
    fontStyle: "italic",
  },
  outcome: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 16,
  },
  button: {
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  loadingIconContainer: {
    marginBottom: 10,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  statusCard: {
    marginBottom: 20,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6366f1",
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statusItem: {
    alignItems: "center",
  },
  statusIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  summaryContent: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loadingActions: {
    marginTop: 20,
    width: "100%",
  },
  backButton: {
    width: "100%",
  },
  playerItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  playerStatus: {
    fontSize: 14,
    color: "#6b7280",
  },
});
