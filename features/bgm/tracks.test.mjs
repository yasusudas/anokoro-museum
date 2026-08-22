import assert from "node:assert/strict";
import { BGM_TRACKS, getBgmTrack } from "./tracks.ts";

console.log("🧪 Testing BGM Track Definitions...");

assert.equal(Array.isArray(BGM_TRACKS), true, "BGM_TRACKS must be an array");
assert.equal(BGM_TRACKS.length >= 4, true, "BGM_TRACKS should define at least 4 options including OFF");

const offTrack = getBgmTrack("none");
assert.equal(offTrack.id, "none");
assert.equal(offTrack.name, "OFF");
assert.equal(offTrack.src, undefined);

const bgm1 = getBgmTrack("bgm-1");
assert.equal(bgm1.id, "bgm-1");
assert.equal(bgm1.name, "陽炎");
assert.equal(bgm1.src, "/bgm/年の陽炎.mp3");

const bgm2 = getBgmTrack("bgm-2");
assert.equal(bgm2.id, "bgm-2");
assert.equal(bgm2.name, "Felt and Wood");

const bgm3 = getBgmTrack("bgm-3");
assert.equal(bgm3.id, "bgm-3");
assert.equal(bgm3.name, "Stone Garden");

const fallback = getBgmTrack("invalid-id");
assert.equal(fallback.id, "none");

console.log("🎉 All BGM Track Tests Passed!");
