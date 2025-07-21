// utils/ErrorManager.ts
type ErrorCallback = (message: string) => void;

let showErrorCallback: ErrorCallback | null = null;

export const ErrorManager = {
  registerCallback(callback: ErrorCallback) {
    showErrorCallback = callback;
  },

  showError(message: string) {
    if (showErrorCallback) {
      showErrorCallback(message);
    } else {
      console.warn("No error callback registered yet");
    }
  },
};
