import { useState, useCallback } from 'react';

// Generic localStorage hook with JSON serialization
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (err) {
      console.error('localStorage write error:', err);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

// Character state persistence (attrs, weight, metrics, phase, hp, mana, etc.)
export function useCharacterPersistence() {
  const defaults = {
    attrs: { STR: 65, END: 63, WIS: 67, INT: 49, CON: 61, VIT: 74 },
    weight: 220,
    bodyFat: 24.1,
    leanMass: 155.6,
    rhr: 53,
    hrv: 117,
    totalSets: 9334,
    proteinAvg: 191,
    dayCount: 1097,
    phase: 'phase1_cut',
    hp: 85,
    mana: 92,
    streaks: { workout: 4, protein: 3, trifecta: 0 },
    activePet: 0,
    activeBuffs: [],
  };
  return useLocalStorage('iron_sovereign_character', defaults);
}

// Battle log persistence (last 50 entries)
export function useBattleLogPersistence() {
  return useLocalStorage('iron_sovereign_battle_log', []);
}

// Nutrition log history persistence
export function useNutritionLogPersistence() {
  return useLocalStorage('iron_sovereign_nutrition_log', []);
}

// Daily quests persistence (resets daily in a real app)
export function useDailyQuestsPersistence(defaults) {
  return useLocalStorage('iron_sovereign_daily_quests', defaults);
}
