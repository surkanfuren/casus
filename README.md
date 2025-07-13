# 🕵️ Spyfall - Multiplayer Social Deduction Game

A React Native multiplayer game built with Expo and Supabase where players try to identify the spy among them!

## 🎮 Game Overview

Spyfall is a social deduction game where:

- 3-10 players join a room using an invite code
- Everyone gets the same location except one person - the **spy**
- Players ask each other questions to figure out who the spy is
- The spy tries to blend in and figure out the location
- Players vote to eliminate the spy before time runs out!

## 🚀 Features

- **Real-time Multiplayer**: Live game synchronization across all devices
- **Room-based System**: Create and join rooms with unique invite codes
- **Timer System**: 8-minute countdown with visual indicators
- **Voting System**: Democratic spy elimination process
- **50+ Locations**: Wide variety of Spyfall locations
- **Responsive UI**: Clean, modern interface optimized for mobile
- **Real-time Updates**: Live player status and game state changes

## 📱 Screenshots

_Add screenshots here when you test the app_

## 🛠️ Tech Stack

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Navigation**: Expo Router
- **Language**: TypeScript
- **Styling**: React Native StyleSheet

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account

### 1. Clone & Install

```bash
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Follow the instructions in `supabase-setup.md`
3. Copy `.env.example` to `.env`
4. Add your Supabase credentials to `.env`

### 3. Run the App

```bash
npm start
```

Then scan the QR code with Expo Go app or run on simulator.

## 🎯 How to Play

### For Room Host:

1. Tap "Create Room"
2. Enter your name
3. Share the room code with friends
4. Wait for players to join (3-10 players)
5. Start the game when everyone is ready

### For Players:

1. Tap "Join Room"
2. Enter your name and the room code
3. Wait in the lobby for the host to start

### During the Game:

- **Regular Players**: See the location, ask questions, identify the spy
- **Spy**: Don't see the location, blend in, figure out where you are
- **Everyone**: Vote before time runs out!

### Win Conditions:

- **Players win**: If they correctly identify the spy
- **Spy wins**: If time runs out OR if the wrong person is voted out

## 🏗️ Project Structure

```
casus/
├── app/                    # Screen components (Expo Router)
│   ├── index.tsx           # Main home screen
│   ├── join-room.tsx       # Join existing room
│   ├── lobby.tsx           # Game lobby/waiting room
│   ├── game.tsx            # Main game screen
│   ├── results.tsx         # Game results screen
│   └── profile.tsx         # User profile setup
├── components/            # Reusable UI components
│   ├── ui/               # Basic UI components
│   └── Timer.tsx         # Game timer
├── services/             # Business logic
│   ├── supabase.ts       # Supabase client
│   └── gameService.ts    # Game operations
├── types/                # TypeScript definitions
├── utils/                # Helper functions
└── hooks/                # Custom React hooks
```

## 🔧 Configuration

### Game Settings

Edit `utils/constants.ts` to modify:

- Timer duration (default: 8 minutes)
- Player limits (3-10 players)
- Available locations

### Supabase Configuration

See `supabase-setup.md` for detailed database setup instructions.

## 🐛 Troubleshooting

### Common Issues:

1. **"Room not found"**: Check the invite code and ensure the room hasn't expired
2. **Real-time not working**: Verify Supabase real-time is enabled for the `rooms` table
3. **App won't start**: Ensure environment variables are set correctly

### Debug Mode:

Check the React Native debugger for detailed error messages.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🎉 Acknowledgments

- Inspired by the original Spyfall board game
- Built with React Native and Expo
- Powered by Supabase for real-time functionality

---

**Ready to play?** Set up your Supabase database and start your first game! 🎮
