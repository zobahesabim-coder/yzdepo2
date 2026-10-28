/**
 * Returns true if there are any saved outputs in local history.
 * Used to show/hide the "Geçmiş" link in the navbar.
 */
export function useHasHistory() {
  try {
    const raw = localStorage.getItem("smg-history");
    if (!raw) return false;
    const items = JSON.parse(raw);
    return Array.isArray(items) && items.length > 0;
  } catch {
    return false;
  }
}
