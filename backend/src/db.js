import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Supabase (and most hosted Postgres providers) terminate TLS with a
// provider-managed cert; rejectUnauthorized:false skips CA chain
// verification while the connection is still encrypted. Fine for a
// personal project, not for anything handling sensitive data at scale.
// Set PGSSL=false for a local Postgres instance that has no TLS at all.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "false" ? false : { rejectUnauthorized: false },
});

// SQLite's datetime('now') produced 'YYYY-MM-DD HH:MM:SS' text; this
// reproduces that exact format so frontend code doing .slice(0, 10) on
// created_at strings keeps working unchanged.
const NOW_TEXT = "to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI:SS')";

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT}
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      ack_time TEXT NOT NULL,
      note TEXT,
      study_hours REAL,
      screenshot_data TEXT,
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS targets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period TEXT NOT NULL CHECK (period IN ('daily','weekly','monthly')),
      title TEXT NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done')),
      proof_note TEXT,
      quiz_question TEXT,
      quiz_answer TEXT,
      quiz_correct INTEGER,
      stake_amount REAL,
      stake_settled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT},
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS mnemonics (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      items_json TEXT NOT NULL,
      mnemonic_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT}
    );

    CREATE TABLE IF NOT EXISTS teachbacks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      explanation TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT}
    );

    CREATE TABLE IF NOT EXISTS explainers (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL,
      topic TEXT NOT NULL,
      one_liner TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT},
      UNIQUE(subject, topic)
    );

    CREATE TABLE IF NOT EXISTS swot_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      period_label TEXT NOT NULL,
      strengths TEXT,
      weaknesses TEXT,
      opportunities TEXT,
      threats TEXT,
      action_plan TEXT,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT}
    );

    CREATE TABLE IF NOT EXISTS mood_checkins (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
      note TEXT,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT},
      UNIQUE(user_id, date)
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT}
    );

    CREATE TABLE IF NOT EXISTS game_scores (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_type TEXT NOT NULL,
      score INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT ${NOW_TEXT}
    );
  `);

  await seedExplainers();
}

const seedExplainers = async () => {
  const rows = [
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

  for (const r of rows) {
    await pool.query(
      `INSERT INTO explainers (subject, topic, one_liner, created_by)
       VALUES ($1, $2, $3, 'seed')
       ON CONFLICT (subject, topic) DO NOTHING`,
      [r.subject, r.topic, r.oneLiner]
    );
  }
};

export async function getOrCreateUser(username) {
  const clean = username.trim();
  if (!clean) throw new Error("Username required");
  const existing = await pool.query(
    "SELECT id, username FROM users WHERE username = $1",
    [clean]
  );
  if (existing.rows[0]) return existing.rows[0];
  const inserted = await pool.query(
    "INSERT INTO users (username) VALUES ($1) RETURNING id, username",
    [clean]
  );
  return inserted.rows[0];
}
