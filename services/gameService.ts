import { Player, Room } from "../types";
import { supabase } from "./supabase";
import { User, UserService } from "./UserService";

// Spyfall locations
const SPYFALL_LOCATIONS = [
  "Airplane",
  "Bank",
  "Beach",
  "Broadway Theater",
  "Casino",
  "Cathedral",
  "Circus Tent",
  "Corporate Party",
  "Crusader Army",
  "Day Spa",
  "Embassy",
  "Hospital",
  "Hotel",
  "Military Base",
  "Movie Studio",
  "Ocean Liner",
  "Passenger Train",
  "Pirate Ship",
  "Polar Station",
  "Police Station",
  "Restaurant",
  "School",
  "Service Station",
  "Space Station",
  "Submarine",
  "Supermarket",
  "Temple",
  "University",
  "World War II Squad",
  "Zoo",
  "Amusement Park",
  "Art Museum",
  "Bakery",
  "Barbershop",
  "Bowling Alley",
  "Cafe",
  "Campground",
  "Castle",
  "Cave",
  "Cemetery",
  "Church",
  "Circus",
  "Comedy Club",
  "Concert Hall",
  "Construction Site",
  "Courtroom",
  "Dentist",
  "Desert",
  "Factory",
  "Farm",
  "Fire Station",
  "Fishing Village",
  "Forest",
  "Garage",
  "Gas Station",
  "Gymnasium",
  "Harbor",
  "Haunted House",
  "Jail",
  "Jazz Club",
  "Junkyard",
  "Laboratory",
  "Library",
  "Lighthouse",
  "Mall",
  "Mansion",
  "Marina",
  "Market",
  "Monastery",
  "Morgue",
  "Motel",
  "Mountain",
  "Newsroom",
  "Office",
  "Opera House",
  "Orphanage",
  "Park",
  "Pharmacy",
  "Playground",
  "Prison",
  "Pub",
  "Quarry",
  "Race Track",
  "Radio Station",
  "Ranch",
  "Retirement Home",
  "Rooftop",
  "Ruins",
  "Salon",
  "Sawmill",
  "Ski Resort",
  "Skyscraper",
  "Stadium",
  "Street",
  "Strip Club",
  "Tavern",
  "Theater",
  "Toy Store",
  "Train Station",
  "Tunnel",
  "Vineyard",
  "Warehouse",
  "Wedding",
  "Workshop",
];

