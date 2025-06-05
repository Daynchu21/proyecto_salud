// App.tsx
import React from "react";
import { AuthProvider } from "./src/context/authContext";
import Navigation from "./src/navigation";

export default function App() {
  return (
    <AuthProvider>
      <Navigation />
    </AuthProvider>
  );
}
