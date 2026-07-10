import React, { useState, useEffect, useRef } from "react";
import { Flame, Wind, Clock, Globe2, MoonStar, RefreshCw, Check, Shuffle, SlidersHorizontal, X } from "lucide-react";

/* ============ THEME — red-light safe, no blue glow ============ */
const T = {
  bg: "#171010",
  surface: "#231714",
  raised: "#2E1E18",
  line: "#3D2A20",
  text: "#F3E2C7",
  dim: "#B39372",
  faint: "#7A6250",
  ember: "#E8944A",
  emberDeep: "#C05B32",
  glow: "rgba(232,148,74,0.16)",
  good: "#C9A94E",
};

const STORAGE_KEY = "ember:v1";

/* Works inside Claude (window.storage) and on a deployed site (browser storage) */
const store = {
  async get(k) {
    if (typeof window !== "undefined" && window.storage) return window.storage.get(k);
    const v = window.localStorage.getItem(k);
    return v == null ? null : { key: k, value: v };
  },
  async set(k, v) {
    if (typeof window !== "undefined" && window.storage) return window.storage.set(k, v);
    window.localStorage.setItem(k, v);
    return { key: k, value: v };
  },
};

/* ============ DECKS ============ */
const DECKS = {
  signal: [
    { id: "red", label: "Switch to red lights", detail: "Your cue that the day is over", gentle: true },
    { id: "glasses", label: "Blue light glasses on", detail: "If any screens stay on tonight", gentle: true },
    { id: "kitchen", label: "Kitchen closed", detail: "No more food — light and early wins", gentle: true },
    { id: "tea", label: "Brew a sleepy tea", detail: "Chamomile, lemon balm, or valerian blend", gentle: true },
    { id: "dim", label: "Dim the house, phone to night mode", detail: "Lower every light you pass", gentle: true },
  ],
  body: [
    { id: "shower", label: "Candlelit shower with slow jazz", detail: "Warm water, low light, no rush" },
    { id: "taichi", label: "Tai chi wind-down flow", detail: "5–10 minutes of slow weight shifts", gentle: true },
    { id: "yoga", label: "Gentle yoga stretch", detail: "Child’s pose, cat–cow, forward fold" },
    { id: "legs", label: "Legs up the wall", detail: "5 minutes, breathe into your belly", gentle: true },
    { id: "neck", label: "Neck + shoulder release", detail: "Slow circles — physically drop the day", gentle: true },
    { id: "chakra", label: "Chakra wind-down", usesChakra: true, gentle: true },
  ],
  mind: [
    { id: "journal", label: "Journal — tonight’s prompt", usesPrompt: true, gentle: true },
    { id: "read", label: "Read a chapter", detail: "Paper over screens if you can" },
    { id: "meditate", label: "Meditate", detail: "Open Calm or Headspace", gentle: true },
    { id: "rabbit", label: "Sleepy rabbit hole", usesTopic: true },
    { id: "three", label: "Three good things from today", detail: "Say them out loud or jot them down", gentle: true },
    { id: "tarot", label: "Pull a tarot card", usesTarot: true, gentle: true },
  ],
  settle: [
    { id: "supp", label: "Supplement check", detail: "Valerian root or whatever you’ve settled on with your doctor", gentle: true },
    { id: "breathe", label: "One round of 4–7–8 breathing", detail: "Guided in the Breathe tab", gentle: true },
    { id: "cool", label: "Lights out, cool the room", detail: "Cooler is sleepier", gentle: true },
  ],
};

const PHASE_NAMES = { signal: "Signal", body: "Body", mind: "Mind", settle: "Settle" };

const PROMPTS = [
  "What is one thing from today you want to remember?",
  "What can wait until tomorrow? Write it down and let it go.",
  "What felt heavy today — and what would lighter look like?",
  "Who made today better, even a little?",
  "What did your body need today that it didn’t get?",
  "Finish this: “Tomorrow, the only thing that matters is…”",
  "What is something you handled better than you would have a year ago?",
  "What are you quietly proud of this week?",
  "If today had a title, what would it be?",
  "What is one worry you can hand to tomorrow-you?",
  "What sounded, smelled, or tasted good today?",
  "What do you want more of in your evenings?",
];

const TOPICS = [
  "How sailors navigated by the stars before compasses",
  "The history of tea — from Tang dynasty China to London",
  "Daily life inside a medieval monastery",
  "Why Roman roads still exist two thousand years later",
  "The great libraries of the ancient world",
  "How lighthouses worked before electricity",
  "The slowest luxuries of the Silk Road",
  "How cathedrals were built across whole centuries",
  "The history of timekeeping, from sundials to clock towers",
  "Star maps and constellations across different cultures",
  "The quiet history of gardens, from Persia to Kyoto",
  "How Venice was built on water",
];

