"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  Check,
  CheckCircle2,
  Copy,
  Flame,
  Gamepad2,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  Search,
  SkipForward,
  Sparkles,
  Target,
  Timer,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import {
  answerCorrect,
  emptyStats,
  gameNames,
  indiaDay,
  makeDeck,
  numericAnswer,
  recordGame,
  remainingTime,
  restoreStats,
  resultKey,
  scoreAnswers,
  type GameId,
  type GameRecord,
  type Level,
  type PlayStats,
  type Question,
} from "@/lib/playroom";
const games = [
  {
    id: "sprint" as const,
    title: "Number Sprint",
    tag: "FAST THINKING",
    icon: Zap,
    description: "Beat the clock with arithmetic and percentage puzzles.",
    detail: "60-second sprint or 15-question untimed practice",
    className: "sprint",
  },
  {
    id: "returns" as const,
    title: "Returns Rally",
    tag: "FINANCIAL INTUITION",
    icon: Target,
    description:
      "Decode price charts, returns and margins. Dodge the percentage traps.",
    detail: "6 questions · explanations after every answer",
    className: "returns",
  },
  {
    id: "detective" as const,
    title: "Evidence Detective",
    tag: "THINK LIKE AN ANALYST",
    icon: Search,
    description: "A report. A claim. Can the evidence actually support it?",
    detail: "6 cases · no prior finance knowledge needed",
    className: "detective",
  },
];
type Attempt = {
  question: Question;
  given: string | number | null;
  correct: boolean;
};
type Run = {
  id: string;
  game: GameId;
  level: Level;
  questions: Question[];
  index: number;
  attempts: Attempt[];
  timed: boolean;
  deadline: number | null;
  remaining: number;
  paused: boolean;
  day: string;
};
type Result = { record: GameRecord; attempts: Attempt[] };
function FictionalChart({ values }: { values: number[] }) {
  const low = Math.min(...values) - 5,
    high = Math.max(...values) + 5,
    w = 430,
    h = 140;
  const path = values
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${20 + (i / (values.length - 1)) * (w - 40)},${h - 25 - ((v - low) / (high - low)) * (h - 50)}`,
    )
    .join(" ");
  return (
    <figure className="play-chart">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={"Fictional prices by session: " + values.join(", ")}
      >
        {[30, 70, 110].map((y) => (
          <line
            key={y}
            x1="20"
            x2="410"
            y1={y}
            y2={y}
            stroke="#d3dfcd"
            strokeDasharray="3 6"
          />
        ))}
        <path d={path} fill="none" stroke="#397d65" strokeWidth="3" />
        {values.map((v, i) => (
          <g key={i}>
            <circle
              cx={20 + (i / (values.length - 1)) * (w - 40)}
              cy={h - 25 - ((v - low) / (high - low)) * (h - 50)}
              r="4"
              fill="#397d65"
            />
            <text
              x={20 + (i / (values.length - 1)) * (w - 40)}
              y={h - 31 - ((v - low) / (high - low)) * (h - 50)}
              textAnchor="middle"
              fontSize="12"
              fill="#425e4a"
            >
              ₹{v}
            </text>
          </g>
        ))}
      </svg>
      <figcaption>Fictional sequence · use the start and end prices</figcaption>
    </figure>
  );
}
export function Playroom({ storageKey }: { storageKey: string }) {
  const [stats, setStats] = useState<PlayStats>(emptyStats),
    [ready, setReady] = useState(false),
    [run, setRun] = useState<Run | null>(null),
    [result, setResult] = useState<Result | null>(null),
    [feedback, setFeedback] = useState<Attempt | null>(null),
    [input, setInput] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [level, setLevel] = useState<Level>("starter"),
    [timed, setTimed] = useState(true),
    [now, setNow] = useState(Date.now());
  const resultsRef = useRef<HTMLElement>(null),
    questionRef = useRef<HTMLHeadingElement>(null);
  const inputRef = useRef<HTMLInputElement>(null),
    nextRef = useRef<HTMLButtonElement>(null),
    finished = useRef("");
  const today = indiaDay(),
    key = storageKey + "-playroom";
  useEffect(() => {
    try {
      setStats(restoreStats(JSON.parse(localStorage.getItem(key) || "null")));
    } catch {
      setNotice("Progress could not be restored. You can still play.");
    }
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(stats));
    } catch {
      setNotice(
        "Progress could not be saved in this browser. Copy your result to keep a record.",
      );
    }
  }, [stats, ready, key]);
  useEffect(() => {
    if (!run?.timed || run.paused) return;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [run?.id, run?.timed, run?.paused]);
  useEffect(() => {
    if (!run?.timed || run.paused) return;
    const pause = () => {
      if (document.hidden)
        setRun((current) =>
          current
            ? {
                ...current,
                remaining: remainingTime(current.deadline!, Date.now()),
                paused: true,
              }
            : current,
        );
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, [run?.id, run?.timed, run?.paused]);
  useEffect(() => {
    if (feedback) nextRef.current?.focus();
    else if (run && !run.paused) {
      if (run.questions[run.index].options) questionRef.current?.focus();
      else inputRef.current?.focus();
    }
  }, [feedback, run?.index, run?.paused]);
  useEffect(() => {
    if (result) resultsRef.current?.focus();
  }, [result?.record.id]);
  const remaining = run?.timed
    ? run.paused
      ? run.remaining
      : remainingTime(run.deadline!, now)
    : 0;
  const finish = (current: Run) => {
    if (finished.current === current.id) return;
    finished.current = current.id;
    const record: GameRecord = {
      id: current.id,
      game: current.game,
      level: current.level,
      timed: current.timed,
      day: current.day,
      score: scoreAnswers(current.attempts.map((a) => a.correct)),
      correct: current.attempts.filter((a) => a.correct).length,
      answered: current.attempts.length,
      total: current.questions.length,
    };
    setResult({ record, attempts: current.attempts });
    setRun(null);
    setFeedback(null);
    setStats((s) => recordGame(s, record));
  };
  useEffect(() => {
    if (run?.timed && !run.paused && remaining <= 0) finish(run);
  }, [remaining, run?.id, run?.paused]);
  const start = (game: GameId) => {
    const day = indiaDay(),
      activeLevel = game === "sprint" ? level : "starter",
      clock = game === "sprint" && timed;
    const seed =
      game === "daily"
        ? `FINN:${day}`
        : `${game}:${Date.now()}:${Math.random()}`;
    const deck = makeDeck(game, activeLevel, seed),
      questions = game === "sprint" && !clock ? deck.slice(0, 15) : deck;
    const at = Date.now();
    setNow(at);
    finished.current = "";
    setResult(null);
    setFeedback(null);
    setInput("");
    setError("");
    setNotice("");
    setRun({
      id: crypto.randomUUID(),
      game,
      level: activeLevel,
      questions,
      index: 0,
      attempts: [],
      timed: clock,
      deadline: clock ? at + 60000 : null,
      remaining: 60000,
      paused: false,
      day,
    });
  };
  const check = (given: string | number | null) => {
    if (!run || feedback || run.paused) return;
    if (run.timed && remainingTime(run.deadline!, Date.now()) === 0) {
      finish(run);
      return;
    }
    const question = run.questions[run.index],
      attempt = {
        question,
        given,
        correct: given !== null && answerCorrect(question, given),
      };
    setRun({ ...run, attempts: [...run.attempts, attempt] });
    setFeedback(attempt);
    setError("");
  };
  const next = () => {
    if (!run) return;
    if (run.index + 1 >= run.questions.length) {
      finish(run);
      return;
    }
    setRun({ ...run, index: run.index + 1 });
    setFeedback(null);
    setInput("");
    setError("");
  };
  const pause = () => {
    if (!run) return;
    setRun({
      ...run,
      remaining: run.timed ? remainingTime(run.deadline!, Date.now()) : 0,
      paused: true,
    });
  };
  const resume = () => {
    if (!run) return;
    const at = Date.now();
    setNow(at);
    setRun({
      ...run,
      deadline: run.timed ? at + run.remaining : null,
      paused: false,
    });
  };
  const copy = async () => {
    if (!result) return;
    const r = result.record;
    const text = `FINN Playroom · ${gameNames[r.game]}\n${r.score} points · ${r.correct}/${r.answered} correct · ${r.timed ? "60-second round" : "untimed practice"}\n${r.level} · ${r.day} (IST)\nTry a round: https://finn-investment-agent.vercel.app/#arcade`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Score card copied. Share it wherever you like.");
    } catch {
      setNotice(
        "Clipboard access is unavailable. Your result is still shown here.",
      );
    }
  };
  const yesterday = new Date(Date.parse(today + "T00:00:00Z") - 86400000)
      .toISOString()
      .slice(0, 10),
    streak = [today, yesterday].includes(stats.lastDay) ? stats.streak : 0;
  const dailyDone = stats.lastDailyDay === today;
  if (!ready)
    return (
      <section className="panel play-opening">
        <Gamepad2 size={26} />
        <p>Opening the Playroom…</p>
      </section>
    );
  return (
    <div className="playroom">
      <div className="play-heading">
        <div>
          <div className="eyebrow">
            <Gamepad2 size={14} />
            THE FINN PLAYROOM
          </div>
          <h1>
            A little play.
            <br />
            <em>A sharper mind.</em>
          </h1>
          <p>Build number sense. Read the signals. Question the evidence.</p>
        </div>
        <div className="play-streak">
          <Flame size={20} />
          <strong>{streak}</strong>
          <span>
            day practice streak<small>Progress stays in this browser</small>
          </span>
        </div>
      </div>
      {notice && (
        <p className="play-notice" role="status">
          {notice}
        </p>
      )}
      {!run && !result && (
        <>
          <section className="play-daily">
            <div className="daily-dice" aria-hidden="true">
              <span>f.</span>
              <i />
              <i />
              <i />
            </div>
            <div>
              <span className="play-overline">
                TODAY’S DAILY MIX · {today} · IST
              </span>
              <h2>Eight questions. One fresh perspective.</h2>
              <p>
                A shared daily set of maths, returns and evidence puzzles. Take
                your time.
              </p>
              <small>
                {dailyDone
                  ? "Completed today. Replay to improve your personal score."
                  : "Complete the set and make today a practice day."}
              </small>
            </div>
            <button className="button primary" onClick={() => start("daily")}>
              {dailyDone ? "Play again" : "Play today’s mix"}
              <ArrowRight size={15} />
            </button>
          </section>
          <div className="play-mode-title">
            <h2>Choose your workout</h2>
            <span>Original FINN games · fictional examples · points only</span>
          </div>
          <div className="play-cards">
            {games.map((g) => (
              <article className={"play-game-card " + g.className} key={g.id}>
                <div className="play-card-art" aria-hidden="true">
                  <g.icon size={34} />
                  <span>
                    {g.id === "sprint"
                      ? "12 × 8"
                      : g.id === "returns"
                        ? "+10% ≠ −10%"
                        : "SOURCE → CLAIM"}
                  </span>
                  <i />
                  <i />
                  <i />
                </div>
                <span className="play-overline">{g.tag}</span>
                <h2>{g.title}</h2>
                <p>{g.description}</p>
                <small>{g.detail}</small>
                {g.id === "sprint" && (
                  <div className="sprint-settings">
                    <div role="group" aria-label="Number Sprint difficulty">
                      {(["starter", "stretch"] as Level[]).map((l) => (
                        <button
                          key={l}
                          className={l === level ? "active" : ""}
                          aria-pressed={l === level}
                          onClick={() => setLevel(l)}
                        >
                          {l === "starter" ? "Starter" : "Stretch"}
                        </button>
                      ))}
                    </div>
                    <div role="group" aria-label="Number Sprint timer">
                      <button
                        className={timed ? "active" : ""}
                        aria-pressed={timed}
                        onClick={() => setTimed(true)}
                      >
                        60 seconds
                      </button>
                      <button
                        className={!timed ? "active" : ""}
                        aria-pressed={!timed}
                        onClick={() => setTimed(false)}
                      >
                        Untimed
                      </button>
                    </div>
                  </div>
                )}
                <button className="play-start" onClick={() => start(g.id)}>
                  Let’s play
                  <ArrowUpRight size={16} />
                </button>
              </article>
            ))}
          </div>
          <section className="play-progress">
            <div>
              <div className="eyebrow">YOUR OWN HIGH SCORE TO BEAT</div>
              <h2>Small sessions add up.</h2>
              <p>
                {stats.totalRuns} rounds played · {stats.totalPoints} lifetime
                points · best streak {stats.bestStreak} days
              </p>
            </div>
            <div className="play-milestones">
              {[
                {
                  title: "First round",
                  icon: Play,
                  earned: stats.totalRuns > 0,
                  detail: "Finish a round with an answer",
                },
                {
                  title: "Three-day streak",
                  icon: Flame,
                  earned: stats.bestStreak >= 3,
                  detail: "Practise on three consecutive days",
                },
                {
                  title: "Century club",
                  icon: Trophy,
                  earned: Object.values(stats.best).some((n) => n >= 100),
                  detail: "Score 100 points in one round",
                },
                {
                  title: "Evidence eye",
                  icon: Search,
                  earned: Object.entries(stats.best).some(
                    ([k, n]) => k.startsWith("detective:") && n >= 100,
                  ),
                  detail: "Solve all six detective cases",
                },
              ].map((b) => (
                <div className={b.earned ? "earned" : ""} key={b.title}>
                  <b.icon size={19} />
                  <strong>{b.title}</strong>
                  <small>{b.detail}</small>
                  <span>{b.earned ? "Earned" : "In progress"}</span>
                </div>
              ))}
            </div>
          </section>
          {!!stats.runs.length && (
            <section className="panel play-history">
              <h2>Your recent rounds</h2>
              {stats.runs.slice(0, 5).map((r) => (
                <div key={r.id}>
                  <span>
                    {gameNames[r.game]}
                    <small>
                      {r.day} · {r.timed ? "timed" : "untimed"} · {r.level}
                    </small>
                  </span>
                  <strong>
                    {r.score}
                    <small>points</small>
                  </strong>
                  <span>
                    {r.correct}/{r.answered} correct
                  </span>
                </div>
              ))}
            </section>
          )}
          <p className="play-footnote">
            +10 points for a correct answer, plus a 2–10 point streak bonus. A
            wrong answer or skip resets the answer streak. Daily practice
            streaks count calendar days in India Standard Time. Scores are
            personal browser records.
          </p>
        </>
      )}
      {run && (
        <section className={"play-arena " + (run.paused ? "paused" : "")}>
          <div className="arena-top">
            <div>
              <span className="play-overline">
                {gameNames[run.game]} ·{" "}
                {run.level === "stretch" ? "STRETCH" : "STARTER"}
              </span>
              <h2>{run.paused ? "Take a breath." : "Find your flow."}</h2>
            </div>
            <div className="arena-counters">
              <span>
                <Trophy size={15} />
                <strong>
                  {scoreAnswers(run.attempts.map((a) => a.correct))}
                </strong>
                points
              </span>
              <span
                className={run.timed && remaining < 10000 ? "time-low" : ""}
              >
                <Timer size={15} />
                <strong
                  role="timer"
                  aria-label="Time remaining"
                  aria-live="off"
                >
                  {run.timed ? `${Math.ceil(remaining / 1000)}s` : "∞"}
                </strong>
                {run.timed ? "remaining" : "untimed"}
              </span>
              <button
                className="icon-button"
                aria-label={run.paused ? "Resume round" : "Pause round"}
                onClick={run.paused ? resume : pause}
              >
                {run.paused ? <Play size={17} /> : <Pause size={17} />}
              </button>
              <button
                className="icon-button"
                aria-label="End round and see results"
                onClick={() => finish(run)}
              >
                <X size={17} />
              </button>
            </div>
          </div>
          <div className="arena-progress">
            <span
              style={{ width: `${(run.index / run.questions.length) * 100}%` }}
            />
          </div>
          {run.paused ? (
            <div className="arena-paused">
              <Pause size={35} />
              <h2>Your round is paused.</h2>
              <p>
                {run.timed
                  ? "The clock is paused too. Switching browser tabs pauses timed rounds automatically."
                  : "Come back when you’re ready."}
              </p>
              <button className="button primary" onClick={resume}>
                Resume round
                <Play size={14} />
              </button>
            </div>
          ) : (
            <div className="arena-question" key={run.index}>
              <div className="question-meta">
                <span>{run.questions[run.index].category}</span>
                <span>
                  Question {run.index + 1} of {run.questions.length}
                </span>
              </div>
              {run.questions[run.index].context && (
                <blockquote>
                  <span>
                    {run.questions[run.index].category === "Evidence detective"
                      ? "FICTIONAL SOURCE EXTRACT"
                      : "SCENARIO"}
                  </span>
                  {run.questions[run.index].context}
                </blockquote>
              )}
              {run.questions[run.index].chart && (
                <FictionalChart values={run.questions[run.index].chart!} />
              )}
              <h3
                ref={questionRef}
                tabIndex={-1}
                className={
                  run.questions[run.index].options
                    ? "word-question"
                    : "number-question"
                }
              >
                {run.questions[run.index].prompt}
              </h3>
              {run.questions[run.index].options ? (
                <div className="answer-options">
                  {run.questions[run.index].options!.map((option, i) => (
                    <button
                      key={option}
                      disabled={!!feedback}
                      className={
                        feedback
                          ? i === run.questions[run.index].answer
                            ? "right"
                            : i === feedback.given
                              ? "wrong"
                              : ""
                          : ""
                      }
                      onClick={() => check(i)}
                    >
                      <span>{String.fromCharCode(65 + i)}</span>
                      {option}
                      {feedback && i === run.questions[run.index].answer && (
                        <Check size={17} />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  className="number-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (feedback) {
                      next();
                      return;
                    }
                    if (numericAnswer(input) === null) {
                      setError("Enter a number, such as 12 or 12.5.");
                      return;
                    }
                    check(input);
                  }}
                >
                  <label htmlFor="play-answer">Your answer</label>
                  <div>
                    <input
                      id="play-answer"
                      ref={inputRef}
                      inputMode="decimal"
                      autoComplete="off"
                      value={input}
                      readOnly={!!feedback}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setError("");
                      }}
                      placeholder="Type a number"
                      aria-invalid={!!error}
                      aria-describedby={error ? "play-answer-error" : undefined}
                    />
                    {!feedback && (
                      <button className="button primary" type="submit">
                        Check
                        <ArrowRight size={15} />
                      </button>
                    )}
                  </div>
                  {error && (
                    <p id="play-answer-error" role="alert">
                      {error}
                    </p>
                  )}
                </form>
              )}
              {feedback ? (
                <div
                  className={
                    "answer-feedback " +
                    (feedback.correct ? "correct" : "incorrect")
                  }
                  role="status"
                >
                  <div>
                    {feedback.correct ? (
                      <CheckCircle2 size={21} />
                    ) : (
                      <Lightbulb size={21} />
                    )}
                    <strong>
                      {feedback.correct
                        ? "You got it."
                        : feedback.given === null
                          ? "Let’s work it through."
                          : "A useful one to learn."}
                    </strong>
                  </div>
                  <p>{feedback.question.explanation}</p>
                  {!feedback.question.options && (
                    <small>Answer: {feedback.question.answer}</small>
                  )}
                  <button
                    ref={nextRef}
                    className="button primary"
                    onClick={next}
                  >
                    {run.index + 1 === run.questions.length
                      ? "See results"
                      : "Next question"}
                    <ArrowRight size={15} />
                  </button>
                </div>
              ) : (
                <button className="play-skip" onClick={() => check(null)}>
                  <SkipForward size={13} />
                  Skip and see why
                </button>
              )}
            </div>
          )}
          <div className="arena-bottom">
            <Brain size={14} />
            <span>
              {run.timed
                ? "Accuracy builds the streak. Enter checks a numeric answer."
                : "No clock pressure. Read the explanation and practise the idea."}
            </span>
            <small>Fictional examples</small>
          </div>
        </section>
      )}
      {result && (
        <section
          className="play-results"
          ref={resultsRef}
          tabIndex={-1}
          aria-label="Round results"
        >
          <div className="result-celebration" aria-hidden="true">
            <Trophy size={38} />
            <span />
            <span />
            <span />
          </div>
          <div className="play-overline">
            {gameNames[result.record.game]} · ROUND FINISHED
          </div>
          <h2>
            {result.record.answered
              ? result.record.correct === result.record.answered
                ? "That was sharp."
                : "A little sharper than before."
              : "Ready when you are."}
          </h2>
          <p>
            {result.record.answered
              ? "The best part is knowing why. Keep the lessons, then try another round."
              : "No answers were submitted, so your progress has not changed."}
          </p>
          <div className="result-numbers">
            <div>
              <strong>{result.record.score}</strong>
              <span>points</span>
            </div>
            <div>
              <strong>
                {result.record.correct}/{result.record.answered}
              </strong>
              <span>correct / attempted</span>
            </div>
            <div>
              <strong>
                {result.record.answered
                  ? Math.round(
                      (result.record.correct / result.record.answered) * 100,
                    )
                  : 0}
                %
              </strong>
              <span>accuracy, including skips</span>
            </div>
          </div>
          <div className="result-personal-best">
            <Trophy size={15} />
            Personal best for this mode:{" "}
            {stats.best[resultKey(result.record)] || 0} points
            <span>
              {result.record.level} ·{" "}
              {result.record.timed ? "timed" : "untimed"}
            </span>
          </div>
          <div className="result-actions">
            <button
              className="button primary"
              onClick={() => start(result.record.game)}
            >
              <RotateCcw size={14} />
              Play again
            </button>
            <button
              className="button secondary"
              onClick={() => setResult(null)}
            >
              Choose a game
              <ArrowRight size={14} />
            </button>
            <button className="button secondary" onClick={copy}>
              <Copy size={14} />
              Copy score card
            </button>
          </div>
          {!!result.attempts.length && (
            <details className="result-review">
              <summary>Review your {result.attempts.length} answers</summary>
              {result.attempts.map((a, i) => (
                <article key={a.question.id}>
                  <span className={a.correct ? "correct" : "incorrect"}>
                    {a.correct ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <Lightbulb size={15} />
                    )}
                    Question {i + 1} ·{" "}
                    {a.given === null
                      ? "Skipped"
                      : a.correct
                        ? "Correct"
                        : "Learned"}
                  </span>
                  <h3>{a.question.prompt}</h3>
                  <p>{a.question.explanation}</p>
                </article>
              ))}
            </details>
          )}
        </section>
      )}
    </div>
  );
}
