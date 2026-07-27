import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, "app.db");

declare global {
  var __db: Database.Database | undefined;
}

const db = global.__db ?? new Database(dbPath);
if (process.env.NODE_ENV !== "production") global.__db = db;

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    ack_time TEXT NOT NULL,
    note TEXT,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly')),
    title TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
    proof_note TEXT,
    quiz_question TEXT,
    quiz_answer TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
  );

  CREATE TABLE IF NOT EXISTS mnemonics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    items_json TEXT NOT NULL,
    mnemonic_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS teachbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    explanation TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS explainers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    one_liner TEXT NOT NULL,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(subject, topic)
  );

  CREATE TABLE IF NOT EXISTS swot_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_label TEXT NOT NULL,
    strengths TEXT,
    weaknesses TEXT,
    opportunities TEXT,
    threats TEXT,
    action_plan TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mood_checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS journal_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_text TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function ensureColumn(table: string, column: string, definition: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn("targets", "stake_amount", "REAL");
ensureColumn("targets", "stake_settled", "INTEGER NOT NULL DEFAULT 0");
ensureColumn("targets", "quiz_correct", "INTEGER");
ensureColumn("checkins", "study_hours", "REAL");
ensureColumn("checkins", "screenshot_data", "TEXT");

const seedExplainers: {
  subject: string;
  topic: string;
  oneLiner: string;
}[] = [
  {
    subject: "History",
    topic: "Indus Valley Civilization",
    oneLiner:
      "Bronze Age cities with better drains than some modern towns; no temples or palaces found, so historians think it was surprisingly egalitarian.",
  },
  {
    subject: "History",
    topic: "Vedic Period",
    oneLiner:
      "Came after the Indus decline; oral hymns (the Vedas) first, then society settled into varnas and small kingdoms as iron tools spread.",
  },
  {
    subject: "History",
    topic: "Mauryan Empire",
    oneLiner:
      "Chandragupta built it, Chanakya masterminded it, Ashoka gave up war after Kalinga and switched to Dhamma and edicts carved on rocks.",
  },
  {
    subject: "History",
    topic: "Gupta Empire",
    oneLiner:
      "Centuries after the Mauryas; India's so-called Golden Age for math and astronomy (Aryabhata) and Sanskrit literature, though control was looser than Mauryan times.",
  },
  {
    subject: "History",
    topic: "Delhi Sultanate",
    oneLiner:
      "Five dynasties in a row (Slave, Khilji, Tughlaq, Sayyid, Lodi) ruling from Delhi, roughly 1206-1526, right before the Mughals showed up.",
  },
  {
    subject: "History",
    topic: "Mughal Empire",
    oneLiner:
      "Babur beat the Lodis at Panipat in 1526; Akbar consolidated it, Aurangzeb over-extended it, and by 1707 it was basically a name on paper.",
  },
  {
    subject: "History",
    topic: "1857 Revolt",
    oneLiner:
      "Started as a sepoy mutiny over greased cartridges, grew into the last big pre-organized uprising against the British — after this, the Crown took direct control from the East India Company.",
  },
  {
    subject: "History",
    topic: "Indian National Congress (1885)",
    oneLiner:
      "Founded as a polite platform for educated Indians to petition the British; became the main vehicle of the freedom movement within a generation.",
  },
  {
    subject: "History",
    topic: "Partition and Independence (1947)",
    oneLiner:
      "Same midnight, two nations — Mountbatten moved the date up, Radcliffe drew the border in weeks, and the violence that followed shaped decades of policy after.",
  },
  {
    subject: "Prehistory",
    topic: "Bhimbetka Rock Shelters",
    oneLiner:
      "Rock shelters in Madhya Pradesh with paintings going back tens of thousands of years — basically prehistoric graffiti, and a UNESCO site now.",
  },
  {
    subject: "Prehistory",
    topic: "Mehrgarh",
    oneLiner:
      "One of the earliest farming villages in South Asia (in Balochistan); predates the Indus Valley cities and shows agriculture taking root before urbanization.",
  },
  {
    subject: "Geography",
    topic: "Himalayas Formation",
    oneLiner:
      "India was once an island that rammed into Asia; the crumple zone from that collision is the Himalayas, still rising a few mm a year because it hasn't stopped.",
  },
  {
    subject: "Geography",
    topic: "Monsoon System",
    oneLiner:
      "Land heats faster than the sea in summer, pulling in moist wind from the Indian Ocean — flip the seasons and the wind (and rain) reverses direction.",
  },
  {
    subject: "Geography",
    topic: "Himalayan vs Peninsular Rivers",
    oneLiner:
      "Himalayan rivers (Ganga, Indus, Brahmaputra) are snow-fed and perennial; Peninsular rivers (Godavari, Krishna, Kaveri) are rain-fed and seasonal — that's why dams matter more down south.",
  },
  {
    subject: "Geography",
    topic: "Deccan Traps",
    oneLiner:
      "A massive volcanic lava plateau across western and central India from eruptions around the time the dinosaurs went extinct — one theory blames it as a co-culprit alongside the asteroid.",
  },
  {
    subject: "Geography",
    topic: "Western vs Eastern Coastal Plains",
    oneLiner:
      "The western coastal plain is narrow because the Western Ghats sit close to the sea; the eastern plain is wide and deltaic because rivers had more room to deposit silt before reaching the Bay of Bengal.",
  },
  {
    subject: "Polity",
    topic: "Preamble",
    oneLiner:
      "The Constitution's one-paragraph mission statement — the words \"socialist\" and \"secular\" were only added later, via the 42nd Amendment in 1976.",
  },
  {
    subject: "Polity",
    topic: "GST Council",
    oneLiner:
      "Chaired by the Union Finance Minister, with every state's finance minister as a member — one of the rare forums where the Centre and states literally vote together on tax rates.",
  },
  {
    subject: "Economy",
    topic: "Five-Year Plans",
    oneLiner:
      "Borrowed from Soviet-style planning; started in 1951 and wound down after the 12th Plan in 2017, when NITI Aayog took over as the new-look planning body.",
  },
];

const insertExplainer = db.prepare(
  `INSERT OR IGNORE INTO explainers (subject, topic, one_liner, created_by) VALUES (?, ?, ?, 'seed')`
);
for (const e of seedExplainers) {
  insertExplainer.run(e.subject, e.topic, e.oneLiner);
}

export default db;

export function getOrCreateUser(username: string) {
  const clean = username.trim();
  if (!clean) throw new Error("Username required");
  const existing = db
    .prepare("SELECT id, username FROM users WHERE username = ?")
    .get(clean) as { id: number; username: string } | undefined;
  if (existing) return existing;
  const result = db
    .prepare("INSERT INTO users (username) VALUES (?)")
    .run(clean);
  return { id: result.lastInsertRowid as number, username: clean };
}