/* ============ TAROT — Major Arcana, night reflections ============ */
const TAROT = [
  { name: "The Fool", text: "What would tomorrow look like if you began it lightly, without the whole story?" },
  { name: "The Magician", text: "You already had every tool you needed today. Set them down for the night." },
  { name: "The High Priestess", text: "Something in you already knows. Let sleep do the listening." },
  { name: "The Empress", text: "Tend to yourself the way you'd tend a garden — gently, and then rest." },
  { name: "The Emperor", text: "Structure held you today. Now let it hold itself until morning." },
  { name: "The Hierophant", text: "What ritual is quietly working for you? Honor it tonight." },
  { name: "The Lovers", text: "What did you choose today that you'd gladly choose again?" },
  { name: "The Chariot", text: "You steered all day. Take your hands off the reins." },
  { name: "Strength", text: "Soft strength counts too. Where were you gentle when you could have been hard?" },
  { name: "The Hermit", text: "The quiet you're stepping into isn't loneliness — it's your lantern." },
  { name: "Wheel of Fortune", text: "Some of today was luck, good and bad. Neither needs solving tonight." },
  { name: "Justice", text: "The scales can hold themselves overnight. Weigh things again in daylight." },
  { name: "The Hanged Man", text: "Seen from another angle, what looked stuck today might just be pausing." },
  { name: "Death", text: "Something ended today, even something small. Let it end." },
  { name: "Temperance", text: "Not too much, not too little. What did balance feel like today?" },
  { name: "The Devil", text: "What kept you tethered tonight — a screen, a worry? Name it, then set it down." },
  { name: "The Tower", text: "If something cracked today, remember: cleared ground is buildable ground." },
  { name: "The Star", text: "Hope is a slow, quiet light. Let one hopeful thought be your last tonight." },
  { name: "The Moon", text: "Not everything needs to be clear before you rest. The moon never explains." },
  { name: "The Sun", text: "Find the warmest moment of today and fall asleep inside it." },
  { name: "Judgement", text: "You don't have to be the judge tonight. Court is adjourned." },
  { name: "The World", text: "Something in your life just completed a circle. Notice it." },
];

/* ============ CHAKRAS — night practices, root to crown ============ */
const CHAKRAS = [
  { name: "Root", sanskrit: "Muladhara", color: "#A6402F", practice: "Lie flat and let the mattress hold your full weight. You are supported — nothing to grip." },
  { name: "Sacral", sanskrit: "Svadhisthana", color: "#D97B33", practice: "Rest warm palms on your lower belly and breathe into them. Slow circles if it feels good." },
  { name: "Solar Plexus", sanskrit: "Manipura", color: "#D9B23A", practice: "Unclench the day's effort — soften your stomach on each exhale, three slow times." },
  { name: "Heart", sanskrit: "Anahata", color: "#7FA65A", practice: "One hand on your heart. Name one thing you're grateful for, and one person." },
  { name: "Throat", sanskrit: "Vishuddha", color: "#6E8FA6", practice: "Hum softly on your exhale for a minute — the vibration itself is the wind-down." },
  { name: "Third Eye", sanskrit: "Ajna", color: "#6F5E8C", practice: "Close your eyes and rest attention between your brows. Nothing to see — just settle there." },
  { name: "Crown", sanskrit: "Sahasrara", color: "#9B7FA6", practice: "Imagine the day lifting off the top of your head like steam. Let your mind empty upward." },
];

