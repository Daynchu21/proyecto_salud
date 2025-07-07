// useGetLocation.js
import * as Location from "expo-location";
import { useState } from "react";
import { ErrorManager } from "../utils/errorHandler";

export function useGetLocation() {
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        ErrorManager.showError("Permiso de ubicación denegado");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const direccion = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (direccion.length > 0) {
        return direccion[0];
      } else {
        ErrorManager.showError("No se pudo obtener la dirección");
      }
    } catch (err: any) {
      ErrorManager.showError(err.message || "Error al obtener ubicación");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getLocation, loading, errorMsg };
}
