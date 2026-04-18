import { useState, useEffect } from 'react';
import { PsychogramData } from '../types';

export interface HistoryItem {
  id: string;
  timestamp: number;
  data: PsychogramData;
}

const HISTORY_KEY = 'psychogram_history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      try {
        setHistory(JSON.parse(storedHistory));
      } catch (error) {
        console.error('Failed to parse history from localStorage', error);
      }
    }
  }, []);

  const saveToHistory = (data: PsychogramData) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      data,
    };
    
    setHistory((prev) => {
      // Avoid exact duplicates by looking at candidate name and maybe timestamp, 
      // but simply prepending is fine. We limit to 50 local items to save space.
      const newHistory = [newItem, ...prev].slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const deleteFromHistory = (id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  return {
    history,
    saveToHistory,
    deleteFromHistory,
    clearHistory
  };
}