/* ============ WISDOM POT ============ */
const WISDOM = [
  { id: "twosleeps", title: "The two sleeps", origin: "Medieval Europe", desc: "Before electric light, many people slept in two shifts with a calm hour awake between them. If you wake at 3am, don’t fight it — sit up, do something quiet and dim, and return when heavy." },
  { id: "ofuro", title: "Ofuro — the deep hot bath", origin: "Japan", desc: "A hot soak 60–90 minutes before bed. The body-temperature drop afterwards is what triggers drowsiness — your candlelit shower works the same lever." },
  { id: "nidra", title: "Yoga nidra", origin: "India", desc: "“The sleep of the yogis” — a lying-down guided body scan. Calm and Headspace both carry versions; it’s one of the best-studied wind-downs there is." },
  { id: "moonmilk", title: "Warm spiced milk", origin: "Ayurveda, India", desc: "Warm milk with nutmeg or cardamom before bed — the ancestor of the modern “moon milk.” Ritual plus warmth plus a little tryptophan." },
  { id: "footsoak", title: "The evening foot soak", origin: "China", desc: "Warm water to the ankles for 10–15 minutes. Traditional medicine says it draws heat downward; modern take: it’s deeply relaxing and warms the extremities, which helps sleep onset." },
  { id: "chamomile", title: "Chamomile", origin: "Ancient Egypt + Greece", desc: "One of the oldest recorded sleep remedies on Earth. If tea is in your routine, you’re continuing a very long tradition." },
  { id: "valerian", title: "Valerian root", origin: "Ancient Greece + Rome", desc: "Galen prescribed it for insomnia nearly two thousand years ago. Your supplement has one of the longest track records in history." },
  { id: "lavender", title: "Lavender under the pillow", origin: "Provence, France", desc: "Dried lavender sachets tucked into bedding. Scent is a powerful sleep cue because it bypasses the thinking brain entirely." },
  { id: "duvets", title: "Two duvets, one bed", origin: "Scandinavia", desc: "Each sleeper gets their own duvet — no tug-of-war, fewer micro-wakings. Widely credited for calmer couple sleep." },
  { id: "hammock", title: "Rocked to sleep", origin: "Yucatán, Mexico", desc: "Generations have slept in hammocks — and studies show gentle rocking genuinely deepens sleep. A slow rocking chair during wind-down borrows the effect." },
  { id: "porch", title: "The sleeping porch", origin: "Early 1900s America", desc: "Whole families slept on screened porches for cold, fresh air. The modern translation: crack a window, drop the thermostat, sleep cooler." },
  { id: "weighted", title: "Deep pressure", origin: "Nordic care tradition", desc: "Weighted blankets came out of Scandinavian occupational therapy — steady, even pressure reads as safety to the nervous system." },
  { id: "zen", title: "Count exhales, not sheep", origin: "Zen Buddhism", desc: "Count each exhale, one to ten, then start over. Lose count? Just begin again — losing count is the practice working." },
  { id: "siesta", title: "Respect the afternoon dip", origin: "Spain + Mexico", desc: "Cultures with siestas work with the body’s natural mid-afternoon lull. If you nap: short (20 min) and early, so it doesn’t steal from the night." },
  { id: "compline", title: "Compline + the Great Silence", origin: "Benedictine monasteries", desc: "Monks end each day with one final prayer, then keep complete silence until morning — and have for 1,500 years. The borrowable part: pick a “last word” time after which there’s no talking, no scrolling, just quiet." },
  { id: "shema", title: "The bedtime Shema", origin: "Jewish tradition", desc: "Recited in bed, and it begins with forgiving anyone who wronged you that day — so you never carry a grudge into sleep. Try releasing the day’s frictions as your closing line." },
  { id: "metta", title: "Loving-kindness (metta)", origin: "Buddhist tradition", desc: "Silently wish well: first to yourself, then someone dear, someone neutral, someone difficult. A classic drift-off practice — the mind can’t hold resentment and this at the same time." },
  { id: "lion", title: "The sleeping lion posture", origin: "Buddhist monasteries", desc: "The Buddha slept on his right side, hand under his cheek, legs gently stacked — still taught in monasteries today as the posture of restful ease. Worth a try if you toss." },
  { id: "review", title: "The evening review", origin: "Seneca, Rome + Ignatius, Spain", desc: "Both the Stoics and the Jesuits ended the day the same way: What did I do well? Where did I slip? What remains for tomorrow? Then — crucially — close the books. The review has an ending." },
  { id: "dhikr", title: "Dhikr — quiet remembrance", origin: "Islamic tradition", desc: "A soft, rhythmic repetition of short phrases before sleep, often counted on the fingers, after the evening ablution — the washing itself marks the transition out of the day. Rhythm, repetition, ritual water: three sleep levers in one tradition." },
  { id: "beads", title: "Beads in every tradition", origin: "Mala, rosary, komboskini, misbaha", desc: "Nearly every culture independently invented prayer beads: a repeated phrase plus something for the hands to do occupies the restless mind completely. Any calm phrase counted on beads or fingers works." },
  { id: "abhyanga", title: "Abhyanga — warm oil massage", origin: "Ayurveda, India", desc: "Self-massage with warm oil before an evening bath. Slow strokes, feet especially. One of the oldest “transition out of the day” rituals on record." },
  { id: "shabbat", title: "The weekly full stop", origin: "Shabbat, Jewish tradition", desc: "One evening a week: candles lit, work closed, screens down — a hard boundary the whole nervous system learns to expect. Even a secular version (one protected evening) can reset a whole week of sleep." },
];

const VERDICTS = ["untried", "try", "worked", "nope"];
const VERDICT_LABEL = { untried: "Untried", try: "Want to try", worked: "Worked for me", nope: "Not for me" };

/* ============ BREATHING ============ */
const PATTERNS = [
  { id: "478", name: "4–7–8", origin: "Pranayama roots · popularized by Dr. Weil", steps: [ { name: "Inhale", secs: 4, scale: 1 }, { name: "Hold", secs: 7, scale: 1 }, { name: "Exhale", secs: 8, scale: 0.55 } ], note: "The classic pre-sleep pattern. The long exhale is the sedative part." },
  { id: "box", name: "Box breathing", origin: "Used by militaries + meditators alike", steps: [ { name: "Inhale", secs: 4, scale: 1 }, { name: "Hold", secs: 4, scale: 1 }, { name: "Exhale", secs: 4, scale: 0.55 }, { name: "Hold", secs: 4, scale: 0.55 } ], note: "Even and steadying — good when your mind is racing." },
  { id: "ext", name: "Long exhale", origin: "The simplest sleep breath", steps: [ { name: "Inhale", secs: 4, scale: 1 }, { name: "Exhale", secs: 6, scale: 0.55 } ], note: "Exhaling longer than you inhale nudges the nervous system toward rest." },
  { id: "coherent", name: "Coherent breathing", origin: "~6 breaths per minute", steps: [ { name: "Inhale", secs: 5, scale: 1 }, { name: "Exhale", secs: 5, scale: 0.55 } ], note: "Slow, even, and easy to sustain for 5–10 minutes." },
];

/* ============ HELPERS ============ */
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const todayStr = () => new Date().toDateString();

const EMPTY_CUSTOM = { signal: [], body: [], mind: [], settle: [] };

function mergeDecks(customCards) {
  const c = customCards || EMPTY_CUSTOM;
  const out = {};
  Object.keys(DECKS).forEach((p) => { out[p] = [...DECKS[p], ...(c[p] || [])]; });
  return out;
}