function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export class GameService {
  /**
   * Get current user from UserService
   */
  private static async getCurrentUser(): Promise<User> {
    const user = await UserService.getCurrentUser();
    if (!user) {
      throw new Error("No user profile found");
    }
    return user;
  }

  /**
   * Create a new game room
   */
  static async createRoom(): Promise<{ room: Room; player: Player }> {
    const user = await this.getCurrentUser();
    const inviteCode = generateInviteCode();

    // Create player for the host
    const hostPlayer: Player = {
      id: `player_${Date.now()}`,
      userId: user.id,
      name: user.name,
      profilePhoto: user.profile_photo,
      isHost: true,
      isSpy: false,
      hasVoted: false,
    };

    const roomData = {
      invite_code: inviteCode,
      host_id: user.id,
      players: [hostPlayer],
      game_state: "waiting",
      current_word: null,
      timer: 480, // 8 minutes in seconds
    };

    const { data, error } = await supabase
      .from("rooms")
      .insert([roomData])
      .select()
      .single();

    if (error) {
      console.error("Error creating room:", error);
      throw new Error("Failed to create room");
    }

    const room: Room = {
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

    return { room, player: hostPlayer };
  }

  /**
   * Join an existing room
   */
  static async joinRoom(
    inviteCode: string
  ): Promise<{ room: Room; player: Player }> {
    const user = await this.getCurrentUser();

    // Get room data
    const { data: roomData, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (fetchError || !roomData) {
      throw new Error("Room not found");
    }

    // Check if room is full
    if (roomData.players.length >= 10) {
      throw new Error("Room is full");
    }

    // Check if game has already started
    if (roomData.game_state !== "waiting") {
      throw new Error("Game has already started");
    }

    // Check if user is already in the room
    const existingPlayer = roomData.players.find(
      (p: Player) => p.userId === user.id
    );
    if (existingPlayer) {
      const room: Room = {
        id: roomData.id,
        inviteCode: roomData.invite_code,
        hostId: roomData.host_id,
        players: roomData.players,
        gameState: roomData.game_state,
        currentWord: roomData.current_word,
        timer: roomData.timer,
        createdAt: roomData.created_at,
        updatedAt: roomData.updated_at,
      };
      return { room, player: existingPlayer };
    }

    // Create new player
    const newPlayer: Player = {
      id: `player_${Date.now()}_${user.id}`,
      userId: user.id,
      name: user.name,
      profilePhoto: user.profile_photo,
      isHost: false,
      isSpy: false,
      hasVoted: false,
    };

    // Add player to room
    const updatedPlayers = [...roomData.players, newPlayer];

    const { data: updatedRoom, error: updateError } = await supabase
      .from("rooms")
      .update({
        players: updatedPlayers,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomData.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error joining room:", updateError);
      throw new Error("Failed to join room");
    }

    const room: Room = {
      id: updatedRoom.id,
      inviteCode: updatedRoom.invite_code,
      hostId: updatedRoom.host_id,
      players: updatedRoom.players,
      gameState: updatedRoom.game_state,
      currentWord: updatedRoom.current_word,
      timer: updatedRoom.timer,
      createdAt: updatedRoom.created_at,
      updatedAt: updatedRoom.updated_at,
    };

    return { room, player: newPlayer };
  }

  /**
   * Update room timer (host only)
   */
  static async updateRoomTimer(
    roomId: string,
    hostId: string,
    timerMinutes: number
  ): Promise<void> {
    const user = await this.getCurrentUser();

    if (user.id !== hostId) {
      throw new Error("Only the host can change the timer");
    }

    const timerSeconds = timerMinutes * 60;

    try {
      // Get room data first to verify host
      const { data: roomData, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (fetchError || !roomData) {
        throw new Error("Room not found");
      }

      if (roomData.host_id !== user.id) {
        throw new Error("Only the host can change the timer");
      }

      if (roomData.game_state !== "waiting") {
        throw new Error("Cannot change timer after game has started");
      }

      // Update room timer
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          timer: timerSeconds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", roomId);

      if (updateError) {
        console.error("Error updating room timer:", updateError);
        throw new Error("Failed to update timer");
      }

      console.log("Timer updated successfully to", timerMinutes, "minutes");
    } catch (error) {
      console.error("Error in updateRoomTimer:", error);
      throw error;
    }
  }

  /**
   * Start the game
   */
  static async startGame(roomId: string, hostId: string): Promise<void> {
    const user = await this.getCurrentUser();

    if (user.id !== hostId) {
      throw new Error("Only the host can start the game");
    }

    // Get room data
    const { data: roomData, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (fetchError || !roomData) {
      throw new Error("Room not found");
    }

    if (roomData.players.length < 3) {
      throw new Error("At least 3 players are required to start the game");
    }

    // Select random spy
    const players = [...roomData.players];
    const spyIndex = Math.floor(Math.random() * players.length);
    const updatedPlayers = players.map((player, index) => ({
      ...player,
      isSpy: index === spyIndex,
      hasVoted: false,
    }));

    // Select random location
    const randomLocation =
      SPYFALL_LOCATIONS[Math.floor(Math.random() * SPYFALL_LOCATIONS.length)];

    // Update room
    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        players: updatedPlayers,
        game_state: "playing",
        current_word: randomLocation,
        timer: 480, // Reset timer to 8 minutes
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (updateError) {
      console.error("Error starting game:", updateError);
      throw new Error("Failed to start game");
    }
  }

  /**
   * Leave a room
   */
  static async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const user = await this.getCurrentUser();

    try {
      // Get room data
      const { data: roomData, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .single();

      if (fetchError || !roomData) {
        console.log("Room not found or already deleted:", fetchError);
        return; // Room doesn't exist, that's fine
      }

      // Validate players array exists
      if (!roomData.players || !Array.isArray(roomData.players)) {
        console.warn("Invalid players data in room:", roomData);
        return;
      }

      // Find the player
      const playerToRemove = roomData.players.find(
        (p: Player) => p.id === playerId
      );
      if (!playerToRemove) {
        console.log("Player not found in room, might have already left");
        return;
      }

      if (playerToRemove.userId !== user.id) {
        throw new Error("You can only leave as yourself");
      }

      // Remove player from room
      const updatedPlayers = roomData.players.filter(
        (p: Player) => p.id !== playerId
      );

      if (updatedPlayers.length === 0) {
        // Delete room if empty
        console.log("Deleting empty room:", roomId);
        const { error: deleteError } = await supabase
          .from("rooms")
          .delete()
          .eq("id", roomId);

        if (deleteError) {
          console.error("Error deleting room:", deleteError);
        }
      } else {
        // If the leaving player was the host, assign a new host
        let finalPlayers = updatedPlayers;
        if (playerToRemove.isHost && updatedPlayers.length > 0) {
          finalPlayers = updatedPlayers.map((p: Player, index: number) => ({
            ...p,
            isHost: index === 0,
          }));
        }

        // Update room
        console.log(
          "Updating room with remaining players:",
          finalPlayers.length
        );
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            players: finalPlayers,
            host_id:
              finalPlayers.find((p: Player) => p.isHost)?.userId ||
              roomData.host_id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roomId);

        if (updateError) {
          console.error("Error updating room:", updateError);
          throw new Error("Failed to leave room");
        }
      }
    } catch (error) {
      console.error("Error in leaveRoom:", error);
      throw error;
    }
  }

  /**
   * Submit a vote
   */
  static async submitVote(
    roomId: string,
    playerId: string,
    votedPlayerId: string
  ): Promise<void> {
    const user = await this.getCurrentUser();

    // Get room data
    const { data: roomData, error: fetchError } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", roomId)
      .single();

    if (fetchError || !roomData) {
      throw new Error("Room not found");
    }

    // Find the voting player
    const votingPlayer = roomData.players.find(
      (p: Player) => p.id === playerId
    );
    if (!votingPlayer || votingPlayer.userId !== user.id) {
      throw new Error("Invalid player");
    }

    // Update player's vote
    const updatedPlayers = roomData.players.map((p: Player) => {
      if (p.id === playerId) {
        return { ...p, hasVoted: true };
      }
      return p;
    });

    // Check if all players have voted
    const allVoted = updatedPlayers.every((p: Player) => p.hasVoted);
    const newGameState = allVoted ? "finished" : "voting";

    // Update room
    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        players: updatedPlayers,
        game_state: newGameState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (updateError) {
      console.error("Error submitting vote:", updateError);
      throw new Error("Failed to submit vote");
    }
  }

  /**
   * Subscribe to room updates
   */
  static subscribeToRoom(roomId: string, callback: (room: Room) => void) {
    const subscription = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          console.log("Raw subscription payload:", payload);

          if (payload.new) {
            const data = payload.new as any;
            console.log("Processing room data:", data);

            // Validate that we have the essential data
            if (!data.id || !data.invite_code || !data.players) {
              console.warn("Incomplete room data received:", data);
              return;
            }

            const room: Room = {
              id: data.id,
              inviteCode: data.invite_code,
              hostId: data.host_id,
              players: data.players || [],
              gameState: data.game_state || "waiting",
              currentWord: data.current_word,
              timer: data.timer || 480,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };

            console.log("Mapped room object:", room);
            callback(room);
          } else if (payload.old && payload.eventType === "DELETE") {
            // Room was deleted, handle this case
            console.log("Room was deleted:", payload.old);
            // Don't call callback for deleted rooms
          }
        }
      )
      .subscribe();

    return subscription;
  }
}
