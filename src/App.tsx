import React, { useMemo, useState } from "react";

type Emotion =
  | "焦慮"
  | "不甘心"
  | "憤怒"
  | "沮喪"
  | "羞愧"
  | "恐懼"
  | "空虛"
  | "其他";

type Impulse = "立刻行動" | "逃避" | "自責" | "控制" | "其他";
type Need = "安全感" | "被肯定" | "被尊重" | "休息" | "確定感" | "被理解" | "其他";

type Entry = {
  id: string;
  ts: number;
  eventText: string;
  emotions: Emotion[];
  intensity: number; // 0-10
  impulse: Impulse;
  autoThought: string;
  need: Need;
  microAction: string;
  selfTalk: string;
};

const EMOTIONS: Emotion[] = ["焦慮", "不甘心", "憤怒", "沮喪", "羞愧", "恐懼", "空虛", "其他"];
const IMPULSES: Impulse[] = ["立刻行動", "逃避", "自責", "控制", "其他"];
const NEEDS: Need[] = ["安全感", "被肯定", "被尊重", "休息", "確定感", "被理解", "其他"];

const MICRO_ACTION_PRESETS = [
  "先停 15 分鐘不做任何決定",
  "去洗臉＋走動 5 分鐘",
  "今天不碰交易，只整理資料",
  "先把話寫下來，不送出",
];

const SELF_TALK_PRESETS = ["我不用現在就證明一切", "情緒不是指令", "我先照顧自己，再處理事情"];

const STORAGE_KEY = "emotionfind.entries.v1";