function dealItem(decks, phase, excludeIds = [], gentleOnly = false) {
  let pool = decks[phase].filter((c) => !excludeIds.includes(c.id));
  if (gentleOnly) {
    const g = pool.filter((c) => c.gentle);
    if (g.length) pool = g;
  }
  if (!pool.length) pool = decks[phase];
  const card = rand(pool);
  return { phase, ...card, done: false };
}

function dealRoutine(decks, energy) {
  const gentle = energy === "gentle";
  const phases = gentle ? ["signal", Math.random() < 0.5 ? "body" : "mind", "settle"] : ["signal", "body", "mind", "settle"];
  return {
    date: todayStr(),
    ts: Date.now(),
    energy,
    prompt: rand(PROMPTS),
    topic: rand(TOPICS),
    tarot: rand(TAROT),
    chakra: rand(CHAKRAS),
    items: phases.map((p) => dealItem(decks, p, [], gentle)),
  };
}

function parseHM(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}
function fmtMin(mins) {
  mins = ((mins % 1440) + 1440) % 1440;
  let h = Math.floor(mins / 60), m = mins % 60;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

/* ============ SMALL UI ============ */
const Card = ({ children, style }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, ...style }}>{children}</div>
);

const SectionLabel = ({ children }) => (
  <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: T.faint, fontWeight: 700, margin: "4px 0 10px" }}>{children}</div>
);

const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    background: active ? T.ember : "transparent",
    color: active ? "#20130B" : T.dim,
    border: `1px solid ${active ? T.ember : T.line}`,
    borderRadius: 999, padding: "7px 14px", fontSize: 13, fontWeight: 600,
    fontFamily: "inherit", cursor: "pointer",
  }}>{children}</button>
);

