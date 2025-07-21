// src/utils/authHandler.ts

let logoutFn: (() => void) | null = null;

export const setLogout = (fn: () => void) => {
  logoutFn = fn;
};

export const triggerLogout = () => {
  if (logoutFn) {
    logoutFn();
  }
};
