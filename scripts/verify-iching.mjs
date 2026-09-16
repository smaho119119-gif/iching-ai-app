import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../data/hexagrams.ts", import.meta.url), "utf8");
const rows = [...source.matchAll(/^\s*\[(\d+),"([^"]+)","([^"]+)"/gm)].map((match) => ({ number: Number(match[1]), name: match[2] }));
assert.equal(rows.length, 64, "Should contain all 64 hexagram names");
assert.deepEqual(rows.map((row) => row.number), Array.from({ length: 64 }, (_, index) => index + 1), "Hexagram numbers should follow King Wen order");

const sourceText = readFileSync(new URL("../lib/iching.ts", import.meta.url), "utf8");
assert.match(sourceText, /export function changingLineRule\(count: number\): string/);
const functionBody = sourceText.match(/const rules: Record<number, string> = \{([\s\S]*?)\n  \};/)?.[1];
assert.ok(functionBody, "Should define all changing-line rules");
const rulePairs = [...functionBody.matchAll(/(\d): "([^"]+)"/g)];
assert.equal(rulePairs.length, 7, "Should define seven changing-line rules");
const changingLineRules = new Map(rulePairs.map((match) => [Number(match[1]), match[2]]));
for (let count = 0; count <= 6; count += 1) assert.match(changingLineRules.get(count), /変爻|六爻/, `Should define rule for ${count} changing lines`);

const trigramPairs = [...source.match(/const KING_WEN_TRIGRAMS:[^=]+ = \[([\s\S]*?)\n\];/)[1].matchAll(/\[(\d+),(\d+)\]/g)].map((match) => [Number(match[1]), Number(match[2])]);
assert.equal(trigramPairs.length, 64, "Should define 64 upper/lower trigram pairs");
const types = [...source.match(/const TRIGRAM_ORDER:[^=]+ = \[([^\]]+)\]/)[1].matchAll(/"([01]{3})"/g)].map((match) => match[1]);
const patterns = trigramPairs.map(([upper, lower]) => types[lower] + types[upper]);
assert.equal(new Set(patterns).size, 64, "King Wen patterns must uniquely cover all 64 hexagrams");
const numberOf = (pattern) => patterns.indexOf(pattern) + 1;
assert.equal(numberOf("111111"), 1, "All yang should map to hexagram 1");
assert.equal(numberOf("000000"), 2, "All yin should map to hexagram 2");
assert.equal(numberOf("100010"), 3, "Hexagram 3 pattern should map correctly");
assert.equal(numberOf("010001"), 4, "Hexagram 4 pattern should map correctly");
assert.equal(numberOf("111000"), 11, "Hexagram 11 pattern should map correctly");
assert.equal(numberOf("000111"), 12, "Hexagram 12 pattern should map correctly");
assert.equal(numberOf("101010"), 63, "Hexagram 63 pattern should map correctly");
assert.equal(numberOf("010101"), 64, "Hexagram 64 pattern should map correctly");

console.log("I Ching verification passed: 64 unique King Wen patterns, sequence, landmarks, and all 7 changing-line rules.");