/* ============ MAIN APP ============ */
export default function EmberApp() {
  const [tab, setTab] = useState("tonight");
  const [loaded, setLoaded] = useState(false);
  const [routine, setRoutine] = useState(null);
  const [energy, setEnergy] = useState("full");
  const [data, setData] = useState({ history: [], ratings: [], wisdom: {} });

  /* load */
  useEffect(() => {
    (async () => {
      try {
        const res = await store.get(STORAGE_KEY);
        if (res && res.value) {
          const saved = JSON.parse(res.value);
          if (saved.data) setData({ ...saved.data, customCards: { ...EMPTY_CUSTOM, ...(saved.data.customCards || {}) } });
          if (saved.routine) { setRoutine(saved.routine); setEnergy(saved.routine.energy || "full"); }
        }
      } catch (e) { /* first run — nothing saved yet */ }
      setLoaded(true);
    })();
  }, []);

  const decks = mergeDecks(data.customCards);

  /* save */
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try { await store.set(STORAGE_KEY, JSON.stringify({ routine, data })); }
      catch (e) { console.error("save failed", e); }
    })();
  }, [routine, data, loaded]);

  const tabs = [
    { id: "tonight", label: "Tonight", Icon: Flame },
    { id: "breathe", label: "Breathe", Icon: Wind },
    { id: "times", label: "Times", Icon: Clock },
    { id: "wisdom", label: "Wisdom", Icon: Globe2 },
    { id: "data", label: "Nights", Icon: MoonStar },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Karla', sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Karla:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; }
        button { font-family: 'Karla', sans-serif; }
        input[type="time"] { color-scheme: dark; }
        @keyframes emberflicker { 0%,100% { opacity: .85 } 50% { opacity: 1 } }
      `}</style>

      {/* header */}
      <div style={{ padding: "22px 20px 8px", maxWidth: 560, width: "100%", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, letterSpacing: 0.3 }}>Ember</div>
          <div style={{ color: T.faint, fontSize: 13, alignSelf: "flex-end", paddingBottom: 6 }}>red-light safe by design</div>
          <div style={{ flex: 1 }} />
          <button onClick={() => setTab(tab === "settings" ? "tonight" : "settings")} title="Your deck" style={{
            background: tab === "settings" ? T.raised : "none", border: `1px solid ${tab === "settings" ? T.ember : T.line}`,
            color: tab === "settings" ? T.ember : T.dim, borderRadius: 10, padding: 8, cursor: "pointer",
            display: "flex", alignItems: "center",
          }}><SlidersHorizontal size={18} /></button>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px 110px", maxWidth: 560, width: "100%", margin: "0 auto" }}>
        {!loaded ? (
          <div style={{ color: T.faint, padding: 40, textAlign: "center" }}>Warming up…</div>
        ) : (
          <>
            {tab === "tonight" && <Tonight routine={routine} setRoutine={setRoutine} energy={energy} setEnergy={setEnergy} data={data} setData={setData} decks={decks} goBreathe={() => setTab("breathe")} />}
            {tab === "breathe" && <Breathe />}
            {tab === "times" && <Times />}
            {tab === "wisdom" && <Wisdom data={data} setData={setData} />}
            {tab === "data" && <Nights data={data} setData={setData} />}
            {tab === "settings" && <SettingsView data={data} setData={setData} />}
          </>
        )}
      </div>

      {/* tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(23,16,16,0.96)", borderTop: `1px solid ${T.line}`, backdropFilter: "blur(8px)" }}>
        <div style={{ display: "flex", maxWidth: 560, margin: "0 auto" }}>
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, background: "none", border: "none", cursor: "pointer",
              padding: "12px 0 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: tab === id ? T.ember : T.faint,
            }}>
              <Icon size={20} strokeWidth={tab === id ? 2.4 : 1.8} />
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.5 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============ TONIGHT ============ */
function Tonight({ routine, setRoutine, energy, setEnergy, data, setData, decks, goBreathe }) {
  const deal = (e) => setRoutine(dealRoutine(decks, e || energy));

  const toggle = (idx) => {
    const items = routine.items.map((it, i) => (i === idx ? { ...it, done: !it.done } : it));
    setRoutine({ ...routine, items });
  };

  const swap = (idx) => {
    const item = routine.items[idx];
    const used = routine.items.map((i) => i.id);
    const next = dealItem(decks, item.phase, used, routine.energy === "gentle");
    const items = routine.items.map((it, i) => (i === idx ? next : it));
    setRoutine({ ...routine, items });
  };

  const allDone = routine && routine.items.every((i) => i.done);
  const alreadyLogged = routine && data.history.some((h) => h.ts === routine.ts);

  const complete = () => {
    if (alreadyLogged) return;
    const entry = { ts: routine.ts, date: routine.date, energy: routine.energy, activities: routine.items.map((i) => i.label) };
    setData({ ...data, history: [...data.history, entry] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 4 }}>Tonight’s hand</div>
        <div style={{ color: T.dim, fontSize: 14, lineHeight: 1.5 }}>Same skeleton every night, different cards — so it never goes stale.</div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Pill active={energy === "full"} onClick={() => setEnergy("full")}>Full routine</Pill>
        <Pill active={energy === "gentle"} onClick={() => setEnergy("gentle")}>Low energy</Pill>
        <div style={{ flex: 1 }} />
        <button onClick={() => deal()} style={{
          display: "flex", alignItems: "center", gap: 6, background: T.ember, color: "#20130B",
          border: "none", borderRadius: 999, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer",
        }}>
          <Shuffle size={15} /> {routine ? "Redeal" : "Deal"}
        </button>
      </div>

      {!routine && (
        <Card style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>{"🌙"}</div>
          <div style={{ color: T.dim, fontSize: 14, lineHeight: 1.6 }}>Tap <b style={{ color: T.ember }}>Deal</b> and Ember will draw tonight’s wind-down from your deck. Swap any card you’re not feeling.</div>
        </Card>
      )}

      {routine && routine.items.map((item, idx) => (
        <Card key={item.phase + item.id + idx} style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start", opacity: item.done ? 0.55 : 1 }}>
          <button onClick={() => toggle(idx)} style={{
            width: 26, height: 26, minWidth: 26, borderRadius: 8, marginTop: 2,
            border: `2px solid ${item.done ? T.ember : T.line}`,
            background: item.done ? T.ember : "transparent",
            color: "#20130B", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>{item.done && <Check size={16} strokeWidth={3} />}</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: T.emberDeep, fontWeight: 700, marginBottom: 3 }}>{PHASE_NAMES[item.phase]}{item.custom && <span style={{ color: T.good, marginLeft: 8, letterSpacing: 1 }}>✦ yours</span>}</div>
            <div style={{ fontWeight: 600, fontSize: 15.5, textDecoration: item.done ? "line-through" : "none" }}>{item.label}</div>
            {item.usesPrompt && <div style={{ color: T.dim, fontSize: 13.5, marginTop: 4, fontStyle: "italic", lineHeight: 1.5 }}>{"“"}{routine.prompt}{"”"}</div>}
            {item.usesTopic && <div style={{ color: T.dim, fontSize: 13.5, marginTop: 4, lineHeight: 1.5 }}>Tonight’s topic: <span style={{ color: T.text }}>{routine.topic}</span></div>}
            {item.usesTarot && routine.tarot && (
              <div style={{ marginTop: 6, background: T.raised, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 15, color: T.ember }}>🂠 {routine.tarot.name}</div>
                <div style={{ color: T.dim, fontSize: 13, marginTop: 3, lineHeight: 1.5, fontStyle: "italic" }}>{routine.tarot.text}</div>
              </div>
            )}
            {item.usesChakra && routine.chakra && (
              <div style={{ marginTop: 6, background: T.raised, border: `1px solid ${T.line}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: routine.chakra.color, boxShadow: `0 0 8px ${routine.chakra.color}` }} />
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: 15 }}>{routine.chakra.name}</span>
                  <span style={{ color: T.faint, fontSize: 12 }}>{routine.chakra.sanskrit}</span>
                </div>
                <div style={{ color: T.dim, fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{routine.chakra.practice}</div>
              </div>
            )}
            {item.detail && <div style={{ color: T.dim, fontSize: 13, marginTop: 3 }}>{item.detail}</div>}
            {item.id === "breathe" && <button onClick={goBreathe} style={{ marginTop: 8, background: "none", border: `1px solid ${T.line}`, color: T.ember, borderRadius: 999, padding: "5px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Open Breathe {"→"}</button>}
          </div>
          <button onClick={() => swap(idx)} title="Swap this card" style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", padding: 4 }}>
            <RefreshCw size={17} />
          </button>
        </Card>
      ))}

      {routine && (
        <button onClick={complete} disabled={alreadyLogged || !allDone} style={{
          background: alreadyLogged ? T.raised : allDone ? T.ember : T.raised,
          color: alreadyLogged ? T.good : allDone ? "#20130B" : T.faint,
          border: "none", borderRadius: 14, padding: "15px 0", fontWeight: 700, fontSize: 15,
          cursor: allDone && !alreadyLogged ? "pointer" : "default",
        }}>
          {alreadyLogged ? "✓ Logged — rate it in Nights tomorrow morning" : allDone ? "Complete tonight’s routine" : "Check off your cards to complete"}
        </button>
      )}
    </div>
  );
}

