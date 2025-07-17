import { RecordingPresets, useAudioRecorder } from "expo-audio";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import { Alert } from "react-native";

export const useChatAudio = (onSendAudio: (base64: string) => void) => {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);

  /*
  useEffect(() => {
    const requestPermission = async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert("Permiso denegado", "Necesitamos acceso al micrófono.");
      }
    };
    requestPermission();
  }, []);
*/
  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error("Error al iniciar grabación:", err);
      Alert.alert("Error", "No se pudo iniciar la grabación.");
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setIsRecording(false);
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      onSendAudio(base64);
    } catch (err) {
      console.error("Error al detener grabación:", err);
      Alert.alert("Error", "No se pudo procesar el audio.");
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};
