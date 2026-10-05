import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import Module from "node:module";
import ts from "typescript";
import { fileURLToPath } from "node:url";

// Execute the actual dependency-free time/like utility, using the existing TypeScript compiler.
const filename = fileURLToPath(new URL("../lib/birthy/birthday-cards.ts", import.meta.url));
const compiled = ts.transpileModule(fs.readFileSync(filename,"utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loaded = new Module(filename);
loaded.filename = filename;
loaded.paths = Module._nodeModulePaths(path.dirname(filename));
loaded._compile(compiled,filename);
const { getBirthdayWindow, isCardRevealed, isCardPending, summarizeMessageLikes, tokyoDateKey, nextTokyoMidnight } = loaded.exports;

test("Japanese midnight opens the sending window exactly one day before", () => {
  assert.equal(getBirthdayWindow("2004-10-05",new Date("2026-10-03T23:59:59.999+09:00")).canSend,false);
  const window = getBirthdayWindow("2004-10-05",new Date("2026-10-04T00:00:00+09:00"));
  assert.equal(window.phase,"eve");
  assert.equal(window.canSend,true);
  assert.equal(window.opensAt,"2026-10-04T00:00:00+09:00");
  assert.equal(window.revealAt,"2026-10-05T00:00:00+09:00");
});
test("Cards stay sealed until the exact birthday midnight, including private cards", () => {
  const card = { revealAt:"2026-10-05T00:00:00+09:00" };
  const before = new Date("2026-10-04T23:59:59.999+09:00");
  const midnight = new Date("2026-10-05T00:00:00+09:00");
  assert.equal(isCardRevealed(card,before),false);
  assert.equal(isCardPending(card,before),true);
  assert.equal(isCardRevealed(card,midnight),true);
  assert.equal(isCardPending(card,midnight),false);
  assert.equal(getBirthdayWindow("2004-10-05",midnight).phase,"birthday");
});
test("The event day remains open through its final millisecond", () => {
  assert.equal(getBirthdayWindow("2004-10-05",new Date("2026-10-05T23:59:59.999+09:00")).canSend,true);
  const nextEvent = getBirthdayWindow("2004-10-05",new Date("2026-10-06T00:00:00+09:00"));
  assert.equal(nextEvent.canSend,false);
  assert.equal(nextEvent.birthdayDate,"2027-10-05");
});
test("January birthdays handle the previous calendar year", () => {
  const window = getBirthdayWindow("2000-01-01",new Date("2026-12-31T00:00:00+09:00"));
  assert.equal(window.phase,"eve");
  assert.equal(window.year,2027);
  assert.equal(window.birthdayDate,"2027-01-01");
  assert.equal(window.opensAt,"2026-12-31T00:00:00+09:00");
});
test("Time comparisons are independent of viewer timezone", () => {
  const japanese = new Date("2026-10-05T00:00:00+09:00");
  const utc = new Date("2026-10-04T15:00:00Z");
  const pacific = new Date("2026-10-04T08:00:00-07:00");
  assert.deepEqual(getBirthdayWindow("2000-10-05",japanese),getBirthdayWindow("2000-10-05",utc));
  assert.deepEqual(getBirthdayWindow("2000-10-05",utc),getBirthdayWindow("2000-10-05",pacific));
  assert.equal(tokyoDateKey(utc),"2026-10-05");
});
test("Leap-day policy and leap-year birthday are explicit", () => {
  assert.equal(getBirthdayWindow("2004-02-29",new Date("2027-02-27T12:00:00+09:00")).birthdayDate,"2027-02-28");
  assert.equal(getBirthdayWindow("2004-02-29",new Date("2028-02-28T12:00:00+09:00")).birthdayDate,"2028-02-29");
});
test("Invalid release dates remain sealed", () => {
  assert.equal(isCardRevealed({revealAt:"invalid"},new Date()),false);
  assert.equal(isCardPending({revealAt:"invalid"},new Date()),false);
  assert.equal(getBirthdayWindow("invalid",new Date()).canSend,false);
  assert.equal(getBirthdayWindow("2004-13-10",new Date()).canSend,false);
  assert.equal(getBirthdayWindow("2004-04-31",new Date()).canSend,false);
  assert.equal(getBirthdayWindow("2003-02-29",new Date()).canSend,false);
});
test("The shared clock wakes at Japan midnight even when UTC is the previous day", () => {
  assert.equal(nextTokyoMidnight(new Date("2026-10-04T14:59:59Z")),Date.parse("2026-10-05T00:00:00+09:00"));
});
test("Owner likes stay separate from deduplicated ordinary users", () => {
  const likes = ["misaki","self","yu","yu","hina"].map(userId=>({messageId:"m1",userId,createdAt:"2026-10-05T00:00:00+09:00"}));
  likes.push({messageId:"other",userId:"takumi",createdAt:"2026-10-05T00:00:00+09:00"});
  assert.deepEqual(summarizeMessageLikes(likes,"m1","misaki"),{ownerLiked:true,otherCount:3,viewerLiked:true});
  assert.deepEqual(summarizeMessageLikes(likes,"m1","misaki","takumi"),{ownerLiked:true,otherCount:3,viewerLiked:false});
});
test("Current birthday owner's like does not inflate the ordinary count", () => {
  const likes = [{messageId:"mine",userId:"self",createdAt:"2026-10-05T00:00:00+09:00"}];
  assert.deepEqual(summarizeMessageLikes(likes,"mine","self"),{ownerLiked:true,otherCount:0,viewerLiked:true});
  assert.deepEqual(summarizeMessageLikes([],"mine","self"),{ownerLiked:false,otherCount:0,viewerLiked:false});
});
