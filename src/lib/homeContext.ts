// Reads My Home Profile from localStorage and formats it as AI context.
// Used to inject "what we know about this customer's home" into every AI prompt.

const ROOMS_KEY = "arkhi2:rooms";
const PREFS_KEY = "arkhi2:home_prefs";

export type HomePrefs = {
  style?: string;
  budget?: string;
  colors?: string;
  retailer?: string;
};

export function getHomePrefs(): HomePrefs {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}

export function setHomePrefs(p: HomePrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

export function homeProfileContext(): string {
  let rooms: Array<{ name: string; type: string }> = [];
  try { rooms = JSON.parse(localStorage.getItem(ROOMS_KEY) || "[]"); } catch { /* */ }
  const prefs = getHomePrefs();
  const lines = [
    "MY HOME PROFILE (use this to personalise fit/style/recommendations):",
    rooms.length
      ? `Rooms: ${rooms.map(r => `${r.name} (${r.type})`).join(", ")}`
      : "Rooms: none saved yet",
    prefs.style ? `Preferred style: ${prefs.style}` : "Preferred style: unspecified",
    prefs.budget ? `Budget: ${prefs.budget}` : "Budget: unspecified",
    prefs.colors ? `Preferred colours: ${prefs.colors}` : "",
    prefs.retailer ? `Preferred retailer: ${prefs.retailer}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}
