// components/TimeElapsed.tsx

import React, { useEffect, useState } from "react";
import { Text } from "react-native";

interface Props {
  fromDateTime: string;
}

const TimeElapsed = ({ fromDateTime }: Props) => {
  const [elapsedTime, setElapsedTime] = useState(getElapsedTime(fromDateTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(getElapsedTime(fromDateTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [fromDateTime]);

  return <Text>{elapsedTime}</Text>;
};

export default TimeElapsed;

function getElapsedTime(startTime: string): string {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const days = Math.floor(diff / (3600 * 24));
  const hours = Math.floor((diff % (3600 * 24)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
