import { useState, useCallback } from "react";

const STORAGE_KEY = "iron_sovereign_settings";

const DEFAULTS = {
  name: "Iron Sovereign",
  startDate: "2023-01-01",
  startWeight: 248,
  proteinTarget: 200,
  stepTarget: 8000,
  sleepTarget: 7,
  timezone: "America/Chicago",
  soundEnabled: true,
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(() => loadFromStorage());

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — continue in-memory
      }
      return next;
    });
  }, []);

  return { settings, updateSetting, DEFAULTS };
}