/* ============ BREATHE ============ */
function Breathe() {
  const [patternId, setPatternId] = useState("478");
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secsLeft, setSecsLeft] = useState(PATTERNS[0].steps[0].secs);
  const [cycles, setCycles] = useState(0);
  const timer = useRef(null);

  const pattern = PATTERNS.find((p) => p.id === patternId);
  const step = pattern.steps[phaseIdx];

  useEffect(() => {
    if (!running) { clearInterval(timer.current); return; }
    timer.current = setInterval(() => setSecsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer.current);
  }, [running]);

  useEffect(() => {
    if (!running || secsLeft > 0) return;
    const next = (phaseIdx + 1) % pattern.steps.length;
    if (next === 0) setCycles((c) => c + 1);
    setPhaseIdx(next);
    setSecsLeft(pattern.steps[next].secs);
  }, [secsLeft, running]); // eslint-disable-line

  const selectPattern = (id) => {
    setRunning(false); setPatternId(id); setPhaseIdx(0); setCycles(0);
    setSecsLeft(PATTERNS.find((p) => p.id === id).steps[0].secs);
  };

  const start = () => { setPhaseIdx(0); setSecsLeft(pattern.steps[0].secs); setCycles(0); setRunning(true); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 4 }}>Breathe</div>
        <div style={{ color: T.dim, fontSize: 14 }}>Follow the ember. It grows when you inhale, fades when you exhale.</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PATTERNS.map((p) => <Pill key={p.id} active={p.id === patternId} onClick={() => selectPattern(p.id)}>{p.name}</Pill>)}
      </div>

      <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "34px 16px 26px" }}>
        <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 150, height: 150, borderRadius: "50%",
            background: `radial-gradient(circle at 40% 35%, ${T.ember}, ${T.emberDeep} 70%)`,
            boxShadow: `0 0 70px 22px ${T.glow}`,
            transform: `scale(${running ? step.scale : 0.75})`,
            transition: `transform ${running ? step.secs : 0.6}s ease-in-out`,
            animation: "emberflicker 3.5s ease-in-out infinite",
          }} />
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, marginTop: 18 }}>{running ? step.name : "Ready"}</div>
        <div style={{ color: T.dim, fontSize: 14, marginTop: 2, minHeight: 20 }}>
          {running ? `${secsLeft}s · cycle ${cycles + 1}` : pattern.note}
        </div>
        <button onClick={running ? () => setRunning(false) : start} style={{
          marginTop: 18, background: running ? "transparent" : T.ember,
          color: running ? T.ember : "#20130B", border: `1.5px solid ${T.ember}`,
          borderRadius: 999, padding: "11px 30px", fontWeight: 700, fontSize: 14, cursor: "pointer",
        }}>{running ? "Stop" : "Begin"}</button>
      </Card>

      <Card style={{ padding: 14 }}>
        <div style={{ fontSize: 13, color: T.faint }}>{pattern.origin}</div>
        <div style={{ fontSize: 14, color: T.dim, marginTop: 4, lineHeight: 1.55 }}>Aim for 4–8 cycles. If holding your breath feels tense, switch to Long exhale — comfort beats precision.</div>
      </Card>
    </div>
  );
}

/* ============ TIMES ============ */
function Times() {
  const [mode, setMode] = useState("wake");
  const [time, setTime] = useState(mode === "wake" ? "06:30" : "22:30");
  const FALL = 15, CYCLE = 90;

  const rows = (() => {
    const t = parseHM(time);
    if (mode === "wake") {
      return [6, 5, 4].map((k) => ({ k, label: fmtMin(t - FALL - k * CYCLE), hrs: (k * 1.5).toFixed(1) }));
    }
    return [4, 5, 6].map((k) => ({ k, label: fmtMin(t + FALL + k * CYCLE), hrs: (k * 1.5).toFixed(1) }));
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 4 }}>Sleep math</div>
        <div style={{ color: T.dim, fontSize: 14, lineHeight: 1.5 }}>Sleep runs in ~90-minute cycles. Waking between cycles feels lighter than waking mid-cycle — these times include ~15 minutes to fall asleep.</div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <Pill active={mode === "wake"} onClick={() => { setMode("wake"); setTime("06:30"); }}>I wake up at…</Pill>
        <Pill active={mode === "bed"} onClick={() => { setMode("bed"); setTime("22:30"); }}>I’ll be in bed at…</Pill>
      </div>

      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
        <div style={{ color: T.dim, fontSize: 14 }}>{mode === "wake" ? "Wake time" : "Bedtime"}</div>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{
          background: T.raised, color: T.text, border: `1px solid ${T.line}`, borderRadius: 10,
          padding: "9px 12px", fontSize: 17, fontFamily: "'Karla', sans-serif", fontWeight: 600,
        }} />
      </Card>

      <SectionLabel>{mode === "wake" ? "Aim to be in bed by" : "Set your alarm for"}</SectionLabel>
      {rows.map((r, i) => (
        <Card key={r.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderColor: i === 0 ? T.emberDeep : T.line }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24 }}>{r.label}</div>
            <div style={{ color: T.faint, fontSize: 12.5, marginTop: 2 }}>{r.k} cycles · {r.hrs} hrs of sleep</div>
          </div>
          {i === 0 && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: T.ember, textTransform: "uppercase" }}>Best</div>}
        </Card>
      ))}

      <div style={{ color: T.faint, fontSize: 12.5, lineHeight: 1.55 }}>Cycles average 90 minutes but vary person to person — your Nights data will teach you your real number over time.</div>
    </div>
  );
}

