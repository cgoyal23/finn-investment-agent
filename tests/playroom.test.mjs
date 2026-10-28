import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
const code = ts.transpileModule(
  fs.readFileSync(new URL("../lib/playroom.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  makeDeck,
  answerCorrect,
  numericAnswer,
  scoreAnswers,
  recordGame,
  emptyStats,
  restoreStats,
  remainingTime,
  indiaDay,
} = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const record = (id, day, extra = {}) => ({
  id,
  day,
  game: "sprint",
  level: "starter",
  timed: false,
  score: 12,
  correct: 1,
  answered: 1,
  total: 15,
  ...extra,
});
test("daily decks repeat for the same day and change for a different day", () => {
  const a = makeDeck("daily", "starter", "FINN:2026-10-28");
  assert.equal(a.length, 8);
  assert.deepEqual(a, makeDeck("daily", "starter", "FINN:2026-10-28"));
  assert.notDeepEqual(a, makeDeck("daily", "starter", "FINN:2026-10-29"));
});
test("math generators produce correct finite answers across both difficulty levels", () => {
  for (const level of ["starter", "stretch"])
    for (let seed = 0; seed < 20; seed++)
      for (const q of makeDeck("sprint", level, String(seed))) {
        const [a, b] = q.prompt.match(/\d+/g).map(Number);
        let expected;
        if (q.prompt.includes("%")) expected = (a * b) / 100;
        else if (q.prompt.includes("+")) expected = a + b;
        else if (q.prompt.includes("−")) expected = a - b;
        else if (q.prompt.includes("×")) expected = a * b;
        else expected = a / b;
        assert.equal(q.answer, expected, q.prompt);
        assert.ok(Number.isFinite(q.answer));
        assert.ok(answerCorrect(q, String(expected)));
      }
});
test("returns questions have distinct options and exactly one accepted answer", () => {
  for (let seed = 0; seed < 100; seed++)
    for (const q of makeDeck("returns", "starter", String(seed))) {
      assert.equal(new Set(q.options).size, q.options.length, q.prompt);
      assert.equal(q.options.filter((_, i) => answerCorrect(q, i)).length, 1);
      assert.ok(q.answer >= 0 && q.answer < q.options.length);
    }
});
test("detective rounds contain six distinct source cases", () => {
  for (let seed = 0; seed < 30; seed++) {
    const deck = makeDeck("detective", "starter", String(seed));
    assert.equal(new Set(deck.map((q) => q.context)).size, 6);
    assert.equal(deck.length, 6);
  }
});
test("numeric input accepts ordinary decimals and grouping but rejects malformed or non-numeric values", () => {
  assert.equal(numericAnswer(" 1,200.5 "), 1200.5);
  assert.equal(numericAnswer("-2.5"), -2.5);
  assert.equal(numericAnswer(".25"), 0.25);
  for (const text of [
    "",
    " ",
    "NaN",
    "Infinity",
    "0x10",
    "1e3",
    "1,2",
    "25%",
    "12abc",
  ])
    assert.equal(numericAnswer(text), null, text);
});
test("score streaks reward correct answers and reset on a miss or skip", () => {
  assert.equal(scoreAnswers([]), 0);
  assert.equal(scoreAnswers([true, true, false, true]), 38);
  assert.equal(scoreAnswers([true, true, true, true, true, true]), 100);
  assert.equal(scoreAnswers([false, false]), 0);
});
test("progress ignores empty runs, is idempotent and tracks calendar practice days", () => {
  const initial = emptyStats();
  assert.equal(
    recordGame(
      initial,
      record("zero", "2026-10-28", { answered: 0, correct: 0, score: 0 }),
    ),
    initial,
  );
  const first = recordGame(initial, record("a", "2026-10-31"));
  assert.equal(first.streak, 1);
  assert.equal(recordGame(first, record("a", "2026-10-31")), first);
  const same = recordGame(first, record("b", "2026-10-31"));
  assert.equal(same.streak, 1);
  const next = recordGame(same, record("c", "2026-11-01"));
  assert.equal(next.streak, 2);
  assert.equal(next.totalRuns, 3);
  assert.equal(next.totalPoints, 36);
  const gap = recordGame(next, record("d", "2026-11-03"));
  assert.equal(gap.streak, 1);
  assert.equal(gap.bestStreak, 2);
});
test("daily completion survives the bounded recent-history list and best scores separate timed practice", () => {
  let stats = recordGame(
    emptyStats(),
    record("daily", "2026-10-28", {
      game: "daily",
      score: 100,
      correct: 8,
      answered: 8,
      total: 8,
    }),
  );
  stats = recordGame(
    stats,
    record("timed", "2026-10-28", { timed: true, score: 70 }),
  );
  for (let i = 0; i < 25; i++)
    stats = recordGame(stats, record("r" + i, "2026-10-28"));
  assert.equal(stats.runs.length, 20);
  assert.equal(stats.lastDailyDay, "2026-10-28");
  assert.equal(stats.best["sprint:starter:timed"], 70);
  assert.equal(stats.best["sprint:starter:practice"], 12);
});
test("corrupt saved progress cannot create negative or nonfinite scores", () => {
  const stats = restoreStats({
    totalRuns: -1,
    totalPoints: Infinity,
    streak: "9",
    best: { "sprint:starter:timed": NaN, __proto__: 4 },
    runs: [{ id: "bad" }],
  });
  assert.equal(stats.totalRuns, 0);
  assert.equal(stats.totalPoints, 0);
  assert.equal(stats.streak, 0);
  assert.deepEqual(stats.best, {});
  assert.deepEqual(stats.runs, []);
});
test("timers clamp at zero and daily challenges use the India calendar boundary", () => {
  assert.equal(remainingTime(60000, 61000), 0);
  assert.equal(remainingTime(60000, 60000), 0);
  assert.equal(remainingTime(60000, 59000), 1000);
  assert.equal(indiaDay(new Date("2026-10-28T18:29:59Z")), "2026-10-28");
  assert.equal(indiaDay(new Date("2026-10-28T18:30:00Z")), "2026-10-29");
});
