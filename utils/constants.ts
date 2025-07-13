import { GameSettings } from "../types";

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  timerMinutes: 8,
  minPlayers: 3,
  maxPlayers: 10,
};

export const SPYFALL_WORDS = [
  "Airport",
  "Bank",
  "Beach",
  "Casino",
  "Cathedral",
  "Circus",
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
  "Space Station",
  "Submarine",
  "Supermarket",
  "Theater",
  "University",
  "Zoo",
  "Amusement Park",
  "Art Museum",
  "Barbershop",
  "Bookstore",
  "Bowling Alley",
  "Candy Factory",
  "Car Dealership",
  "Cemetery",
  "Coal Mine",
  "Construction Site",
  "Dental Office",
  "Desert",
  "Diner",
  "Disco",
  "Farm",
  "Fire Station",
  "Fishing Village",
  "Garage",
  "Gas Station",
  "Haunted House",
  "Ice Rink",
  "Jail",
  "Jazz Club",
  "Library",
  "Lighthouse",
  "Mansion",
  "Nightclub",
  "Office Building",
  "Park",
  "Pharmacy",
  "Playground",
  "Raceway",
  "Retirement Home",
  "Salon",
  "Ski Resort",
  "Skyscraper",
  "Stadium",
  "Subway",
  "Toy Store",
  "Vineyard",
  "Warehouse",
  "Wedding Chapel",
];

export const INVITE_CODE_LENGTH = 6;
export const INVITE_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const generateInviteCode = (): string => {
  let result = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    result += INVITE_CODE_CHARS.charAt(
      Math.floor(Math.random() * INVITE_CODE_CHARS.length)
    );
  }
  return result;
};

export const getRandomWord = (): string => {
  return SPYFALL_WORDS[Math.floor(Math.random() * SPYFALL_WORDS.length)];
};

export const getRandomSpy = (players: { id: string }[]): string => {
  return players[Math.floor(Math.random() * players.length)].id;
};
