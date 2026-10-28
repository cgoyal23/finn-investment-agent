export type GameId = "sprint" | "returns" | "detective" | "daily";
export type Level = "starter" | "stretch";
export type Question = {
  id: string;
  category: string;
  prompt: string;
  context?: string;
  answer: number;
  options?: string[];
  explanation: string;
  chart?: number[];
};
export type GameRecord = {
  id: string;
  game: GameId;
  level: Level;
  timed: boolean;
  day: string;
  score: number;
  correct: number;
  answered: number;
  total: number;
};
export type PlayStats = {
  runs: GameRecord[];
  totalRuns: number;
  totalPoints: number;
  streak: number;
  bestStreak: number;
  lastDay: string;
  lastDailyDay: string;
  best: Record<string, number>;
};
export const emptyStats = (): PlayStats => ({
  runs: [],
  totalRuns: 0,
  totalPoints: 0,
  streak: 0,
  bestStreak: 0,
  lastDay: "",
  lastDailyDay: "",
  best: {},
});
export function indiaDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function seededRandom(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const round = (n: number) => Math.round(n * 100) / 100;
const pct = (n: number) => `${round(n)}%`;
const choose = <T>(items: T[], r: () => number) =>
  items[Math.floor(r() * items.length)];
function choice(
  id: string,
  category: string,
  prompt: string,
  answers: string[],
  correct: number,
  explanation: string,
  r: () => number,
  context?: string,
  chart?: number[],
): Question {
  const order = answers.map((text, index) => ({ text, index }));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    id,
    category,
    prompt,
    options: order.map((x) => x.text),
    answer: order.findIndex((x) => x.index === correct),
    explanation,
    context,
    chart,
  };
}
function mathQuestion(i: number, r: () => number, level: Level): Question {
  const a =
      level === "starter"
        ? 12 + Math.floor(r() * 60)
        : 40 + Math.floor(r() * 160),
    b = 2 + Math.floor(r() * (level === "starter" ? 10 : 18)),
    op = Math.floor(r() * 5);
  if (op === 0)
    return {
      id: `m${i}`,
      category: "Quick arithmetic",
      prompt: `${a} + ${b}`,
      answer: a + b,
      explanation: `${a} + ${b} = ${a + b}. Group into tens first, then add the remainder.`,
    };
  if (op === 1)
    return {
      id: `m${i}`,
      category: "Quick arithmetic",
      prompt: `${a} − ${b}`,
      answer: a - b,
      explanation: `${a} − ${b} = ${a - b}. Subtract the nearest ten, then adjust.`,
    };
  if (op === 2)
    return {
      id: `m${i}`,
      category: "Quick arithmetic",
      prompt: `${b} × ${level === "starter" ? Math.ceil(a / 5) : a}`,
      answer: b * (level === "starter" ? Math.ceil(a / 5) : a),
      explanation: `Split the larger factor into tens and units, multiply each part by ${b}, then add.`,
    };
  if (op === 3)
    return {
      id: `m${i}`,
      category: "Quick arithmetic",
      prompt: `${a * b} ÷ ${b}`,
      answer: a,
      explanation: `${b} × ${a} = ${a * b}, so the quotient is ${a}.`,
    };
  const rate = choose([5, 10, 20, 25, 50], r),
    base = (2 + Math.floor(r() * 12)) * 20;
  return {
    id: `m${i}`,
    category: "Percent sense",
    prompt: `${rate}% of ${base}`,
    answer: (base * rate) / 100,
    explanation: `${base} × ${rate}/100 = ${(base * rate) / 100}. ${rate === 25 ? "25% is one quarter." : rate === 50 ? "50% is one half." : "Find 10% or 5% first and scale it."}`,
  };
}
function returnsQuestion(i: number, r: () => number, level: Level): Question {
  const type = i % 6;
  if (type === 0) {
    const loss = choose(
        level === "starter" ? [20, 25, 50] : [10, 20, 25, 40],
        r,
      ),
      recovery = round((loss / (100 - loss)) * 100);
    return choice(
      `r${i}`,
      "Recovery maths",
      `A fictional share falls ${loss}% from ₹100. What gain gets it back to ₹100?`,
      [pct(recovery), pct(loss), pct(loss / 2)],
      0,
      `It falls to ₹${100 - loss}. Recovering ₹${loss} from that lower base needs ${loss}/ ${100 - loss} × 100 = ${recovery}%. Equal percentage losses and gains do not cancel.`,
      r,
    );
  }
  if (type === 1) {
    const before = choose([15, 20, 25], r),
      after = before + 5;
    return choice(
      `r${i}`,
      "Margin detective",
      `Operating margin rises from ${before}% to ${after}%. How many basis points is the increase?`,
      ["500 bps", "5 bps", "50 bps"],
      0,
      "One percentage point equals 100 basis points. A five-percentage-point increase is 500 basis points.",
      r,
      "Fictional results. Compare the same reporting basis and period.",
    );
  }
  if (type === 2) {
    const up = choose([10, 20, 30], r),
      down = choose([10, 20], r),
      answer = (up - down) / 2;
    return choice(
      `r${i}`,
      "Portfolio arithmetic",
      `Two equal starting holdings return +${up}% and −${down}%. What is their combined return?`,
      [pct(answer), pct(up), pct(-down)],
      0,
      `With equal starting weights and no flows or rebalancing, the return is 0.5 × ${up}% + 0.5 × (−${down}%) = ${answer}%.`,
      r,
      "Fictional one-period holdings; no fees or dividends.",
    );
  }
  if (type === 3) {
    const finish = choose([90, 110, 120, 130], r),
      answer = finish - 100;
    return choice(
      `r${i}`,
      "Read the chart",
      `This fictional price starts at ₹100 and ends at ₹${finish}. What is the price return?`,
      [pct(answer), pct(answer + 10), pct(answer - 10)],
      0,
      `Use the endpoints: (${finish} / 100 − 1) × 100 = ${answer}%. A peak in the middle does not determine the period return.`,
      r,
      "Fictional closing prices. Dividends and fees excluded.",
      [100, 105, 95, 115, finish],
    );
  }
  if (type === 4) {
    const gain = choose([5, 10, 15], r),
      dividend = choose([2, 3, 4], r);
    return choice(
      `r${i}`,
      "Total return",
      `A fictional share bought for ₹100 ends at ₹${100 + gain} and pays ₹${dividend} cash dividend. What is total return?`,
      [pct(gain + dividend), pct(gain), pct(dividend)],
      0,
      `(Ending price − starting price + dividend) / starting price × 100 = (${gain} + ${dividend}) / 100 × 100 = ${gain + dividend}%.`,
      r,
      "One share; before fees and taxes, with no dividend reinvestment.",
    );
  }
  const revenue = choose([500, 1000, 2000], r),
    margin = choose([10, 15, 20, 25], r),
    profit = (revenue * margin) / 100;
  return choice(
    `r${i}`,
    "Know the numbers",
    `Revenue is ₹${revenue} and profit after tax is ₹${profit}. What is net profit margin?`,
    [pct(margin), pct(margin + 5), pct(margin / 2)],
    0,
    `Net profit margin = profit after tax / revenue × 100 = ${profit} / ${revenue} × 100 = ${margin}%.`,
    r,
    "Fictional figures for the same period and reporting entity.",
  );
}
const evidenceCases = [
  {
    context:
      "Annual report: revenue was ₹100 crore, compared with ₹80 crore in the prior year.",
    claim: "Revenue grew by 25%.",
    answer: 0,
    why: "(100 / 80 − 1) × 100 = 25%. The periods and revenue figures support this calculation.",
  },
  {
    context:
      "Results: revenue ₹100 crore; profit after tax ₹20 crore for the same period.",
    claim: "The net profit margin is 30%.",
    answer: 2,
    why: "20 / 100 × 100 = 20%. The figures contradict a 30% net margin.",
  },
  {
    context:
      "Annual report extract: cash and cash equivalents are ₹50 crore. Borrowings are not included in this extract.",
    claim: "The company is debt-free.",
    answer: 1,
    why: "Cash alone does not tell us the amount of borrowings. The extract does not establish that debt is zero.",
  },
  {
    context:
      "Management guided full-year constant-currency growth of 5–7%. The full-year result reports 6% constant-currency growth.",
    claim: "Growth finished within the stated range.",
    answer: 0,
    why: "6% is inside 5–7%, and both refer to the same full year and constant-currency measure.",
  },
  {
    context:
      "A filing announces a new product. The share price rises 3% on the same day.",
    claim: "The product announcement caused the entire price rise.",
    answer: 1,
    why: "Events happening on the same day do not establish causation. Other information and market moves could matter.",
  },
  {
    context:
      "Earnings transcript: reported dollar-revenue growth was 10%; constant-currency growth was 6%.",
    claim: "Constant-currency revenue grew 10%.",
    answer: 2,
    why: "The source explicitly states 6% for constant currency. Reported dollar growth is a different measure.",
  },
  {
    context:
      "Results: reported operating margin 20%; adjusted operating margin 22%.",
    claim: "Reported operating margin was 22%.",
    answer: 2,
    why: "Adjusted margin cannot replace the reported figure. The source gives reported margin as 20%.",
  },
  {
    context:
      "Trading volume was twice the average of the preceding 20 sessions. No business results are supplied.",
    claim: "The company’s profit will rise next quarter.",
    answer: 1,
    why: "More shares changing hands does not establish future profit. Financial and operating evidence is missing.",
  },
  {
    context:
      "The annual report states ₹40 crore of cash from operations and ₹10 crore of capital spending.",
    claim: "Operating cash minus capital spending is ₹30 crore.",
    answer: 0,
    why: "40 − 10 = 30. This arithmetic is supported; check the company’s definition before calling it a reported free-cash-flow metric.",
  },
  {
    context:
      "The source is a FY2025 annual report. No FY2026 results are supplied.",
    claim: "These figures establish the latest FY2026 performance.",
    answer: 1,
    why: "A prior-year report cannot establish a later year’s results. Date the source and obtain the missing period.",
  },
];
function evidenceQuestion(
  i: number,
  r: () => number,
  item = evidenceCases[0],
): Question {
  return choice(
    `e${i}`,
    "Evidence detective",
    item.claim,
    ["Supported", "Not established", "Contradicted"],
    item.answer,
    item.why,
    r,
    item.context,
  );
}
export function makeDeck(game: GameId, level: Level, seed: string): Question[] {
  const r = seededRandom(seed),
    cases = [...evidenceCases];
  for (let i = cases.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [cases[i], cases[j]] = [cases[j], cases[i]];
  }
  const count = game === "sprint" ? 60 : game === "daily" ? 8 : 6;
  return Array.from({ length: count }, (_, i) =>
    game === "sprint"
      ? mathQuestion(i, r, level)
      : game === "returns"
        ? returnsQuestion(i, r, level)
        : game === "detective"
          ? evidenceQuestion(i, r, cases[i])
          : i % 3 === 0
            ? mathQuestion(i, r, "starter")
            : i % 3 === 1
              ? returnsQuestion(i, r, "starter")
              : evidenceQuestion(i, r, cases[i]),
  );
}
export function numericAnswer(value: string): number | null {
  const raw = value.trim();
  if (raw.includes(",") && !/^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/.test(raw))
    return null;
  const clean = raw.replaceAll(",", "");
  return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(clean) &&
    Number.isFinite(Number(clean))
    ? Number(clean)
    : null;
}
export function answerCorrect(q: Question, value: string | number): boolean {
  return q.options
    ? typeof value === "number" && value === q.answer
    : numericAnswer(String(value)) !== null &&
        Math.abs(numericAnswer(String(value))! - q.answer) < 0.005;
}
export function scoreAnswers(correct: boolean[]): number {
  let streak = 0;
  return correct.reduce((score, right) => {
    streak = right ? streak + 1 : 0;
    return score + (right ? 10 + Math.min(streak, 5) * 2 : 0);
  }, 0);
}
export function remainingTime(deadline: number, now: number) {
  return Math.max(0, deadline - now);
}
export function resultKey(
  record: Pick<GameRecord, "game" | "level" | "timed">,
) {
  return `${record.game}:${record.level}:${record.timed ? "timed" : "practice"}`;
}
export function recordGame(stats: PlayStats, run: GameRecord): PlayStats {
  if (!run.answered || stats.runs.some((r) => r.id === run.id)) return stats;
  const previous = new Date(Date.parse(run.day + "T00:00:00Z") - 86400000)
    .toISOString()
    .slice(0, 10);
  const streak =
    stats.lastDay === run.day
      ? stats.streak
      : stats.lastDay === previous
        ? stats.streak + 1
        : 1;
  return {
    ...stats,
    runs: [run, ...stats.runs].slice(0, 20),
    totalRuns: stats.totalRuns + 1,
    totalPoints: stats.totalPoints + run.score,
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    lastDay: run.day,
    lastDailyDay:
      run.game === "daily" && run.answered === run.total
        ? run.day
        : stats.lastDailyDay,
    best: {
      ...stats.best,
      [resultKey(run)]: Math.max(stats.best[resultKey(run)] || 0, run.score),
    },
  };
}
export function restoreStats(raw: unknown): PlayStats {
  if (!raw || typeof raw !== "object") return emptyStats();
  const value = raw as any,
    safe = emptyStats();
  for (const key of [
    "totalRuns",
    "totalPoints",
    "streak",
    "bestStreak",
  ] as const)
    if (Number.isSafeInteger(value[key]) && value[key] >= 0 && value[key] < 1e9)
      safe[key] = value[key];
  if (
    typeof value.lastDailyDay === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.lastDailyDay)
  )
    safe.lastDailyDay = value.lastDailyDay;
  if (
    typeof value.lastDay === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.lastDay)
  )
    safe.lastDay = value.lastDay;
  if (value.best && typeof value.best === "object")
    for (const [key, score] of Object.entries(value.best))
      if (
        /^(sprint|returns|detective|daily):(starter|stretch):(timed|practice)$/.test(
          key,
        ) &&
        Number.isSafeInteger(score) &&
        Number(score) >= 0
      )
        safe.best[key] = Number(score);
  if (Array.isArray(value.runs))
    safe.runs = value.runs
      .filter(
        (r: any) =>
          r &&
          typeof r.id === "string" &&
          ["sprint", "returns", "detective", "daily"].includes(r.game) &&
          ["starter", "stretch"].includes(r.level) &&
          typeof r.timed === "boolean" &&
          /^\d{4}-\d{2}-\d{2}$/.test(r.day) &&
          ["score", "correct", "answered", "total"].every(
            (k) => Number.isSafeInteger(r[k]) && r[k] >= 0,
          ) &&
          r.correct <= r.answered &&
          r.answered <= r.total,
      )
      .slice(0, 20);
  return safe;
}
export const gameNames: Record<GameId, string> = {
  sprint: "Number Sprint",
  returns: "Returns Rally",
  detective: "Evidence Detective",
  daily: "Daily Mix",
};