/* ============ WISDOM ============ */
function Wisdom({ data, setData }) {
  const [filter, setFilter] = useState("all");

  const cycleVerdict = (id) => {
    const cur = data.wisdom[id] || "untried";
    const next = VERDICTS[(VERDICTS.indexOf(cur) + 1) % VERDICTS.length];
    setData({ ...data, wisdom: { ...data.wisdom, [id]: next } });
  };

  const shown = WISDOM.filter((w) => filter === "all" || (data.wisdom[w.id] || "untried") === filter);
  const verdictColor = { untried: T.faint, try: T.ember, worked: T.good, nope: T.faint };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 4 }}>The big pot</div>
        <div style={{ color: T.dim, fontSize: 14, lineHeight: 1.5 }}>How people have wound down across the world and across centuries. Tap the tag to mark what you want to try — and what actually works for you.</div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>All</Pill>
        <Pill active={filter === "try"} onClick={() => setFilter("try")}>Want to try</Pill>
        <Pill active={filter === "worked"} onClick={() => setFilter("worked")}>Worked</Pill>
        <Pill active={filter === "nope"} onClick={() => setFilter("nope")}>Not for me</Pill>
      </div>

      {shown.length === 0 && <Card style={{ textAlign: "center", color: T.faint, padding: 30 }}>Nothing here yet — tag some traditions from the All view.</Card>}

      {shown.map((w) => {
        const v = data.wisdom[w.id] || "untried";
        return (
          <Card key={w.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18 }}>{w.title}</div>
                <div style={{ fontSize: 12, color: T.emberDeep, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>{w.origin}</div>
              </div>
              <button onClick={() => cycleVerdict(w.id)} style={{
                background: v === "untried" ? "transparent" : T.raised,
                border: `1px solid ${v === "untried" ? T.line : verdictColor[v]}`,
                color: verdictColor[v], borderRadius: 999, padding: "6px 12px",
                fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer",
              }}>{VERDICT_LABEL[v]}</button>
            </div>
            <div style={{ color: T.dim, fontSize: 14, lineHeight: 1.6, marginTop: 10 }}>{w.desc}</div>
          </Card>
        );
      })}

      <div style={{ color: T.faint, fontSize: 12.5, lineHeight: 1.55 }}>Anything you swallow — herbs, supplements, teas — is worth a quick check with your doctor, especially alongside valerian.</div>
    </div>
  );
}

