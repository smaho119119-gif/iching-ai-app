import assert from "node:assert/strict";
import { isValidLineSignature } from "../lib/line-signature.ts";

const body = '{"destination":"U8e742f61d673b39c7fff3cecb7536ef0","events":[]}';
const secret = "8c570fa6dd201bb328f1c1eac23a96d8";
const signature = "GhRKmvmHys4Pi8DxkF4+EayaH0OqtJtaZxgTD9fMDLs=";
assert.equal(isValidLineSignature(body, signature, secret), true, "Should accept LINE's official webhook signature example");
assert.equal(isValidLineSignature(`${body} `, signature, secret), false, "Should reject a modified raw body");
assert.equal(isValidLineSignature(body, null, secret), false, "Should reject a missing signature");
assert.equal(isValidLineSignature(body, signature, `${secret}x`), false, "Should reject a signature made with another secret");
console.log("Integration security verification passed: LINE HMAC-SHA256 accepts the official fixture and rejects modified or unsigned requests.");
