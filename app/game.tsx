import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Timer } from "../components/Timer";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { GameService } from "../services/gameService";
import { supabase } from "../services/supabase";
import { Player, Room } from "../types";

export default function Game() {
  const { roomId, playerId } = useLocalSearchParams<{
    roomId: string;
    playerId: string;
  }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showVoting, setShowVoting] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [loadingOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!roomId || !playerId) return;

    console.log(
      "Setting up game subscription for room:",
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
          console.error("Error fetching game room:", error);
          Alert.alert("Error", "Could not load game data");
          return;
        }

        console.log("Game room data fetched:", data);
        setRoom(data);
      } catch (err) {
        console.error("Game room fetch error:", err);
        Alert.alert("Error", "Could not connect to game");
      }
    };

    fetchRoomData();

    // Subscribe to room updates
    const subscription = GameService.subscribeToRoom(roomId, (updatedRoom) => {
      console.log("Game room update received:", updatedRoom);

      // Validate room data before processing
      if (!updatedRoom || !updatedRoom.id || !updatedRoom.players) {
        console.warn("Invalid game room data received, ignoring:", updatedRoom);
        return;
      }

      setRoom(updatedRoom);

      // If game finished, navigate to results
      if (updatedRoom.gameState === "finished") {
        router.push({
          pathname: "/results",
          params: {
            roomId: updatedRoom.id,
            playerId: playerId,
          },
        });
      }
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

  const handleTimeUp = () => {
    Alert.alert(
      "Time's Up!",
      "Time has run out! The spy wins if they haven't been identified.",
      [
        {
          text: "OK",
          onPress: () => {
            router.push({
              pathname: "/results",
              params: {
                roomId: roomId,
                playerId: playerId,
              },
            });
          },
        },
      ]
    );
  };

  const startVoting = () => {
    setShowVoting(true);
  };

  const submitVote = async () => {
    if (!room || !currentPlayer || !selectedVote) return;

    setIsVoting(true);
    try {
      await GameService.submitVote(room.id, currentPlayer.id, selectedVote);
      setShowVoting(false);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit vote");
    } finally {
      setIsVoting(false);
    }
  };

  // Filter out current player for voting
  const otherPlayers =
    room?.players?.filter((p) => p.id !== currentPlayer?.id) || [];

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
            <Text style={styles.loadingTitle}>Oyun Yükleniyor</Text>
            <Text style={styles.loadingSubtitle}>
              Oyun verileriniz hazırlanıyor, lütfen bekleyiniz...
            </Text>
          </View>

          {/* Game Status Card */}
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusTitle}>Oyun Durumu</Text>
              <View style={styles.statusIndicator}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Yükleniyor</Text>
              </View>
            </View>

            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Oyun Tipi</Text>
                <Text style={styles.statusValue}>Spyfall</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Süre</Text>
                <Text style={styles.statusValue}>8 dakika</Text>
              </View>
            </View>
          </Card>

          {/* Game Rules Card */}
          <Card style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Oyun Kuralları</Text>
            <View style={styles.rulesContent}>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleIcon}>🕵️</Text>
                <Text style={styles.ruleText}>Casusları bul</Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleIcon}>🤐</Text>
                <Text style={styles.ruleText}>Lokasyonu gizle</Text>
              </View>
              <View style={styles.ruleItem}>
                <Text style={styles.ruleIcon}>🗳️</Text>
                <Text style={styles.ruleText}>Oylama yap</Text>
              </View>
            </View>
          </Card>

          {/* Action Button */}
          <View style={styles.loadingActions}>
            <Button
              title="Lobiye Dön"
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <Timer
          initialTime={room.timer}
          onTimeUp={handleTimeUp}
          isRunning={room.gameState === "playing"}
        />

        <Card style={styles.locationCard}>
          <Text style={styles.locationTitle}>
            {currentPlayer.isSpy ? "You are the SPY!" : "Location"}
          </Text>
          <Text style={styles.locationText}>
            {currentPlayer.isSpy
              ? "Figure out the location without being caught!"
              : room.currentWord}
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>
            Players ({room.players?.length || 0})
          </Text>
          {room.players?.map((player) => (
            <View key={player.id} style={styles.playerItem}>
              <View style={styles.playerContent}>
                <View style={styles.playerPhotoContainer}>
                  {player.profilePhoto ? (
                    <Image
                      source={{ uri: player.profilePhoto }}
                      style={styles.playerPhoto}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.playerPhotoPlaceholder}>
                      <Text style={styles.playerPhotoInitial}>
                        {player.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>
                    {player.name}
                    {player.id === currentPlayer.id && " (You)"}
                    {player.hasVoted && " ✓"}
                  </Text>
                </View>
              </View>
            </View>
          )) || []}
        </Card>

        {!showVoting && (
          <Button
            title="Start Voting"
            onPress={startVoting}
            size="large"
            style={styles.button}
          />
        )}

        {showVoting && (
          <Card>
            <Text style={styles.sectionTitle}>Vote for the Spy</Text>
            <Text style={styles.voteInstructions}>
              Select who you think is the spy:
            </Text>
            {otherPlayers.map((player) => (
              <Button
                key={player.id}
                title={player.name}
                onPress={() => setSelectedVote(player.id)}
                variant={selectedVote === player.id ? "primary" : "secondary"}
                style={styles.voteButton}
              />
            ))}
            <Button
              title={isVoting ? "Submitting Vote..." : "Submit Vote"}
              onPress={submitVote}
              disabled={!selectedVote || isVoting}
              size="large"
              style={styles.button}
            />
          </Card>
        )}
      </ScrollView>
    </View>
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
  debugText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    color: "#9ca3af",
  },
  locationCard: {
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  locationText: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  playerItem: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  playerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerPhotoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
  },
  playerPhoto: {
    width: "100%",
    height: "100%",
  },
  playerPhotoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  playerPhotoInitial: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#6b7280",
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  voteInstructions: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  voteButton: {
    marginBottom: 8,
  },
  button: {
    marginTop: 16,
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
    marginBottom: 20,
  },
  loadingIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 5,
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
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statusItem: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  rulesCard: {
    marginBottom: 20,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  rulesContent: {
    marginTop: 10,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ruleIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  ruleText: {
    fontSize: 16,
    color: "#374151",
  },
  loadingActions: {
    width: "100%",
    marginTop: 20,
  },
  backButton: {
    width: "100%",
  },
});
