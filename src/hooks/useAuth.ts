import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage('auth_status', false);
  const [credentials, setCredentials] = useLocalStorage('auth_credentials', DEFAULT_CREDENTIALS);

  const login = (username: string, password: string): boolean => {
    if (username === credentials.username && password === credentials.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateCredentials = (username: string, password: string) => {
    setCredentials({ username, password });
  };

  return {
    isAuthenticated,
    login,
    logout,
    updateCredentials,
    currentUsername: credentials.username
  };
}
