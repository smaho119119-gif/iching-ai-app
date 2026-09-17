import { HEXAGRAMS } from "@/data/hexagrams";

export function getDailyHexagram(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const seed = `${values.year}-${values.month}-${values.day}`;
  let hash = 2166136261;
  for (const character of seed) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  const unsigned = hash >>> 0;
  const hexagram = HEXAGRAMS[unsigned % HEXAGRAMS.length];
  const changingLine = ((unsigned >>> 8) % 6) + 1;
  return { date: seed, hexagram, changingLine };
}
