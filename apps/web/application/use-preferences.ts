"use client";

import { useCallback, useState } from "react";

export type AiMode = "off" | "local" | "cloud";
export type SyncProvider = "manual" | "webdav";

export interface AppPreferences {
  version: 1;
  aiMode: AiMode;
  aiEndpoint: string;
  aiModel: string;
  aiScope: {
    currentTask: boolean;
    projectTasks: boolean;
    completedTasks: boolean;
    attachments: boolean;
  };
  syncProvider: SyncProvider;
  webdavUrl: string;
  webdavUsername: string;
}

const STORAGE_KEY = "taskflow_preferences_v1";

export const DEFAULT_PREFERENCES: AppPreferences = {
  version: 1,
  aiMode: "off",
  aiEndpoint: "",
  aiModel: "",
  aiScope: {
    currentTask: true,
    projectTasks: false,
    completedTasks: false,
    attachments: false,
  },
  syncProvider: "manual",
  webdavUrl: "",
  webdavUsername: "",
};

function readPreferences(): AppPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<AppPreferences>;
    if (parsed.version !== 1) return DEFAULT_PREFERENCES;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      aiMode:
        parsed.aiMode === "local" || parsed.aiMode === "cloud"
          ? parsed.aiMode
          : "off",
      syncProvider: parsed.syncProvider === "webdav" ? "webdav" : "manual",
      aiScope: {
        ...DEFAULT_PREFERENCES.aiScope,
        ...parsed.aiScope,
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function usePreferences() {
  const [preferences, setPreferences] = useState(() =>
    typeof window === "undefined" ? DEFAULT_PREFERENCES : readPreferences(),
  );

  const savePreferences = useCallback((next: AppPreferences) => {
    const normalized: AppPreferences = {
      ...next,
      version: 1,
      aiEndpoint: next.aiEndpoint.trim().slice(0, 500),
      aiModel: next.aiModel.trim().slice(0, 100),
      webdavUrl: next.webdavUrl.trim().slice(0, 1_000),
      webdavUsername: next.webdavUsername.trim().slice(0, 200),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setPreferences(normalized);
    return normalized;
  }, []);

  return { preferences, savePreferences };
}