/* ============ NIGHTS (DATA) ============ */
function Nights({ data, setData }) {
  const today = todayStr();
  const ratedToday = data.ratings.some((r) => r.date === today);

  const rate = (score) => {
    if (ratedToday) return;
    const lastRoutine = [...data.history].sort((a, b) => b.ts - a.ts)[0];
    const recent = lastRoutine && Date.now() - lastRoutine.ts < 20 * 3600 * 1000;
    setData({
      ...data,
      ratings: [...data.ratings, { date: today, ts: Date.now(), score, activities: recent ? lastRoutine.activities : [] }],
    });
  };

  /* insights: avg score per activity */
  const insights = (() => {
    const acc = {};
    data.ratings.forEach((r) => (r.activities || []).forEach((a) => {
      if (!acc[a]) acc[a] = { sum: 0, n: 0 };
      acc[a].sum += r.score; acc[a].n += 1;
    }));
    return Object.entries(acc)
      .filter(([, v]) => v.n >= 2)
      .map(([label, v]) => ({ label, avg: v.sum / v.n, n: v.n }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 4);
  })();

  const recent = [...data.ratings].sort((a, b) => a.ts - b.ts).slice(-14);
  const avg = data.ratings.length ? (data.ratings.reduce((s, r) => s + r.score, 0) / data.ratings.length).toFixed(1) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 4 }}>Your nights</div>
        <div style={{ color: T.dim, fontSize: 14 }}>Rate each morning. Over time, Ember shows which cards your best nights have in common.</div>
      </div>

      <Card style={{ padding: 18 }}>
        <SectionLabel>Morning check-in</SectionLabel>
        {ratedToday ? (
          <div style={{ color: T.good, fontSize: 14, fontWeight: 600 }}>{"✓"} Logged for today — see you tomorrow morning.</div>
        ) : (
          <>
            <div style={{ fontSize: 15, marginBottom: 12 }}>How did you sleep last night?</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => rate(s)} style={{
                  flex: 1, background: T.raised, border: `1px solid ${T.line}`, borderRadius: 12,
                  padding: "12px 0", fontSize: 20, cursor: "pointer",
                }}>🌙<div style={{ fontSize: 12, color: T.dim, marginTop: 3 }}>{s}</div></button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: T.faint, fontSize: 11.5, marginTop: 6 }}>
              <span>Rough</span><span>Deep + rested</span>
            </div>
          </>
        )}
      </Card>

      {recent.length > 0 && (
        <Card style={{ padding: 18 }}>
          <SectionLabel>Last {recent.length} nights {avg && `· avg ${avg}/5`}</SectionLabel>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90 }}>
            {recent.map((r, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                <div style={{
                  height: `${(r.score / 5) * 100}%`, borderRadius: 5,
                  background: r.score >= 4 ? T.ember : r.score === 3 ? T.emberDeep : T.raised,
                  border: `1px solid ${T.line}`,
                }} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {insights.length > 0 && (
        <Card style={{ padding: 18 }}>
          <SectionLabel>On your best nights, you did…</SectionLabel>
          {insights.map((ins) => (
            <div key={ins.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${T.line}` }}>
              <div style={{ fontSize: 14 }}>{ins.label}</div>
              <div style={{ color: ins.avg >= 3.5 ? T.good : T.dim, fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", marginLeft: 10 }}>{ins.avg.toFixed(1)}/5 · {ins.n}×</div>
            </div>
          ))}
        </Card>
      )}

      {data.history.length > 0 && (
        <Card style={{ padding: 18 }}>
          <SectionLabel>Routines completed: {data.history.length}</SectionLabel>
          <div style={{ color: T.dim, fontSize: 13.5, lineHeight: 1.6 }}>
            Most recent: {data.history[data.history.length - 1].activities.join(" · ")}
          </div>
        </Card>
      )}

      {data.ratings.length === 0 && data.history.length === 0 && (
        <Card style={{ textAlign: "center", color: T.faint, padding: 30, fontSize: 14, lineHeight: 1.6 }}>
          No data yet. Complete a routine tonight, rate your sleep tomorrow, and the patterns will start to show.
        </Card>
      )}
    </div>
  );
}

/* ============ SETTINGS — your deck ============ */
function SettingsView({ data, setData }) {
  const [phase, setPhase] = useState("mind");
  const [label, setLabel] = useState("");
  const [detail, setDetail] = useState("");
  const custom = data.customCards || EMPTY_CUSTOM;

  const addCard = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const card = { id: "c" + Date.now(), label: trimmed, detail: detail.trim() || undefined, gentle: true, custom: true };
    setData({ ...data, customCards: { ...custom, [phase]: [...(custom[phase] || []), card] } });
    setLabel(""); setDetail("");
  };

  const removeCard = (p, id) => {
    setData({ ...data, customCards: { ...custom, [p]: custom[p].filter((c) => c.id !== id) } });
  };

  const total = Object.values(custom).reduce((s, arr) => s + (arr ? arr.length : 0), 0);
  const inputStyle = {
    width: "100%", background: T.raised, color: T.text, border: `1px solid ${T.line}`,
    borderRadius: 10, padding: "11px 13px", fontSize: 14.5, fontFamily: "'Karla', sans-serif", outline: "none",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, marginBottom: 4 }}>Your deck</div>
        <div style={{ color: T.dim, fontSize: 14, lineHeight: 1.5 }}>Add your own cards — they join the shuffle immediately, right alongside the built-ins.</div>
      </div>

      <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionLabel>New card</SectionLabel>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.keys(PHASE_NAMES).map((p) => (
            <Pill key={p} active={phase === p} onClick={() => setPhase(p)}>{PHASE_NAMES[p]}</Pill>
          ))}
        </div>
        <input style={inputStyle} placeholder="Card name — e.g. Moon gazing from the balcony" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} />
        <input style={inputStyle} placeholder="Detail (optional) — e.g. 5 minutes, no phone" value={detail} maxLength={90} onChange={(e) => setDetail(e.target.value)} />
        <button onClick={addCard} disabled={!label.trim()} style={{
          background: label.trim() ? T.ember : T.raised, color: label.trim() ? "#20130B" : T.faint,
          border: "none", borderRadius: 12, padding: "12px 0", fontWeight: 700, fontSize: 14,
          cursor: label.trim() ? "pointer" : "default",
        }}>Add to {PHASE_NAMES[phase]} deck</button>
      </Card>

      {total === 0 ? (
        <Card style={{ textAlign: "center", color: T.faint, padding: 26, fontSize: 14, lineHeight: 1.6 }}>
          No custom cards yet. Ideas: a specific playlist ritual, a skincare wind-down, moon gazing, prayer, a pet cuddle round…
        </Card>
      ) : (
        Object.keys(PHASE_NAMES).map((p) => (custom[p] && custom[p].length > 0) && (
          <div key={p}>
            <SectionLabel>{PHASE_NAMES[p]} · {custom[p].length} card{custom[p].length > 1 ? "s" : ""}</SectionLabel>
            {custom[p].map((c) => (
              <Card key={c.id} style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.label}</div>
                  {c.detail && <div style={{ color: T.dim, fontSize: 13, marginTop: 2 }}>{c.detail}</div>}
                </div>
                <button onClick={() => removeCard(p, c.id)} title="Remove card" style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", padding: 4 }}>
                  <X size={17} />
                </button>
              </Card>
            ))}
          </div>
        ))
      )}

      <div style={{ color: T.faint, fontSize: 12.5, lineHeight: 1.55 }}>Custom cards count in the Low energy shuffle too, and show up in your Nights insights once you rate mornings after using them.</div>
    </div>
  );
}
