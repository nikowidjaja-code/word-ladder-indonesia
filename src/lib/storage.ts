// Capacitor Preferences: SharedPreferences on Android (survives WebView cache clears), localStorage on web.
import { Preferences } from "@capacitor/preferences";

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const { value } = await Preferences.get({ key });
    return value ? (JSON.parse(value) as T) : fallback;
  } catch { return fallback; }
}
export function save(key: string, value: unknown): void {
  Preferences.set({ key, value: JSON.stringify(value) }).catch(() => {});
}
