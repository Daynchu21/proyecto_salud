import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import MapView, {
  LatLng,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";

export interface Emergency {
  latitud: number;
  longitud: number;
  domicilio: string;
  hospitalLatitud: number;
  hospitalLongitud: number;
  movilidadName: string;
  estado: string;
}

interface Props {
  emergency: Emergency;
  ambulanceId: string;
}

export default function EmergencyMap({ emergency, ambulanceId }: Props) {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  const mapRef = React.useRef<MapView | null>(null); // ✅ ref para el mapa

  const targetCoords: LatLng =
    emergency.estado === "EN_CAMINO"
      ? { latitude: emergency.latitud, longitude: emergency.longitud }
      : {
          latitude: emergency.hospitalLatitud,
          longitude: emergency.hospitalLongitud,
        };

  const ambulanceCoordsSock = {
    latitud: emergency.latitud,
    longitud: emergency.longitud,
  };

  useEffect(() => {
    const fetchRoute = async () => {
      const start = `${ambulanceCoordsSock.longitud},${ambulanceCoordsSock.latitud}`;
      const end = `${targetCoords.longitude},${targetCoords.latitude}`;
      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        const coords = data.routes[0].geometry.coordinates.map(
          ([lng, lat]: number[]) => ({
            latitude: lat,
            longitude: lng,
          })
        );
        setRouteCoords(coords);
      } catch (err) {
        console.error("❌ Error fetching route:", err);
      }
    };

    fetchRoute();
  }, [ambulanceCoordsSock, emergency]);

  useEffect(() => {
    if (mapRef.current) {
      const region: Region = {
        latitude: ambulanceCoordsSock.latitud,
        longitude: ambulanceCoordsSock.longitud,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(region, 1000); // 1 segundo de animación
    }
  }, [ambulanceCoordsSock]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: ambulanceCoordsSock.latitud,
          longitude: ambulanceCoordsSock.longitud,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* Marker: Ambulancia */}
        <Marker
          coordinate={{
            latitude: ambulanceCoordsSock.latitud,
            longitude: ambulanceCoordsSock.longitud,
          }}
          title="Ambulancia"
          description={emergency.movilidadName}
        >
          <Image
            source={require("../../../assets/ambulancia-roja.png")}
            style={{ width: 40, height: 40, resizeMode: "contain" }}
          />
        </Marker>

        {/* Marker: Destino */}
        <Marker
          coordinate={{
            latitude: targetCoords.latitude,
            longitude: targetCoords.longitude,
          }}
          title="Destino"
          description={emergency.domicilio}
          pinColor="blue"
        />

        {/* Polyline: Ruta */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#FF0000"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    marginVertical: 10,
  },
});
