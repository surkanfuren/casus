import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface TimerProps {
  initialTime: number;
  gameStartedAt?: string | null; // Optional until database migration is run
  onTimeUp: () => void;
  isRunning?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  gameStartedAt,
  onTimeUp,
  isRunning = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  // Calculate remaining time based on elapsed time since game started
  const calculateTimeLeft = () => {
    if (!gameStartedAt || !isRunning) {
      return initialTime;
    }

    const startTime = new Date(gameStartedAt).getTime();
    const currentTime = new Date().getTime();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const remaining = Math.max(0, initialTime - elapsedSeconds);

    console.log("Timer calculation:", {
      gameStartedAt,
      startTime,
      currentTime,
      elapsedSeconds,
      initialTime,
      remaining,
    });

    return remaining;
  };

  // Debug timer props (comment out in production)
  console.log("Timer Debug:", {
    initialTime,
    gameStartedAt,
    isRunning,
    timeLeft,
  });

  // Update timer every second based on elapsed time or simple countdown
  useEffect(() => {
    console.log("Timer useEffect triggered:", { isRunning, gameStartedAt });

    if (!isRunning) {
      console.log("Timer not running, skipping interval setup");
      setTimeLeft(initialTime);
      return;
    }

    // If gameStartedAt is available, use real-time calculation
    if (gameStartedAt) {
      // Calculate initial time left
      const initialTimeLeft = calculateTimeLeft();
      setTimeLeft(initialTimeLeft);

      if (initialTimeLeft <= 0) {
        console.log("Time already up when timer started!");
        onTimeUp();
        return;
      }

      console.log("Setting up real-time timer interval...");
      const interval = setInterval(() => {
        const newTimeLeft = calculateTimeLeft();
        console.log("Timer tick - calculated time left:", newTimeLeft);

        setTimeLeft(newTimeLeft);

        if (newTimeLeft <= 0) {
          console.log("Time's up! Calling onTimeUp");
          onTimeUp();
          clearInterval(interval);
        }
      }, 1000);

      return () => {
        console.log("Cleaning up real-time timer interval:", interval);
        clearInterval(interval);
      };
    } else {
      // Fallback to simple countdown timer (until migration is run)
      console.log(
        "Using fallback countdown timer (gameStartedAt not available)"
      );
      setTimeLeft(initialTime);

      const interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1;
          console.log("Fallback timer tick:", newTime);

          if (newTime <= 0) {
            console.log("Fallback timer - Time's up! Calling onTimeUp");
            onTimeUp();
            clearInterval(interval);
            return 0;
          }

          return newTime;
        });
      }, 1000);

      return () => {
        console.log("Cleaning up fallback timer interval:", interval);
        clearInterval(interval);
      };
    }
  }, [isRunning, gameStartedAt, initialTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 30) return "#ef4444"; // Red
    if (timeLeft <= 60) return "#f59e0b"; // Orange
    return "#10b981"; // Green
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, { color: getTimerColor() }]}>
        {formatTime(timeLeft)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
  },
});
