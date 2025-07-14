import { Player, Room } from "../types";
import { supabase } from "./supabase";
import { User, UserService } from "./UserService";

// Spyfall Türkçe kelimeler - Çeşitli kategorilerden kelimeler
const SPYFALL_LOCATIONS = [
  // Yerler
  "Havalimanı",
  "Banka",
  "Plaj",
  "Tiyatro",
  "Kumarhane",
  "Katedral",
  "Çadır",
  "Hastane",
  "Otel",
  "Askeri Üs",
  "Film Stüdyosu",
  "Gemi",
  "Tren",
  "Korsan Gemisi",
  "Kutup İstasyonu",
  "Polis Karakolu",
  "Restoran",
  "Okul",
  "Benzin İstasyonu",
  "Uzay İstasyonu",
  "Denizaltı",
  "Süpermarket",
  "Tapınak",
  "Üniversite",
  "Hayvanat Bahçesi",
  "Lunapark",
  "Sanat Müzesi",
  "Fırın",
  "Berber",
  "Bowling Salonu",
  "Kafe",
  "Kamp Alanı",
  "Şato",
  "Mağara",
  "Mezarlık",
  "Kilise",
  "Sirk",
  "Komedi Kulübü",
  "Konser Salonu",
  "İnşaat Alanı",
  "Mahkeme",
  "Diş Hekimi",
  "Çöl",
  "Fabrika",
  "Çiftlik",
  "İtfaiye",
  "Balıkçı Köyü",
  "Orman",
  "Garaj",
  "Spor Salonu",
  "Liman",
  "Perili Ev",
  "Hapishane",
  "Caz Kulübü",
  "Hurdalık",
  "Laboratuvar",
  "Kütüphane",
  "Deniz Feneri",
  "Alışveriş Merkezi",
  "Köşk",
  "Marina",
  "Pazar",
  "Manastır",
  "Morg",
  "Motel",
  "Dağ",
  "Haber Odası",
  "Ofis",
  "Opera Binası",
  "Yetimhane",
  "Park",
  "Eczane",
  "Oyun Parkı",
  "Cezaevi",
  "Meyhane",
  "Taş Ocağı",
  "Yarış Pisti",
  "Radyo İstasyonu",
  "Çiftlik",
  "Huzurevi",
  "Çatı",
  "Harabe",
  "Kuaför",
  "Kereste Fabrikası",
  "Kayak Merkezi",
  "Gökdelen",
  "Stadyum",
  "Sokak",
  "Gece Kulübü",
  "Taverna",
  "Tiyatro",
  "Oyuncak Mağazası",
  "Tren İstasyonu",
  "Tünel",
  "Bağ",
  "Depo",
  "Düğün",
  "Atölye",

  // Meslekler
  "Doktor",
  "Öğretmen",
  "Polis",
  "İtfaiyeci",
  "Pilot",
  "Aşçı",
  "Berber",
  "Hemşire",
  "Avukat",
  "Mimar",
  "Mühendis",
  "Garson",
  "Şarkıcı",
  "Oyuncu",
  "Ressam",
  "Yazılımcı",
  "Pazarlamacı",
  "Muhasebeci",
  "Vet Hekim",
  "Diş Hekimi",
  "Ebe",
  "Güvenlik Görevlisi",
  "Taksi Şoförü",
  "Postacı",
  "Temizlik Görevlisi",
  "Bahçıvan",
  "Elektrikçi",
  "Tesisatçı",
  "Terzi",
  "Fotoğrafçı",
  "Gazeteci",
  "Çevirmen",
  "Turist Rehberi",
  "Sporcu",
  "Antrenör",
  "Müze Müdürü",
  "Kitap Editörü",
  "Grafik Tasarımcı",
  "Müzisyen",
  "Dans Eğitmeni",
  "Yoga Eğitmeni",
  "Masaj Terapisti",
  "Kuaför",
  "Makyaj Sanatçısı",
  "Çiftçi",
  "Balıkçı",
  "Kasap",
  "Fırıncı",
  "Pastane",

  // Nesneler
  "Telefon",
  "Bilgisayar",
  "Televizyon",
  "Araba",
  "Bisiklet",
  "Kitap",
  "Kalem",
  "Masa",
  "Sandalye",
  "Yatak",
  "Yastık",
  "Battaniye",
  "Saat",
  "Ayna",
  "Çanta",
  "Ayakkabı",
  "Şapka",
  "Gözlük",
  "Cüzdan",
  "Anahtar",
  "Şemsiye",
  "Kamera",
  "Mikrofon",
  "Kulaklık",
  "Pil",
  "Şarj Aleti",
  "Musluk",
  "Lavabo",
  "Duş",
  "Havlu",
  "Sabun",
  "Diş Fırçası",
  "Tarak",
  "Makas",
  "Çekiç",
  "Vida",
  "Anahtar",
  "Tornavida",
  "Ip",
  "Tutkal",
  "Bant",
  "Çivi",
  "Matkap",
  "Testere",
  "Bıçak",
  "Çatal",
  "Kaşık",
  "Tabak",
  "Bardak",
  "Fincan",
  "Çaydanlık",
  "Tencere",
  "Tava",
  "Fırın",
  "Buzdolabı",
  "Çamaşır Makinesi",
  "Ütü",
  "Süpürge",
  "Faraş",
  "Çöp Kutusu",
  "Vazo",
  "Çiçek",
  "Mum",
  "Şamdan",
  "Resim",
  "Çerçeve",
  "Halı",
  "Perde",
  "Lamba",
  "Avize",
  "Kapı",
  "Pencere",
  "Duvar",
  "Tavan",
  "Zemin",
  "Merdiven",
  "Asansör",
  "Balkon",
  "Bahçe",
  "Ağaç",
  "Çim",
  "Çiçek",
  "Kedi",
  "Köpek",
  "Kuş",
  "Balık",
  "Kaplumbağa",
  "Hamster",
  "Tavşan",
  "At",
  "İnek",
  "Koyun",
  "Tavuk",
  "Horoz",
  "Ördek",
  "Kaz",
  "Güvercin",
  "Kartal",
  "Şahin",
  "Baykuş",
  "Kedi",
  "Aslan",
  "Kaplan",
  "Ayı",
  "Kurt",
  "Tilki",
  "Tavşan",
  "Sincap",
  "Fare",
  "Ekmek",
  "Su",
  "Çay",
  "Kahve",
  "Süt",
  "Peynir",
  "Yumurta",
  "Et",
  "Tavuk",
  "Balık",
  "Pirinç",
  "Makarna",
  "Patates",
  "Domates",
  "Salatalık",
  "Marul",
  "Soğan",
  "Sarımsak",
  "Limon",
  "Portakal",
  "Elma",
  "Armut",
  "Muz",
  "Üzüm",
  "Çilek",
  "Kiraz",
  "Şeftali",
  "Karpuz",
  "Kavun",
  "Ananas",
  "Çikolata",
  "Şeker",
  "Tuz",
  "Karabiber",
  "Baharat",
  "Yağ",
  "Sirke",
  "Sos",
  "Reçel",
  "Bal",
  "Bisküvi",
  "Kek",
  "Pasta",
  "Dondurma",

  // Aktiviteler
  "Yüzme",
  "Koşu",
  "Yürüyüş",
  "Bisiklet Sürme",
  "Futbol",
  "Basketbol",
  "Voleybol",
  "Tenis",
  "Golf",
  "Bowling",
  "Dart",
  "Bilardo",
  "Satranç",
  "Tavla",
  "Kart Oyunu",
  "Video Oyunu",
  "Film İzleme",
  "Müzik Dinleme",
  "Kitap Okuma",
  "Gazete Okuma",
  "Çizim Yapma",
  "Resim Yapma",
  "Fotoğraf Çekme",
  "Video Çekme",
  "Şarkı Söyleme",
  "Dans Etme",
  "Yoga",
  "Meditasyon",
  "Masaj",
  "Alışveriş",
  "Gezme",
  "Seyahat",
  "Kamp",
  "Piknik",
  "Balık Tutma",
  "Avcılık",
  "Bahçıvanlık",
  "Temizlik",
  "Yemek Yapma",
  "Çamaşır Yıkama",
  "Ütü Yapma",
  "Dikiş",
  "Örgü",
  "Marangozluk",
  "Boyama",
  "Tamir",
  "Araba Yıkama",
  "Evcil Hayvan Bakımı",
  "Çocuk Bakımı",
  "Yaşlı Bakımı",
  "Hasta Bakımı",
  "Öğretmenlik",
  "Ders Çalışma",
  "Sınav",
  "Toplantı",
  "Sunum",
  "Konferans",
  "Seminer",
  "Kurs",
  "Atölye",
  "Konser",
  "Tiyatro",
  "Sinema",
  "Müze",
  "Sergi",
  "Festival",
  "Düğün",
  "Doğum Günü",
  "Parti",
  "Kutlama",
  "Tatil",
  "Bayram",
  "Yılbaşı",
  "Mezuniyet",
  "İş Görüşmesi",
  "Randevu",
  "Buluşma",
  "Arkadaş Ziyareti",
  "Aile Ziyareti",
  "Doktor Ziyareti",
  "Berber",
  "Kuaför",
  "Makyaj",
  "Manikür",
  "Pedikür",
  "Spa",
  "Sauna",
  "Hamam",
  "Terapi",
  "Fizik Tedavi",
  "Dış Tedavi",
  "Ameliyat",
  "Kontrol",
  "Test",
  "Tahlil",
  "Röntgen",
  "Ultrason",
  "Tomografi",
  "MR",

  // Duygular ve Durumlar
  "Mutluluk",
  "Üzüntü",
  "Öfke",
  "Korku",
  "Heyecan",
  "Merak",
  "Şaşkınlık",
  "Gülme",
  "Ağlama",
  "Uyku",
  "Rüya",
  "Kabus",
  "Uyanma",
  "Yorgunluk",
  "Dinlenme",
  "Açlık",
  "Toklik",
  "Susuzluk",
  "Sıcaklık",
  "Soğukluk",
  "Hastalık",
  "Sağlık",
  "Güzellik",
  "Çirkinlik",
  "Temizlik",
  "Kirlilik",
  "Düzen",
  "Dağınıklık",
  "Hız",
  "Yavaşlık",
  "Güç",
  "Zayıflık",
  "Akıl",
  "Aptallık",
  "Bilgi",
  "Cahillik",
  "Zenginlik",
  "Fakirlik",
  "Başarı",
  "Başarısızlık",
  "Kazanma",
  "Kaybetme",
  "Doğruluk",
  "Yalan",
  "İyilik",
  "Kötülük",
  "Sevgi",
  "Nefret",
  "Dostluk",
  "Düşmanlık",
  "Evlilik",
  "Boşanma",
  "Doğum",
  "Ölüm",
  "Hayat",
  "Yaşlılık",
  "Gençlik",
  "Çocukluk",
  "Yetişkinlik",
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
      throw new Error("Kullanıcı bulunamadı");
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
      gameStartedAt: data.game_started_at || null,
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
        gameStartedAt: roomData.game_started_at || null,
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
      gameStartedAt: updatedRoom.game_started_at || null,
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
    console.log("updateRoomTimer called:", { roomId, hostId, timerMinutes });

    const user = await this.getCurrentUser();

    if (user.id !== hostId) {
      throw new Error("Only the host can change the timer");
    }

    const timerSeconds = timerMinutes * 60;
    console.log("Converting timer:", { timerMinutes, timerSeconds });

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

    // Update room (keep existing timer value, don't reset it)
    // Note: game_started_at will be added once database migration is run
    const { error: updateError } = await supabase
      .from("rooms")
      .update({
        players: updatedPlayers,
        game_state: "playing",
        current_word: randomLocation,
        // TODO: Add game_started_at: new Date().toISOString() after running migration
        // Keep the existing timer value that was set in lobby
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
      console.log(
        "User",
        user.id,
        "attempting to leave room",
        roomId,
        "as player",
        playerId
      );

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

      console.log(
        "Current room players before leave:",
        roomData.players.length
      );

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

      console.log("Removing player", playerToRemove.name, "from room");

      // Remove player from room
      const updatedPlayers = roomData.players.filter(
        (p: Player) => p.id !== playerId
      );

      console.log("Updated players count:", updatedPlayers.length);

      if (updatedPlayers.length === 0) {
        // Delete room if empty
        console.log("Deleting empty room:", roomId);
        const { error: deleteError } = await supabase
          .from("rooms")
          .delete()
          .eq("id", roomId);

        if (deleteError) {
          console.error("Error deleting room:", deleteError);
        } else {
          console.log("Room deleted successfully");
        }
      } else {
        // If the leaving player was the host, assign a new host
        let finalPlayers = updatedPlayers;
        if (playerToRemove.isHost && updatedPlayers.length > 0) {
          console.log("Transferring host role to", updatedPlayers[0].name);
          finalPlayers = updatedPlayers.map((p: Player, index: number) => ({
            ...p,
            isHost: index === 0,
          }));
        }

        // Update room with new player list
        console.log(
          "Updating room with remaining players:",
          finalPlayers.length
        );
        const updateData = {
          players: finalPlayers,
          host_id:
            finalPlayers.find((p: Player) => p.isHost)?.userId ||
            roomData.host_id,
          updated_at: new Date().toISOString(),
        };

        console.log("Update data:", updateData);

        const { error: updateError } = await supabase
          .from("rooms")
          .update(updateData)
          .eq("id", roomId);

        if (updateError) {
          console.error("Error updating room:", updateError);
          throw new Error("Failed to leave room");
        } else {
          console.log("Room updated successfully after player left");
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

            // More flexible validation - only check for essential fields
            if (!data.id || !data.invite_code) {
              console.warn(
                "Incomplete room data received (missing id or invite_code):",
                data
              );
              return;
            }

            // Handle players array properly - it might be empty but should still be an array
            const players = Array.isArray(data.players) ? data.players : [];

            const room: Room = {
              id: data.id,
              inviteCode: data.invite_code,
              hostId: data.host_id,
              players: players,
              gameState: data.game_state || "waiting",
              currentWord: data.current_word,
              timer: data.timer || 480,
              gameStartedAt: data.game_started_at || null,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
            };

            console.log(
              "Mapped room object with",
              players.length,
              "players:",
              room
            );
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
