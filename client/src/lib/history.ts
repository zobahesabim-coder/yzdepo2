export type ToolType = "presentation" | "logo" | "voice" | "video" | "converter" | "coding" | "ai-video-test";

export type HistoryItem = {
  id: string;
  toolType: ToolType;
  createdAt: string;
  outputUrl?: string;
  metadata?: string;
};

const STORAGE_KEY = "smg-history";

export function getHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function addHistoryItem(item: Omit<HistoryItem, "id" | "createdAt">): void {
  const items = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  // Keep last 100 items
  const trimmed = items.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function deleteHistoryItem(id: string): void {
  const items = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