// ---------- storage ----------
function loadEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Entry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntry(entry: Entry) {
  const entries = loadEntries();
  entries.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ---------- stable UI components (IMPORTANT: outside App) ----------
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.chip,
        ...(active ? styles.chipActive : {}),
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function Primary({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={styles.primary} type="button">
      {children}
    </button>
  );
}

function Secondary({ onClick, children }: { onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={styles.secondary} type="button">
      {children}
    </button>
  );
}

// ---------- App ----------
export default function App() {
  const [route, setRoute] = useState<"home" | "record" | "history" | "done">("home");
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries());

  // record state
  const [eventText, setEventText] = useState("");
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [impulse, setImpulse] = useState<Impulse>("立刻行動");
  const [autoThought, setAutoThought] = useState("");
  const [need, setNeed] = useState<Need>("安全感");
  const [microAction, setMicroAction] = useState(MICRO_ACTION_PRESETS[0] ?? "");
  const [selfTalk, setSelfTalk] = useState(SELF_TALK_PRESETS[0] ?? "");
  const [step, setStep] = useState(0);

  const canNext = useMemo(() => {
    if (step === 1) return emotions.length > 0; // 情緒至少一個
    return true;
  }, [step, emotions.length]);

  function resetRecord() {
    setEventText("");
    setEmotions([]);
    setIntensity(5);
    setImpulse("立刻行動");
    setAutoThought("");
    setNeed("安全感");
    setMicroAction(MICRO_ACTION_PRESETS[0] ?? "");
    setSelfTalk(SELF_TALK_PRESETS[0] ?? "");
    setStep(0);
  }

  function toggleEmotion(e: Emotion) {
    setEmotions((prev) => {
      if (prev.includes(e)) return prev.filter((x) => x !== e);
      if (prev.length >= 2) return [prev[0], e]; // 最多 2 個
      return [...prev, e];
    });
  }

  function submit() {
    const entry: Entry = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      eventText: eventText.trim(),
      emotions,
      intensity: clamp(intensity, 0, 10),
      impulse,
      autoThought: autoThought.trim(),
      need,
      microAction: microAction.trim(),
      selfTalk: selfTalk.trim(),
    };
    saveEntry(entry);
    setEntries(loadEntries());
    setRoute("done");
  }

  // ---------- routes ----------
  if (route === "home") {
    return (
      <Page>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={styles.title}>EmotionFind</div>
            <div style={styles.sub}>60 秒即時情緒察覺</div>
          </div>
          <Secondary onClick={() => setRoute("history")}>查看紀錄</Secondary>
        </div>

        <div style={{ height: 18 }} />

        <Primary
          onClick={() => {
            resetRecord();
            setRoute("record");
          }}
        >
          我現在有情緒
        </Primary>

        <div style={{ height: 12 }} />

        <div style={styles.hint}>
          小提醒：先「看見」就好，不用解釋、不用分析。<br />
          情緒不是指令。
        </div>
      </Page>
    );
  }

  if (route === "history") {
    return (
      <Page>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={styles.title}>紀錄</div>
          <Secondary onClick={() => setRoute("home")}>返回</Secondary>
        </div>

        <div style={{ height: 12 }} />

        {entries.length === 0 ? (
          <div style={styles.hint}>目前還沒有紀錄。先按「我現在有情緒」記一筆。</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.slice(0, 50).map((e) => (
              <div key={e.id} style={styles.row}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{fmtTime(e.ts)}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                  {e.emotions.map((x) => (
                    <span key={x} style={styles.badge}>
                      {x}
                    </span>
                  ))}
                  <span style={styles.badge}>強度 {e.intensity}</span>
                  <span style={styles.badge}>{e.impulse}</span>
                </div>
                {e.eventText ? <div style={{ marginTop: 6, opacity: 0.85 }}>{e.eventText}</div> : null}
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 12 }} />

        <Secondary
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setEntries([]);
          }}
        >
          清空本機紀錄
        </Secondary>
      </Page>
    );
  }

  if (route === "done") {
    return (
      <Page>
        <div style={styles.title}>完成</div>
        <div style={{ height: 8 }} />
        <div style={styles.hint}>已為自己停下 60 秒。</div>
        <div style={{ height: 16 }} />

        <Primary
          onClick={() => {
            resetRecord();
            setRoute("record");
          }}
        >
          再記一筆
        </Primary>

        <div style={{ height: 10 }} />
        <Secondary onClick={() => setRoute("home")}>回首頁</Secondary>
      </Page>
    );
  }

  // ---------- record ----------
  const steps = [
    {
      title: "① 發生了什麼？（事件）",
      body: (
        <>
          <div style={styles.label}>我注意到：</div>
          <input
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
            placeholder="客觀一句話（可留空）"
            style={styles.input}
          />
          <div style={styles.hint}>例：他用很不耐煩的語氣回我</div>
        </>
      ),
    },
    {
      title: "② 我現在的情緒是？（選 1–2 個）",
      body: (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {EMOTIONS.map((e) => (
              <Chip key={e} active={emotions.includes(e)} onClick={() => toggleEmotion(e)}>
                {e}
              </Chip>
            ))}
          </div>

          <div style={{ height: 14 }} />

          <div style={styles.label}>強度（0–10）：{intensity}</div>
          <input
            type="range"
            min={0}
            max={10}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <div style={styles.hint}>不用想對不對，先圈就好。</div>
        </>
      ),
    },
    {
      title: "③ 我當下最想做什麼？（衝動）",
      body: (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {IMPULSES.map((x) => (
              <Chip key={x} active={impulse === x} onClick={() => setImpulse(x)}>
                {x}
              </Chip>
            ))}
          </div>
          <div style={styles.hint}>不評價，只是辨識。</div>
        </>
      ),
    },
    {
      title: "④ 我腦中正在相信的一句話是？",
      body: (
        <>
          <div style={styles.label}>我在想：</div>
          <input
            value={autoThought}
            onChange={(e) => setAutoThought(e.target.value)}
            placeholder="例如：我一定要現在證明自己（可留空）"
            style={styles.input}
          />
        </>
      ),
    },
    {
      title: "⑤ 我真正需要的是？（選 1 個）",
      body: (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {NEEDS.map((x) => (
              <Chip key={x} active={need === x} onClick={() => setNeed(x)}>
                {x}
              </Chip>
            ))}
          </div>
        </>
      ),
    },
    {
      title: "⑥ 我願意選擇的最小不傷自己的行動",
      body: (
        <>
          <div style={styles.label}>快速選一個：</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MICRO_ACTION_PRESETS.map((x) => (
              <button
                key={x}
                onClick={() => setMicroAction(x)}
                style={{
                  ...styles.pickRow,
                  ...(microAction === x ? styles.pickRowActive : {}),
                }}
                type="button"
              >
                {x}
              </button>
            ))}
          </div>

          <div style={{ height: 12 }} />

          <div style={styles.label}>或自己填：</div>
          <input
            value={microAction}
            onChange={(e) => setMicroAction(e.target.value)}
            placeholder="很小也沒關係"
            style={styles.input}
          />
        </>
      ),
    },
    {
      title: "🔒 結尾一句（很重要）",
      body: (
        <>
          <div style={styles.label}>對自己說一句：</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SELF_TALK_PRESETS.map((x) => (
              <Chip key={x} active={selfTalk === x} onClick={() => setSelfTalk(x)}>
                {x}
              </Chip>
            ))}
          </div>

          <div style={{ height: 12 }} />

          <input
            value={selfTalk}
            onChange={(e) => setSelfTalk(e.target.value)}
            placeholder="例如：情緒不是指令"
            style={styles.input}
          />
        </>
      ),
    },
  ] as const;

  const isLast = step === steps.length - 1;

  return (
    <Page>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={styles.title}>記錄</div>
        <Secondary
          onClick={() => {
            resetRecord();
            setRoute("home");
          }}
        >
          取消
        </Secondary>
      </div>

      <div style={{ height: 8 }} />
      <div style={{ fontSize: 12, opacity: 0.7 }}>
        Step {step + 1} / {steps.length}
      </div>

      <div style={{ height: 14 }} />

      <div style={{ fontSize: 16, fontWeight: 700 }}>{steps[step].title}</div>
      <div style={{ height: 12 }} />
      <div>{steps[step].body}</div>

      <div style={{ height: 18 }} />

      <div style={{ display: "flex", gap: 10 }}>
        <Secondary onClick={() => setStep((s) => Math.max(0, s - 1))}>上一步</Secondary>

        <div style={{ flex: 1 }} />

        {!isLast ? (
          <Primary
            onClick={() => {
              if (!canNext) return;
              setStep((s) => Math.min(steps.length - 1, s + 1));
            }}
          >
            下一步
          </Primary>
        ) : (
          <Primary onClick={submit}>送出</Primary>
        )}
      </div>

      {!canNext ? <div style={{ marginTop: 10, color: "#b00020" }}>請先選至少 1 個情緒（最多 2 個）。</div> : null}
    </Page>
  );
}

// ---------- styles ----------
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "#0b0f17",
    color: "#eef2ff",
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji",
  },
  card: {
    width: "min(520px, 100%)",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 18,
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  },
  title: { fontSize: 20, fontWeight: 800, letterSpacing: 0.2 },
  sub: { fontSize: 13, opacity: 0.75, marginTop: 4 },
  label: { fontSize: 13, opacity: 0.8, marginBottom: 8 },
  hint: { fontSize: 12, opacity: 0.75, lineHeight: 1.6 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.15)",
    outline: "none",
    background: "rgba(0,0,0,0.2)",
    color: "inherit",
    fontSize: 14,
  },
  chip: {
    padding: "10px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.15)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 14,
  },
  chipActive: {
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.12)",
  },
  primary: {
    width: "100%",
    padding: "14px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.20)",
    background: "rgba(255,255,255,0.18)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: 800,
  },
  secondary: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: 13,
  },
  row: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 12,
    opacity: 0.9,
  },
  pickRow: {
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 14,
  },
  pickRowActive: {
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(255,255,255,0.10)",
  },
};
