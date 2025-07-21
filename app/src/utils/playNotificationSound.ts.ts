// hooks/useNotificationSound.ts
import { useAudioPlayer } from "expo-audio";
import { Vibration } from "react-native";

export function useNotificationSound() {
  const player = useAudioPlayer(require("../../../assets/alerta.mp3")); // Hook válido aquí

  const play = () => {
    player.seekTo(0);
    player.play();
    Vibration.vibrate();
  };

  return play;
}
