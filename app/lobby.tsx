import * as Clipboard from "expo-clipboard";
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
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Toast } from "../components/ui/Toast";
import { GameService } from "../services/gameService";
import { supabase } from "../services/supabase";
import { Player, Room } from "../types";

export default function Lobby() {
  const { roomId, playerId, inviteCode } = useLocalSearchParams<{
    roomId: string;
    playerId: string;
    inviteCode: string;
  }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loadingOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (!roomId || !playerId) {
      console.error("Missing roomId or playerId");
      router.push("/");
      return;
    }

    console.log("Setting up lobby for room:", roomId, "player:", playerId);

    // First, fetch the room data directly
    const fetchRoomData = async () => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (error) {
          console.error("Error fetching lobby room:", error);
          Alert.alert("Hata", "Oda verisi yüklenemedi");
          router.push("/");
          return;
        }

        console.log("Lobby room data fetched:", data);
        const roomData: Room = {
          id: data.id,
          inviteCode: data.invite_code,
          hostId: data.host_id,
          players: data.players,
          gameState: data.game_state,
          currentWord: data.current_word,
          timer: data.timer,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        setRoom(roomData);

        // Find current player in the room
        const player = roomData.players.find((p) => p.id === playerId);
        setCurrentPlayer(player || null);

        // If game already started, navigate to game screen
        if (roomData.gameState === "playing") {
          router.push({
            pathname: "/game",
            params: {
              roomId: roomData.id,
              playerId: playerId,
            },
          });
        }
      } catch (err) {
        console.error("Lobby room fetch error:", err);
        Alert.alert("Hata", "Odaya bağlanılamadı");
        router.push("/");
      }
    };

    fetchRoomData();

    // Subscribe to room updates
    const subscription = GameService.subscribeToRoom(roomId, (updatedRoom) => {
      console.log("Room update received:", updatedRoom);

      // Validate room data before processing
      if (!updatedRoom || !updatedRoom.id || !updatedRoom.players) {
        console.warn("Invalid room data received, ignoring:", updatedRoom);
        return;
      }

      setRoom(updatedRoom);

      // Find current player in the updated room
      const player = updatedRoom.players.find((p) => p.id === playerId);
      if (!player) {
        console.warn("Player not found in room, might have been removed");
        // Player might have been removed from the room
        Alert.alert("Bilgi", "Odadan çıkarıldınız");
        router.push("/");
        return;
      }

      setCurrentPlayer(player);

      // If game started, navigate to game screen
      if (updatedRoom.gameState === "playing") {
        router.push({
          pathname: "/game",
          params: {
            roomId: updatedRoom.id,
            playerId: playerId,
          },
        });
      }
    });

    // Clean up subscription on unmount
    return () => {
      console.log("Cleaning up lobby subscription");
      subscription.unsubscribe();
    };
  }, [roomId, playerId]);

  const startGame = async () => {
    if (!room || !currentPlayer?.isHost) {
      Alert.alert("Hata", "Sadece oda sahibi oyunu başlatabilir");
      return;
    }

    if (!room.players || room.players.length < 3) {
      Alert.alert("Hata", "Oyun başlatmak için en az 3 oyuncu gerekli");
      return;
    }

    setIsStarting(true);
    try {
      await GameService.startGame(room.id, room.hostId);
    } catch (error: any) {
      Alert.alert("Hata", error.message || "Oyun başlatılamadı");
      console.error("Start game error:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const leaveRoom = async () => {
    if (!room || !currentPlayer) return;

    setIsLeaving(true);
    try {
      await GameService.leaveRoom(room.id, currentPlayer.id);
      console.log("Successfully left room");
      router.push("/");
    } catch (error: any) {
      console.error("Leave room error:", error);
      Alert.alert("Hata", error.message || "Odadan çıkılırken bir hata oluştu");
      // Still try to navigate back in case of error
      router.push("/");
    } finally {
      setIsLeaving(false);
    }
  };

  const copyInviteCode = async () => {
    if (inviteCode) {
      try {
        await Clipboard.setStringAsync(inviteCode);
        setToastMessage("Oda kodu kopyalandı!");
        setShowToast(true);
      } catch (error) {
        console.error("Failed to copy invite code:", error);
        setToastMessage("Oda kodu kopyalanamadı");
        setShowToast(true);
      }
    }
  };

  const hideToast = () => {
    setShowToast(false);
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
            <Text style={styles.loadingTitle}>Oyun Odasına Bağlanılıyor</Text>
            <Text style={styles.loadingSubtitle}>
              Lütfen bekleyiniz, odaya katılım işleminiz tamamlanıyor...
            </Text>
          </View>

          {/* Connection Info Card */}
          <Card style={styles.connectionCard}>
            <View style={styles.connectionHeader}>
              <Text style={styles.connectionTitle}>Bağlantı Bilgileri</Text>
              <View style={styles.connectionStatus}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Bağlanıyor</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Oda Kodu</Text>
                <Text style={styles.infoValue}>{inviteCode}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Oyun Tipi</Text>
                <Text style={styles.infoValue}>Spyfall</Text>
              </View>
            </View>
          </Card>

          {/* Game Info Card */}
          <Card style={styles.gameInfoCard}>
            <Text style={styles.gameInfoTitle}>Oyun Hakkında</Text>
            <View style={styles.gameInfoContent}>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoIcon}>👥</Text>
                <Text style={styles.gameInfoText}>3-10 oyuncu</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoIcon}>⏱️</Text>
                <Text style={styles.gameInfoText}>8 dakika süre</Text>
              </View>
              <View style={styles.gameInfoItem}>
                <Text style={styles.gameInfoIcon}>🎯</Text>
                <Text style={styles.gameInfoText}>Casusları bul</Text>
              </View>
            </View>
          </Card>

          {/* Action Button */}
          <View style={styles.loadingActions}>
            <Button
              title="Ana Sayfaya Dön"
              onPress={() => router.push("/")}
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
    <SafeAreaView style={styles.container}>
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={hideToast}
        duration={2500}
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Oyun Lobisi</Text>
          <Text style={styles.subtitle}>Oda Kodu: {inviteCode}</Text>
          <Button
            title="Oda Kodunu Kopyala"
            onPress={copyInviteCode}
            variant="secondary"
            size="small"
            style={styles.shareButton}
          />
        </View>

        <Card>
          <Text style={styles.sectionTitle}>
            Oyuncular ({room.players?.length || 0})
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
                    {player.isHost && " (Oda Sahibi)"}
                    {player.id === currentPlayer.id && " (Sen)"}
                  </Text>
                </View>
              </View>
            </View>
          )) || []}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Oyun Bilgileri</Text>
          <Text style={styles.gameInfo}>
            • Oyuncular: {room.players?.length || 0}/10{"\n"}• Süre: 8 dakika
            {"\n"}• Lokasyon: Oyun başlayınca açıklanacak
          </Text>
        </Card>

        <View style={styles.buttonContainer}>
          {currentPlayer.isHost ? (
            <Button
              title={isStarting ? "Oyun Başlatılıyor..." : "Oyunu Başlat"}
              onPress={startGame}
              disabled={isStarting || !room.players || room.players.length < 3}
              size="large"
              style={styles.button}
            />
          ) : (
            <Text style={styles.waitingText}>
              Oda sahibinin oyunu başlatması bekleniyor...
            </Text>
          )}

          <Button
            title={isLeaving ? "Çıkılıyor..." : "Odadan Ayrıl"}
            onPress={leaveRoom}
            disabled={isLeaving}
            variant="danger"
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
  debugText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    color: "#9ca3af",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#3b82f6",
    fontWeight: "600",
    marginBottom: 12,
  },
  shareButton: {
    marginTop: 8,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 16,
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
  gameInfo: {
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
  waitingText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 20,
  },
  connectionCard: {
    marginBottom: 20,
  },
  connectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  connectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4f46e5",
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    color: "#6b7280",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "48%", // Two items per row
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  gameInfoCard: {
    marginTop: 20,
  },
  gameInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  gameInfoContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  gameInfoItem: {
    alignItems: "center",
    marginHorizontal: 10,
    marginBottom: 10,
  },
  gameInfoIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  gameInfoText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  loadingActions: {
    marginTop: 20,
  },
  backButton: {
    width: "100%",
  },
});
