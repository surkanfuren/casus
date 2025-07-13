import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

interface TimerProps {
  initialTime: number;
  onTimeUp: () => void;
  isRunning?: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  onTimeUp,
  isRunning = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp]);

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
