// Parse the warm A-Eye scanner output into structured pieces.

export type RoomScores = {
  comfort?: number;
  luxury?: number;
  spaceEfficiency?: number;
  lighting?: number;
  warmth?: number;
  styleConsistency?: number;
  familyFriendly?: number;
  overall?: number;
};

export type ParsedAnalysis = {
  mood?: string;
  strengths: string[];
  opportunities: string[];
  scores: RoomScores;
  styleCategory?: string;
  direction?: string;
  budget?: string;
  suggestedLook?: string;
  partners: string[];
  nextStep?: string;
};

const SECTION_KEYS = [
  "Room Mood", "Strengths", "Opportunities", "A-Eye Scores", "Style Category",
  "Suggested Direction", "Budget Guidance", "Suggested Look",
  "Partner Style Inspiration", "Next Step",
];

function splitSections(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const lines = text.split("\n");
  let current = "";
  const buf: string[] = [];
  const flush = () => { if (current) out[current] = buf.join("\n").trim(); buf.length = 0; };
  for (const raw of lines) {
    const line = raw.trim();
    const hit = SECTION_KEYS.find(k => line === k || line.toLowerCase().startsWith(k.toLowerCase() + " (") || line.toLowerCase() === k.toLowerCase());
    if (hit) { flush(); current = hit; continue; }
    if (current) buf.push(raw);
  }
  flush();
  return out;
}

const num = (s: string) => {
  const m = s.match(/(\d{1,3})/);
  return m ? Math.min(100, parseInt(m[1], 10)) : undefined;
};

export function parseAnalysis(text: string): ParsedAnalysis {
  const sections = splitSections(text);
  const bullets = (s: string) => s.split("\n").map(l => l.replace(/^[-•·*]\s*/, "").trim()).filter(Boolean);
  const scoresRaw = sections["A-Eye Scores"] ?? "";
  const scoreLine = (label: string) => {
    const re = new RegExp(`${label}\\s*:\\s*([^\\n]+)`, "i");
    const m = scoresRaw.match(re);
    return m ? num(m[1]) : undefined;
  };
  const scores: RoomScores = {
    comfort: scoreLine("Comfort"),
    luxury: scoreLine("Luxury Feel"),
    spaceEfficiency: scoreLine("Space Efficiency"),
    lighting: scoreLine("Lighting"),
    warmth: scoreLine("Warmth"),
    styleConsistency: scoreLine("Style Consistency"),
    familyFriendly: scoreLine("Family-Friendly"),
    overall: scoreLine("Overall"),
  };
  return {
    mood: sections["Room Mood"],
    strengths: bullets(sections["Strengths"] ?? ""),
    opportunities: bullets(sections["Opportunities"] ?? ""),
    scores,
    styleCategory: sections["Style Category"],
    direction: sections["Suggested Direction"],
    budget: sections["Budget Guidance"],
    suggestedLook: sections["Suggested Look"],
    partners: bullets(sections["Partner Style Inspiration"] ?? ""),
    nextStep: sections["Next Step"],
  };
}
