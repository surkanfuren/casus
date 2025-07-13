export interface User {
  id: string;
  name: string;
  profile_photo?: string;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  userId: string;
  name: string;
  profilePhoto?: string;
  isHost: boolean;
  isSpy: boolean;
  hasVoted: boolean;
}

export interface Room {
  id: string;
  inviteCode: string;
  hostId: string;
  players: Player[];
  gameState: "waiting" | "playing" | "voting" | "finished";
  currentWord: string | null;
  timer: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameResult {
  winner: "spy" | "others";
  spyPlayer: Player;
  votedPlayer: Player | null;
  allPlayers: Player[];
}

export interface GameSettings {
  minPlayers: number;
  maxPlayers: number;
  timerDuration: number;
}
