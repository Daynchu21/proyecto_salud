// context/ErrorContext.tsx
import React, { useEffect, useState } from "react";
import ErrorMessage from "../components/errorMessage";
import { ErrorManager } from "../utils/errorHandler";

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    ErrorManager.registerCallback((msg) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), 4000);
    });
  }, []);

  return (
    <>
      {children}
      {message && <ErrorMessage message={message} />}
    </>
  );
};
