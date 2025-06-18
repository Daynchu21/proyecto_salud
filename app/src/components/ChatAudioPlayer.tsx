import { FontAwesome } from "@expo/vector-icons";
import { useAudioPlayer } from "expo-audio";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

interface Props {
  audioUrl: string;
  isMine: boolean;
}

export const ChatAudioPlayer: React.FC<Props> = ({ audioUrl, isMine }) => {
  const player = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const isValidDuration = !isNaN(player.duration) && player.duration > 0;
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(player.playing);
      if (player.playing) {
        setCurrentTime(player.currentTime);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [player]);

  const playAudio = async () => {
    try {
      setIsLoading(true);
      const uri = `${
        isDev
          ? process.env.EXPO_PUBLIC_LOCAL_API_URL
          : process.env.EXPO_PUBLIC_LOCAL_API_IP
      }${audioUrl}`;
      setShouldAutoPlay(true);
      player.replace(uri);

      const checkLoaded = setInterval(() => {
        if (player.isLoaded && player.duration > 0) {
          clearInterval(checkLoaded);
          setIsLoading(false);
          setShouldAutoPlay(false);
        }
      }, 100);

      player.play();
    } catch (err) {
      console.error("Error al reproducir audio:", err);
      setIsLoading(false);
      Alert.alert("Error", "No se pudo reproducir el audio.");
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        if (isPlaying) {
          player.pause();
        } else {
          playAudio();
        }
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginTop: 5,
        gap: 5,
      }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={!isMine ? "#fff" : "#000"} />
      ) : (
        <>
          <FontAwesome
            name={isPlaying ? "pause" : "play"}
            size={20}
            style={isMine ? styles.myMessageText : styles.messageText}
          />
          <Text style={isMine ? styles.myMessageText : styles.messageText}>
            {isLoading
              ? ""
              : isPlaying
              ? "Pausar"
              : shouldAutoPlay
              ? ""
              : "Reproducir audio"}
          </Text>
          {isValidDuration && (
            <Text style={isMine ? styles.myMessageText : styles.messageText}>
              {`${Math.floor(currentTime)}s / ${Math.floor(player.duration)}s`}
            </Text>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default ChatAudioPlayer;

const styles = StyleSheet.create({
  myMessageText: { color: "#fff" },
  messageText: { color: "#000" },
});
