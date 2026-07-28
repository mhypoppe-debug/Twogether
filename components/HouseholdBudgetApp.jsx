"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Home, Wallet, PiggyBank, Receipt, Tags, ChevronRight, ChevronLeft,
  Plus, X, Check, Users, TrendingUp, TrendingDown, Sparkles, Lock,
  UserPlus, Pencil
} from "lucide-react";

/* ============================================================
   TOKENS
   ============================================================ */
// COLORS is intentionally a mutable module-level object: choosing a theme in
// onboarding rewrites these fields in place, and every component re-reads
// COLORS.xxx fresh on each render, so the whole app re-skins instantly.
const COLORS = {
  bg: "#FAF7FB",
  card: "#FFFFFF",
  ink: "#241726",
  inkSoft: "#6B5A70",
  primary: "#5B2159",
  accent: "#8E44AD",
  gold: "#E8A33D",
  success: "#2F8F6B",
  alert: "#D1495B",
  border: "#E7DCEE",
  lavender: "#F3EAFA",
};

const THEMES = [
  { name: "Plum",        primary: "#5B2159", accent: "#8E44AD", gold: "#E8A33D", bg: "#FAF7FB", border: "#E7DCEE", lavender: "#F3EAFA" },
  { name: "Ocean",       primary: "#0E4F5C", accent: "#1B8A9E", gold: "#E8A33D", bg: "#F5FAFB", border: "#D9EBEE", lavender: "#E6F4F6" },
  { name: "Terracotta",  primary: "#7A2E1D", accent: "#C0603A", gold: "#E0B34A", bg: "#FBF6F2", border: "#F0DCCF", lavender: "#F7E8DE" },
  { name: "Forest",      primary: "#264D2B", accent: "#4E8A55", gold: "#D8A63D", bg: "#F6FAF6", border: "#DCEBDC", lavender: "#E7F3E7" },
  { name: "Rose",        primary: "#7A1E42", accent: "#C2437A", gold: "#E8A33D", bg: "#FCF6F9", border: "#F3DCE6", lavender: "#F9E7EF" },
  { name: "Midnight",    primary: "#1E2A4A", accent: "#3E5C9A", gold: "#E0A83D", bg: "#F5F6FA", border: "#DCE1EF", lavender: "#E9ECF5" },
];

function applyTheme(theme) {
  COLORS.primary = theme.primary;
  COLORS.accent = theme.accent;
  COLORS.gold = theme.gold;
  COLORS.bg = theme.bg;
  COLORS.border = theme.border;
  COLORS.lavender = theme.lavender;
}

function paletteFor(theme) {
  return [theme.accent, theme.primary, theme.gold, theme.accent + "AA", "#2F8F6B", "#D1495B", theme.primary + "AA", theme.accent + "77"];
}

let PALETTE = ["#8E44AD", "#5B2159", "#E8A33D", "#B983CC", "#2F8F6B", "#D1495B", "#6B4C8A", "#C77DFF"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DEFAULT_MONTH_IDX = 6; // July, as a sensible starting point

const SUGGESTED = {
  income: ["Partner 1 Salary", "Partner 2 Salary", "Bonus", "Investments / Dividends", "Other / Extra"],
  expense: ["Rent", "Mortgage", "Groceries", "Utilities", "Transportation", "Dining Out", "Health", "Taxes", "Insurance", "Maintenance"],
  reserve: ["Insurance", "Gifts", "Vacation fund", "Home Repairs", "Taxes"],
};

const SUGGESTED_ICONS = {
  income: {
    "Partner 1 Salary": "💼",
    "Partner 2 Salary": "💵",
    "Bonus": "🎉",
    "Investments / Dividends": "📈",
    "Other / Extra": "🎁",
  },
  expense: {
    "Rent": "🏠",
    "Mortgage": "🏦",
    "Groceries": "🛒",
    "Utilities": "⚡",
    "Transportation": "🚗",
    "Dining Out": "🍔",
    "Health": "🏥",
    "Taxes": "🧾",
    "Insurance": "🛡️",
    "Maintenance": "🔧",
  },
  reserve: {
    "Insurance": "🛡️",
    "Gifts": "🎁",
    "Vacation fund": "✈️",
    "Home Repairs": "🔧",
    "Taxes": "🧾",
  },
};

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "AU$", label: "Australian Dollar" },
];

// Mutable, like COLORS: chosen once in onboarding (or changed later in Settings),
// and read fresh by fmt() on every render.
let CURRENCY_SYMBOL = "$";
let NUMBER_LOCALE = "en-US"; // "en-US" -> 1,234.56   ·   "de-DE" -> 1.234,56
let DATE_FORMAT = "MDY";
let DENSITY = "comfortable"; // "comfortable" | "compact"
const spacing = (comfortable, compact) => (DENSITY === "compact" ? compact : comfortable);

const fmt = (n) => {
  const v = Number(n) || 0;
  const neg = v < 0;
  return (neg ? `-${CURRENCY_SYMBOL}` : CURRENCY_SYMBOL) + Math.abs(v).toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return DATE_FORMAT === "DMY" ? `${dd}/${mm}/${yyyy}` : `${mm}/${dd}/${yyyy}`;
}

const fontDisplay = { fontFamily: "'Fraunces', Georgia, serif" };
const fontBody = { fontFamily: "'Inter', system-ui, sans-serif" };

/* ============================================================
   EMPTY STATE FACTORY
   ============================================================ */
function emptyHousehold() {
  return {
    name: "",
    code: "",
    currency: CURRENCIES[0],
    partners: ["", ""],
    categories: { income: [], expense: [], reserve: [] },
    startingBalance: 0,
    budget: { income: {}, expense: {}, reserve: {} }, // { catName: [12 numbers] }
    actual: { income: {}, expense: {}, reserve: {} },
    transactions: [], // { id, month, type, category, amount, note }
    releasedThrough: {}, // { reserveCatName: monthIdx | null }
    reserveGoals: {}, // { reserveCatName: { targetAmount, targetDate: "YYYY-MM-DD" } }
    sameEveryMonth: { income: {}, expense: {} }, // { catName: bool } — planned value applies to all 12 months
    copyActualFromExpected: { income: {} }, // { catName: bool } — actual income mirrors the planned amount
    categoryIcons: { income: {}, expense: {}, reserve: {} }, // { catName: emoji }
    preferences: {
      showPartnerInitials: true,
      numberFormat: "US",   // "US" = 1,234.56   ·   "EU" = 1.234,56
      dateFormat: "MDY",    // "MDY" = 07/14/2026   ·   "DMY" = 14/07/2026
      density: "comfortable", // "comfortable" | "compact"
    },
  };
}

function zeros() { return Array(12).fill(0); }

// Fills fromMonth..11 with val, leaving months before fromMonth untouched —
// past months are history and shouldn't change when a "same from here on" toggle is used.
// Older saved data may have this as a single boolean instead of a 12-month array —
// treat anything that isn't already a proper array as "not set" for every month.
function normalizeMonthFlags(x) {
  return Array.isArray(x) ? x : Array(12).fill(false);
}

function fillFromMonth(existingArr, fromMonth, val) {
  const arr = [...existingArr];
  for (let m = fromMonth; m < 12; m++) arr[m] = val;
  return arr;
}

const TODAY = new Date(2026, 6, 14); // fixed "today" for this demo — July 14, 2026

// Months from the viewed month up to (and including) the target month — i.e. how many
// months, counting this one, are left to set money aside before the bill is due.
function monthsRemainingInclusive(targetDateStr, viewedMonthIdx) {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  if (isNaN(target)) return null;
  const months = (target.getFullYear() - 2026) * 12 + (target.getMonth() - viewedMonthIdx) + 1;
  return Math.max(1, months);
}

/* ============================================================
   SHARED UI BITS
   ============================================================ */
function Chip({ children, active, onClick, tone = "accent" }) {
  const bg = active ? COLORS[tone] : "#fff";
  const color = active ? "#fff" : COLORS.ink;
  return (
    <button
      onClick={onClick}
      style={{
        ...fontBody, padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${active ? COLORS[tone] : COLORS.border}`,
        background: bg, color, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
      }}
    >
      {children}
    </button>
  );
}

function Checkbox({ checked, onChange, label }) {
  return (
    <label style={{ ...fontBody, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.inkSoft, fontWeight: 600, cursor: "pointer", marginTop: 6 }}>
      <input
        type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: COLORS.primary, cursor: "pointer" }}
      />
      {label}
    </label>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 16, border: `1px solid ${COLORS.border}`,
      padding: spacing(20, 12), boxShadow: "0 1px 3px rgba(91,33,89,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, delta, tone }) {
  return (
    <div className="kpi-card" style={{
      background: `linear-gradient(135deg, ${tone} 0%, ${COLORS.primary} 100%)`,
      borderRadius: 18, padding: "20px 22px", color: "#fff",
      boxShadow: "0 4px 14px rgba(91,33,89,0.18)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.9, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...fontBody }}>
        <Icon size={15} /> {label}
      </div>
      <div className="kpi-value" style={{ ...fontDisplay, fontSize: 30, fontWeight: 600, marginTop: 8 }}>{fmt(value)}</div>
      {delta !== undefined && (
        <div style={{ ...fontBody, fontSize: 12, marginTop: 6, opacity: 0.9, display: "flex", alignItems: "center", gap: 4 }}>
          {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {fmt(Math.abs(delta))} vs last month
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ONBOARDING WIZARD
   ============================================================ */
function CategoryPicker({ suggestions, chosen, setChosen, type }) {
  const [custom, setCustom] = useState("");
  const toggle = (name) => {
    setChosen(chosen.includes(name) ? chosen.filter(c => c !== name) : [...chosen, name]);
  };
  const addCustom = () => {
    const v = custom.trim();
    if (v && !chosen.includes(v)) setChosen([...chosen, v]);
    setCustom("");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {suggestions.map(s => (
          <Chip key={s} active={chosen.includes(s)} onClick={() => toggle(s)}>
            {SUGGESTED_ICONS[type]?.[s] ? `${SUGGESTED_ICONS[type][s]} ` : ""}{s}
          </Chip>
        ))}
        {chosen.filter(c => !suggestions.includes(c)).map(c => (
          <Chip key={c} active tone="gold" onClick={() => toggle(c)}>{c} ✕</Chip>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addCustom()}
          placeholder="Type your own category…"
          style={{
            ...fontBody, flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`,
            fontSize: 14, outline: "none",
          }}
        />
        <button onClick={addCustom} style={{
          ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10,
          padding: "0 16px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <Plus size={16} /> Add
        </button>
      </div>
    </div>
  );
}

function ThemePicker({ theme, setTheme }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, marginBottom: 10, fontWeight: 600 }}>Pick your colors</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {THEMES.map(t => (
          <button
            key={t.name}
            onClick={() => setTheme(t)}
            title={t.name}
            style={{
              width: 44, height: 44, borderRadius: 12, border: theme.name === t.name ? `2.5px solid ${t.primary}` : "2.5px solid transparent",
              padding: 3, cursor: "pointer", background: "#fff", boxShadow: theme.name === t.name ? "0 0 0 3px " + t.bg : "none",
            }}
          >
            <div style={{ width: "100%", height: "100%", borderRadius: 8, background: `linear-gradient(135deg, ${t.accent}, ${t.primary})`, position: "relative" }}>
              {theme.name === t.name && (
                <Check size={16} color="#fff" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
              )}
            </div>
          </button>
        ))}
      </div>
      <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, marginTop: 8 }}>{theme.name} — you can change this later in Settings.</p>
    </div>
  );
}

function CurrencyPicker({ currency, setCurrency }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, marginBottom: 10, fontWeight: 600 }}>Currency</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {CURRENCIES.map(c => (
          <Chip key={c.code} active={currency.code === c.code} onClick={() => setCurrency(c)}>
            {c.symbol} {c.code}
          </Chip>
        ))}
      </div>
      <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, marginTop: 8 }}>{currency.label} — you can change this later in Settings.</p>
    </div>
  );
}

function Onboarding({ onComplete, authError, authBusy }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [partners, setPartners] = useState(["", ""]);
  const [theme, setTheme] = useState(THEMES[0]);
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [income, setIncome] = useState([]);
  const [expense, setExpense] = useState([]);
  const [reserve, setReserve] = useState([]);
  const [startBal, setStartBal] = useState("");

  useEffect(() => { applyTheme(theme); PALETTE = paletteFor(theme); }, [theme]);
  useEffect(() => { CURRENCY_SYMBOL = currency.symbol; }, [currency]);

  const steps = ["Household", "Income", "Expenses", "Reserves", "Starting balance"];
  const canNext = [
    name.trim().length > 0 && password.length >= 4 && password === confirmPassword,
    income.length > 0,
    expense.length > 0,
    true,
    true,
  ][step];

  const finish = () => {
    const h = emptyHousehold();
    h.name = name.trim();
    h.partners = partners.filter(p => p.trim());
    h.theme = theme;
    h.currency = currency;
    h.categories = { income, expense, reserve };
    h.startingBalance = Number(startBal) || 0;
    income.forEach(c => { h.budget.income[c] = zeros(); h.actual.income[c] = zeros(); h.sameEveryMonth.income[c] = false; h.copyActualFromExpected.income[c] = Array(12).fill(false); h.categoryIcons.income[c] = SUGGESTED_ICONS.income[c] || null; });
    expense.forEach(c => { h.budget.expense[c] = zeros(); h.actual.expense[c] = zeros(); h.sameEveryMonth.expense[c] = false; h.categoryIcons.expense[c] = SUGGESTED_ICONS.expense[c] || null; });
    reserve.forEach(c => { h.budget.reserve[c] = zeros(); h.actual.reserve[c] = zeros(); h.releasedThrough[c] = null; h.reserveGoals[c] = { targetAmount: 0, targetDate: "" }; h.categoryIcons.reserve[c] = SUGGESTED_ICONS.reserve[c] || null; });
    onComplete(h, password);
  };

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 20% 10%, ${COLORS.lavender}, ${COLORS.bg} 60%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, justifyContent: "center" }}>
          <div style={{ background: COLORS.primary, borderRadius: 12, padding: 10, display: "flex" }}>
            <PiggyBank size={22} color="#fff" />
          </div>
          <span style={{ ...fontDisplay, fontSize: 24, color: COLORS.primary, fontWeight: 600 }}>Twogether</span>
        </div>

        {/* progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 4, background: i <= step ? COLORS.primary : COLORS.border, marginBottom: 6 }} />
              <div style={{ ...fontBody, fontSize: 11, color: i === step ? COLORS.primary : COLORS.inkSoft, fontWeight: i === step ? 700 : 500, textAlign: "center" }}>
                {i + 1}. {s}
              </div>
            </div>
          ))}
        </div>

        <Card style={{ minHeight: 340, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1 }}>
            {step === 0 && (
              <div>
                <h2 style={{ ...fontDisplay, fontSize: 22, margin: "0 0 6px", color: COLORS.ink }}>Name your household</h2>
                <p style={{ ...fontBody, fontSize: 14, color: COLORS.inkSoft, margin: "0 0 20px" }}>This is what you and your partner will see when you both open the plan.</p>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. The Van Dijk Household"
                  style={{ ...fontBody, width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 16 }}
                />

                <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>Password</label>
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      style={{ ...fontBody, width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>Confirm password</label>
                    <input
                      type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Same password"
                      style={{ ...fontBody, width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${(confirmPassword && confirmPassword !== password) ? COLORS.alert : COLORS.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </div>
                <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, marginBottom: 16 }}>
                  After you create your household, you'll get a household ID to share with your partner — along with this password. No account needed for either of you.
                </p>

                <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, marginBottom: 8, fontWeight: 600 }}>Who's in this household? (optional)</p>
                {partners.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <input
                      value={p}
                      onChange={e => { const c = [...partners]; c[i] = e.target.value; setPartners(c); }}
                      placeholder={`Partner ${i + 1} name`}
                      style={{ ...fontBody, flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                    {partners.length > 2 && (
                      <button
                        onClick={() => setPartners(partners.filter((_, idx) => idx !== i))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex", alignItems: "center" }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPartners([...partners, ""])}
                  style={{
                    ...fontBody, background: "none", border: "none", cursor: "pointer", color: COLORS.primary,
                    fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: "4px 0", marginBottom: 8,
                  }}
                >
                  <Plus size={14} /> Add another person
                </button>
                <div style={{ marginTop: 16 }}>
                  <ThemePicker theme={theme} setTheme={setTheme} />
                  <CurrencyPicker currency={currency} setCurrency={setCurrency} />
                </div>
              </div>
            )}
            {step === 1 && (
              <div>
                <h2 style={{ ...fontDisplay, fontSize: 22, margin: "0 0 6px", color: COLORS.ink }}>Where does your money come from?</h2>
                <p style={{ ...fontBody, fontSize: 14, color: COLORS.inkSoft, margin: "0 0 20px" }}>Pick suggestions or add your own — great for tracking each partner's income separately.</p>
                <CategoryPicker suggestions={SUGGESTED.income} chosen={income} setChosen={setIncome} type="income" />
              </div>
            )}
            {step === 2 && (
              <div>
                <h2 style={{ ...fontDisplay, fontSize: 22, margin: "0 0 6px", color: COLORS.ink }}>What do you spend on?</h2>
                <p style={{ ...fontBody, fontSize: 14, color: COLORS.inkSoft, margin: "0 0 20px" }}>These are your regular, month-to-month costs.</p>
                <CategoryPicker suggestions={SUGGESTED.expense} chosen={expense} setChosen={setExpense} type="expense" />
              </div>
            )}
            {step === 3 && (
              <div>
                <h2 style={{ ...fontDisplay, fontSize: 22, margin: "0 0 6px", color: COLORS.ink }}>Anything big you're saving toward?</h2>
                <p style={{ ...fontBody, fontSize: 14, color: COLORS.inkSoft, margin: "0 0 20px" }}>
                  Irregular costs you know are coming — insurance, taxes, a vacation. You'll set aside a little each month instead of a shock expense later. <em>You can skip this and add it anytime.</em>
                </p>
                <CategoryPicker suggestions={SUGGESTED.reserve} chosen={reserve} setChosen={setReserve} type="reserve" />
              </div>
            )}
            {step === 4 && (
              <div>
                <h2 style={{ ...fontDisplay, fontSize: 22, margin: "0 0 6px", color: COLORS.ink }}>What's your account balance today?</h2>
                <p style={{ ...fontBody, fontSize: 14, color: COLORS.inkSoft, margin: "0 0 20px" }}>This is your starting point — everything else builds from here.</p>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: 12, ...fontBody, fontSize: 15, color: COLORS.inkSoft }}>{CURRENCY_SYMBOL}</span>
                  <input
                    type="number" onFocus={e => e.target.select()} value={startBal} onChange={e => setStartBal(e.target.value)}
                    placeholder="0"
                    style={{ ...fontBody, width: "100%", padding: "12px 14px 12px 30px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 15, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              style={{
                ...fontBody, background: "none", border: "none", color: step === 0 ? COLORS.border : COLORS.inkSoft,
                fontWeight: 600, cursor: step === 0 ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14,
              }}
            >
              <ChevronLeft size={16} /> Back
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => canNext && setStep(s => s + 1)}
                disabled={!canNext}
                style={{
                  ...fontBody, background: canNext ? COLORS.primary : COLORS.border, color: "#fff", border: "none",
                  borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: canNext ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 14,
                }}
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={authBusy}
                style={{
                  ...fontBody, background: COLORS.gold, color: COLORS.ink, border: "none",
                  borderRadius: 10, padding: "10px 20px", fontWeight: 700, cursor: authBusy ? "default" : "pointer",
                  display: "flex", alignItems: "center", gap: 6, fontSize: 14, opacity: authBusy ? 0.7 : 1,
                }}
              >
                <Sparkles size={16} /> {authBusy ? "Creating…" : "Create household"}
              </button>
            )}
          </div>
          {authError && (
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.alert, marginTop: 10, marginBottom: 0 }}>
              ⚠ {authError}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   SIDEBAR
   ============================================================ */
function Sidebar({ view, setView, household, onLogout, saveStatus }) {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: Home },
    { key: "income", label: "Income", icon: Wallet },
    { key: "expenses", label: "Expenses", icon: Receipt },
    { key: "reserves", label: "Reserves", icon: PiggyBank },
    { key: "categories", label: "Categories", icon: Tags },
  ];
  const statusText = { saving: "Saving…", saved: "✓ Saved", error: "⚠ Save failed" }[saveStatus] || "";
  return (
    <div className="sidebar" style={{ background: COLORS.primary, minHeight: "100vh", padding: "24px 16px", boxSizing: "border-box", flexShrink: 0, position: "relative" }}>
      <div className="sidebar-header" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, paddingLeft: 8 }}>
        <PiggyBank size={20} color="#fff" />
        <span style={{ ...fontDisplay, color: "#fff", fontSize: 18, fontWeight: 600 }}>Twogether</span>
      </div>
      <div className="sidebar-household" style={{ ...fontBody, color: "rgba(255,255,255,0.65)", fontSize: 12, paddingLeft: 8, marginBottom: 24 }}>
        {household.name || "Your household"}
      </div>
      <div className="sidebar-nav">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="sidebar-nav-item"
            style={{
              ...fontBody, display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              marginBottom: 4, borderRadius: 10, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
              textAlign: "left", background: view === key ? "rgba(255,255,255,0.15)" : "transparent",
              color: "#fff",
            }}
          >
            <Icon size={17} /> <span className="sidebar-nav-label">{label}</span>
          </button>
        ))}
      </div>
      <div className="sidebar-footer" style={{ position: "absolute", bottom: 20, left: 16, right: 16, ...fontBody, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Users size={13} /> <code style={{ background: "rgba(255,255,255,0.12)", padding: "2px 6px", borderRadius: 4 }}>{household.code}</code>
        </div>
        {statusText && <div style={{ marginBottom: 8, opacity: 0.85 }}>{statusText}</div>}
        <button
          onClick={() => exportHouseholdToFile(household)}
          style={{ ...fontBody, background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 11, fontWeight: 700, padding: 0, display: "block", marginBottom: 8 }}
        >
          💾 Export backup
        </button>
        <button
          onClick={onLogout}
          style={{ ...fontBody, background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 11, fontWeight: 700, padding: 0 }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function sumMonth(catObj, monthIdx) {
  return Object.values(catObj).reduce((s, arr) => s + (arr[monthIdx] || 0), 0);
}
function sumAll(catObj) {
  return Object.values(catObj).reduce((s, arr) => s + arr.reduce((a, b) => a + b, 0), 0);
}
function sumUpTo(catObj, monthIdx) {
  return Object.values(catObj).reduce((s, arr) => s + arr.slice(0, monthIdx + 1).reduce((a, b) => a + b, 0), 0);
}

function computeKpis(h, monthIdx) {
  const incomeYtd = sumUpTo(h.actual.income, monthIdx);
  const expenseYtd = sumUpTo(h.actual.expense, monthIdx);
  // accrued reserve expense: months up to releasedThrough count as spent
  let accruedYtd = 0, reservedTotal = 0;
  h.categories.reserve.forEach(cat => {
    const arr = h.actual.reserve[cat] || zeros();
    const releasedIdx = h.releasedThrough[cat];
    const saved = arr.slice(0, monthIdx + 1).reduce((a, b) => a + b, 0);
    if (releasedIdx !== null && releasedIdx !== undefined) {
      const accrued = arr.slice(0, Math.min(releasedIdx, monthIdx) + 1).reduce((a, b) => a + b, 0);
      accruedYtd += accrued;
      reservedTotal += Math.max(0, saved - accrued);
    } else {
      reservedTotal += saved;
    }
  });
  const bankBalance = h.startingBalance + incomeYtd - expenseYtd - accruedYtd;
  const freeToSpend = bankBalance - reservedTotal;
  return { incomeYtd, expenseYtd, accruedYtd, reservedTotal, bankBalance, freeToSpend };
}

function MonthSwitcher({ selectedMonth, setSelectedMonth }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
      <button
        onClick={() => setSelectedMonth(m => Math.max(0, m - 1))}
        disabled={selectedMonth === 0}
        style={{
          background: COLORS.lavender, border: "none", borderRadius: 8, width: 30, height: 30, display: "flex",
          alignItems: "center", justifyContent: "center", cursor: selectedMonth === 0 ? "default" : "pointer",
          opacity: selectedMonth === 0 ? 0.4 : 1, color: COLORS.primary,
        }}
      >
        <ChevronLeft size={16} />
      </button>
      <select
        value={selectedMonth}
        onChange={e => setSelectedMonth(Number(e.target.value))}
        style={{
          ...fontDisplay, fontSize: 16, fontWeight: 600, color: COLORS.primary, background: "none", border: "none",
          outline: "none", cursor: "pointer", padding: "2px 4px",
        }}
      >
        {MONTHS.map((m, i) => <option key={m} value={i}>{m} 2026</option>)}
      </select>
      <button
        onClick={() => setSelectedMonth(m => Math.min(11, m + 1))}
        disabled={selectedMonth === 11}
        style={{
          background: COLORS.lavender, border: "none", borderRadius: 8, width: 30, height: 30, display: "flex",
          alignItems: "center", justifyContent: "center", cursor: selectedMonth === 11 ? "default" : "pointer",
          opacity: selectedMonth === 11 ? 0.4 : 1, color: COLORS.primary,
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function YearOverview({ household, selectedMonth }) {
  const rows = MONTHS.map((m, i) => {
    const inc = sumMonth(household.actual.income, i);
    // Money set aside into reserves is money that's no longer free to spend, even
    // though it hasn't left the account yet — so it counts toward "expenses" here too.
    const reserved = sumMonth(household.actual.reserve, i);
    const exp = sumMonth(household.actual.expense, i) + reserved;
    return { month: m, income: inc, expenses: exp, reserved, net: inc - exp, isFuture: i > selectedMonth, isSelected: i === selectedMonth };
  });
  return (
    <Card>
      <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 14px", color: COLORS.ink }}>Year at a glance</h3>
      <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: "0 0 10px" }}>
        "Expenses" includes money moved into reserves — it's no longer free to spend, even before the bill is actually paid.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...fontBody, fontSize: 12 }}>
          <thead>
            <tr>
              {rows.map(r => (
                <th key={r.month} style={{
                  padding: "4px 6px", color: r.isSelected ? COLORS.primary : COLORS.inkSoft,
                  fontWeight: r.isSelected ? 800 : 600, textAlign: "center",
                }}>{r.month}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {rows.map(r => (
                <td key={r.month} style={{
                  padding: "4px 6px", textAlign: "center", opacity: r.isFuture ? 0.35 : 1,
                  background: r.isSelected ? COLORS.lavender : "transparent", borderRadius: 6,
                  color: COLORS.success, fontWeight: 600,
                }}>{r.income > 0 ? fmt(r.income) : "—"}</td>
              ))}
            </tr>
            <tr>
              {rows.map(r => (
                <td key={r.month} style={{
                  padding: "4px 6px", textAlign: "center", opacity: r.isFuture ? 0.35 : 1,
                  background: r.isSelected ? COLORS.lavender : "transparent",
                  color: COLORS.alert, fontWeight: 600,
                }}>{r.expenses > 0 ? fmt(r.expenses) : "—"}</td>
              ))}
            </tr>
            <tr>
              {rows.map(r => (
                <td key={r.month} style={{
                  padding: "4px 6px 8px", textAlign: "center", opacity: r.isFuture ? 0.35 : 1,
                  background: r.isSelected ? COLORS.lavender : "transparent", borderRadius: 6,
                  color: COLORS.ink, fontWeight: 800, borderTop: `1px solid ${COLORS.border}`,
                }}>{(r.income > 0 || r.expenses > 0) ? fmt(r.net) : "—"}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", gap: 14, marginTop: 8, ...fontBody, fontSize: 11, color: COLORS.inkSoft }}>
        <span style={{ color: COLORS.success, fontWeight: 700 }}>■</span> Income
        <span style={{ color: COLORS.alert, fontWeight: 700 }}>■</span> Expenses
        <span style={{ color: COLORS.ink, fontWeight: 700 }}>■</span> Net
      </div>
    </Card>
  );
}

function Dashboard({ household, selectedMonth, setSelectedMonth }) {
  const kpis = useMemo(() => computeKpis(household, selectedMonth), [household, selectedMonth]);

  const monthlyData = MONTHS.map((m, i) => ({
    month: m,
    Income: sumMonth(household.actual.income, i),
    Expenses: sumMonth(household.actual.expense, i),
    Reserved: sumMonth(household.actual.reserve, i),
  }));

  const pieData = [
    ...household.categories.expense.map(c => ({ name: c, value: (household.actual.expense[c] || zeros())[selectedMonth] })),
    ...household.categories.reserve.map(c => ({ name: c, value: (household.actual.reserve[c] || zeros())[selectedMonth] })),
  ].filter(d => d.value > 0);

  const noData = household.transactions.length === 0;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Where you stand</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 20px", fontSize: 14 }}>{MONTHS[selectedMonth]} 2026</p>

      <div className="kpi-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <KpiCard icon={Wallet} label="Bank balance" value={kpis.bankBalance} tone={COLORS.accent} />
        <KpiCard icon={Sparkles} label="Free to spend" value={kpis.freeToSpend} tone={COLORS.gold} />
        <KpiCard icon={PiggyBank} label="Reserved" value={kpis.reservedTotal} tone={"#6B4C8A"} />
        <KpiCard icon={TrendingUp} label="Income (YTD)" value={kpis.incomeYtd} tone={COLORS.primary} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <YearOverview household={household} selectedMonth={selectedMonth} />
      </div>

      {noData ? (
        <Card style={{ textAlign: "center", padding: 48 }}>
          <PiggyBank size={36} color={COLORS.accent} style={{ marginBottom: 12 }} />
          <h3 style={{ ...fontDisplay, fontSize: 20, margin: "0 0 6px", color: COLORS.ink }}>Nothing logged yet</h3>
          <p style={{ ...fontBody, color: COLORS.inkSoft, fontSize: 14, margin: 0 }}>
            Head to Income or Expenses to log your first entry — your dashboard fills in as you go.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, minWidth: 340 }}>
            <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 16px", color: COLORS.ink }}>Income vs Money Out</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Income" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" stackId="out" fill={COLORS.gold} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Reserved" stackId="out" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ flex: 1, minWidth: 260 }}>
            <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 16px", color: COLORS.ink }}>{MONTHS[selectedMonth]}'s spending</h3>
            {pieData.length === 0 ? (
              <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft }}>No spending logged for {MONTHS[selectedMonth]} yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   INCOME VIEW  (styled like Reserves — one card per category)
   ============================================================ */
function IncomeGoalCard({ cat, icon, planned, actual, sameEveryMonth, copyFromExpected, onPlannedChange, onActualChange, onToggleSame, onToggleCopy }) {
  const diff = actual - planned;
  const pct = planned > 0 ? Math.min(100, (actual / planned) * 100) : (actual > 0 ? 100 : 0);
  return (
    <Card style={{ marginBottom: 16 }}>
      <h4 style={{ ...fontDisplay, fontSize: 18, margin: "0 0 14px", color: COLORS.ink }}>{icon && <span>{icon} </span>}{cat}</h4>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", minWidth: 220 }}>
          <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
            Expected this month
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: 9, ...fontBody, fontSize: 14, color: COLORS.inkSoft }}>{CURRENCY_SYMBOL}</span>
            <input
              type="number" onFocus={e => e.target.select()} value={planned}
              onChange={e => onPlannedChange(Number(e.target.value))}
              style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 26px", borderRadius: 8, border: `1.5px solid ${COLORS.gold}`, background: "#FFF8EA", fontSize: 14, outline: "none" }}
            />
          </div>
          <Checkbox checked={sameEveryMonth} onChange={onToggleSame} label="Same from here on" />
        </div>
        <div style={{ flex: "1 1 240px", minWidth: 240 }}>
          <div style={{ height: 14, width: "100%", background: COLORS.lavender, borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.primary})`, transition: "width .4s" }} />
          </div>
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.ink, margin: "0 0 12px" }}>
            <strong>{fmt(actual)}</strong> received so far
            {planned > 0 && (
              <span style={{ color: diff >= 0 ? COLORS.success : COLORS.alert, fontWeight: 700 }}> · {diff >= 0 ? "+" : ""}{fmt(diff)} vs expected</span>
            )}
          </p>
          <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
            Actual received this month
          </label>
          <input
            type="number" onFocus={e => e.target.select()} value={actual}
            disabled={copyFromExpected}
            onChange={e => onActualChange(Number(e.target.value))}
            style={{
              ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8,
              border: `1.5px solid ${COLORS.primary}`, fontSize: 14, outline: "none",
              background: copyFromExpected ? COLORS.lavender : "#fff", color: copyFromExpected ? COLORS.inkSoft : COLORS.ink,
            }}
          />
          <Checkbox checked={copyFromExpected} onChange={onToggleCopy} label="Copy from expected" />
        </div>
      </div>
    </Card>
  );
}

function IncomeView({ household, update, selectedMonth, setSelectedMonth }) {
  const setPlanned = (cat, val) => {
    update(h => {
      const same = h.sameEveryMonth.income[cat];
      const existing = h.budget.income[cat] || zeros();
      const arr = same ? fillFromMonth(existing, selectedMonth, val) : [...existing];
      if (!same) arr[selectedMonth] = val;
      const copy = normalizeMonthFlags(h.copyActualFromExpected.income[cat])[selectedMonth];
      let newActual = h.actual;
      if (copy) {
        // Only mirror into the month currently being viewed/edited — never
        // pre-fill future months' "actual", since that hasn't really happened yet.
        const actualArr = [...(h.actual.income[cat] || zeros())];
        actualArr[selectedMonth] = arr[selectedMonth];
        newActual = { ...h.actual, income: { ...h.actual.income, [cat]: actualArr } };
      }
      return {
        ...h,
        budget: { ...h.budget, income: { ...h.budget.income, [cat]: arr } },
        actual: newActual,
      };
    });
  };
  const setActual = (cat, val) => {
    update(h => {
      const arr = [...(h.actual.income[cat] || zeros())];
      arr[selectedMonth] = val;
      return { ...h, actual: { ...h.actual, income: { ...h.actual.income, [cat]: arr } } };
    });
  };
  const toggleSame = (cat, checked) => {
    update(h => {
      let budgetArr = h.budget.income[cat] || zeros();
      if (checked) budgetArr = fillFromMonth(budgetArr, selectedMonth, budgetArr[selectedMonth]);
      return {
        ...h,
        sameEveryMonth: { ...h.sameEveryMonth, income: { ...h.sameEveryMonth.income, [cat]: checked } },
        budget: { ...h.budget, income: { ...h.budget.income, [cat]: budgetArr } },
      };
    });
  };
  const toggleCopy = (cat, checked) => {
    update(h => {
      const budgetArr = h.budget.income[cat] || zeros();
      const actualArr = [...(h.actual.income[cat] || zeros())];
      if (checked) actualArr[selectedMonth] = budgetArr[selectedMonth];
      const copyArr = [...normalizeMonthFlags(h.copyActualFromExpected.income[cat])];
      copyArr[selectedMonth] = checked;
      return {
        ...h,
        copyActualFromExpected: { ...h.copyActualFromExpected, income: { ...h.copyActualFromExpected.income, [cat]: copyArr } },
        actual: { ...h.actual, income: { ...h.actual.income, [cat]: actualArr } },
      };
    });
  };

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Income</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 8px", fontSize: 14, maxWidth: 680 }}>
        Set what you expect from each source this month, then fill in what actually came in.
      </p>
      {household.categories.income.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40, marginTop: 20 }}>
          <p style={{ ...fontBody, color: COLORS.inkSoft }}>No income categories yet — add one in Categories.</p>
        </Card>
      ) : (
        <div style={{ marginTop: 20 }}>
          {household.categories.income.map(cat => (
            <IncomeGoalCard
              key={cat}
              cat={cat}
              icon={household.categoryIcons?.income?.[cat]}
              planned={(household.budget.income[cat] || zeros())[selectedMonth]}
              actual={(household.actual.income[cat] || zeros())[selectedMonth]}
              sameEveryMonth={!!household.sameEveryMonth.income[cat]}
              copyFromExpected={!!normalizeMonthFlags(household.copyActualFromExpected.income[cat])[selectedMonth]}
              onPlannedChange={(v) => setPlanned(cat, v)}
              onActualChange={(v) => setActual(cat, v)}
              onToggleSame={(checked) => toggleSame(cat, checked)}
              onToggleCopy={(checked) => toggleCopy(cat, checked)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   EXPENSES VIEW  (monthly budget on top, transactions logged below)
   ============================================================ */
function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
}

function BulkFillCard({ household, setActualDirect }) {
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: 0,
        }}
      >
        <div>
          <h3 style={{ ...fontDisplay, fontSize: 17, margin: 0, color: COLORS.ink }}>⚡ Quick fill — enter totals for the whole year</h3>
          <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: "4px 0 0" }}>
            Catching up on past months? Type a total per category per month here instead of logging one purchase at a time.
          </p>
        </div>
        <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: open ? "rotate(-90deg)" : "rotate(90deg)", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <p style={{ ...fontBody, fontSize: 12, color: COLORS.alert, marginBottom: 10 }}>
            Note: this sets the category's total directly — it replaces whatever was there, and won't create individual entries in "Recent purchases".
          </p>
          <table style={{ borderCollapse: "collapse", ...fontBody, fontSize: 12, width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "4px 8px", color: COLORS.inkSoft, fontWeight: 600, position: "sticky", left: 0, background: COLORS.card }}>Category</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ padding: "4px 6px", color: COLORS.inkSoft, fontWeight: 600, textAlign: "center" }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {household.categories.expense.map(cat => (
                <tr key={cat} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <td style={{ padding: "4px 8px", whiteSpace: "nowrap", position: "sticky", left: 0, background: COLORS.card }}>
                    {household.categoryIcons?.expense?.[cat] && <span style={{ marginRight: 4 }}>{household.categoryIcons.expense[cat]}</span>}
                    {cat}
                  </td>
                  {MONTHS.map((m, i) => (
                    <td key={m} style={{ padding: "3px" }}>
                      <input
                        type="number" onFocus={e => e.target.select()}
                        defaultValue={(household.actual.expense[cat] || zeros())[i] || ""}
                        onBlur={e => setActualDirect(cat, i, Number(e.target.value) || 0)}
                        style={{
                          ...fontBody, width: 62, padding: "5px 4px", borderRadius: 6, textAlign: "right",
                          border: `1.5px solid ${COLORS.gold}`, background: "#FFF8EA", fontSize: 11, outline: "none",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ExpensesView({ household, update, selectedMonth, setSelectedMonth }) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loggedBy, setLoggedBy] = useState(household.partners?.[0] || "");

  const setBudgetVal = (cat, val) => {
    update(h => {
      const same = h.sameEveryMonth.expense[cat];
      const existing = h.budget.expense[cat] || zeros();
      const arr = same ? fillFromMonth(existing, selectedMonth, val) : [...existing];
      if (!same) arr[selectedMonth] = val;
      return { ...h, budget: { ...h.budget, expense: { ...h.budget.expense, [cat]: arr } } };
    });
  };

  const toggleSame = (cat, checked) => {
    update(h => {
      let arr = h.budget.expense[cat] || zeros();
      if (checked) arr = fillFromMonth(arr, selectedMonth, arr[selectedMonth]);
      return {
        ...h,
        sameEveryMonth: { ...h.sameEveryMonth, expense: { ...h.sameEveryMonth.expense, [cat]: checked } },
        budget: { ...h.budget, expense: { ...h.budget.expense, [cat]: arr } },
      };
    });
  };

  const addTransaction = () => {
    if (!category || !amount) return;
    update(h => {
      const arr = [...(h.actual.expense[category] || zeros())];
      arr[selectedMonth] += Number(amount);
      const tx = { id: Date.now(), month: selectedMonth, type: "expense", category, amount: Number(amount), note, loggedBy: loggedBy || null };
      return {
        ...h,
        actual: { ...h.actual, expense: { ...h.actual.expense, [category]: arr } },
        transactions: [tx, ...h.transactions],
      };
    });
    setAmount(""); setNote("");
  };

  const setActualDirect = (cat, monthIdx, val) => {
    update(h => {
      const arr = [...(h.actual.expense[cat] || zeros())];
      arr[monthIdx] = val;
      return { ...h, actual: { ...h.actual, expense: { ...h.actual.expense, [cat]: arr } } };
    });
  };

  const deleteTransaction = (tx) => {
    update(h => {
      const arr = [...(h.actual.expense[tx.category] || zeros())];
      arr[tx.month] = Math.max(0, arr[tx.month] - tx.amount);
      return {
        ...h,
        actual: { ...h.actual, expense: { ...h.actual.expense, [tx.category]: arr } },
        transactions: h.transactions.filter(t => t.id !== tx.id),
      };
    });
  };

  const expenseTx = household.transactions.filter(t => t.type === "expense");
  const showInitials = household.preferences?.showPartnerInitials && household.partners?.length > 0;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Expenses</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 24px", fontSize: 14 }}>Set your budget for {MONTHS[selectedMonth]}, then log purchases as they happen below.</p>

      <Card style={{ marginBottom: 20, overflowX: "auto" }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 14px", color: COLORS.ink }}>Monthly budget</h3>
        {household.categories.expense.length === 0 ? (
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft }}>No expense categories yet — add some in the Categories tab.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", ...fontBody, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", color: COLORS.inkSoft, fontWeight: 600 }}>Category</th>
                <th style={{ textAlign: "right", padding: "6px 8px", color: COLORS.inkSoft, fontWeight: 600 }}>Planned ({MONTHS[selectedMonth]})</th>
                <th style={{ textAlign: "right", padding: "6px 8px", color: COLORS.inkSoft, fontWeight: 600 }}>Actual</th>
                <th style={{ textAlign: "right", padding: "6px 8px", color: COLORS.inkSoft, fontWeight: 600 }}>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {household.categories.expense.map(cat => {
                const planned = (household.budget.expense[cat] || zeros())[selectedMonth];
                const act = (household.actual.expense[cat] || zeros())[selectedMonth];
                const remaining = planned - act;
                return (
                  <tr key={cat} style={{ borderTop: `1px solid ${COLORS.border}` }}>
                    <td style={{ padding: "8px" }}>
                      {household.categoryIcons?.expense?.[cat] && <span style={{ marginRight: 6 }}>{household.categoryIcons.expense[cat]}</span>}
                      {cat}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <input
                        type="number" onFocus={e => e.target.select()} value={planned}
                        onChange={e => setBudgetVal(cat, Number(e.target.value))}
                        style={{
                          ...fontBody, width: 90, textAlign: "right", padding: "5px 8px", borderRadius: 6,
                          border: `1.5px solid ${COLORS.gold}`, background: "#FFF8EA", fontSize: 13, outline: "none",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Checkbox
                          checked={!!household.sameEveryMonth.expense[cat]}
                          onChange={(checked) => toggleSame(cat, checked)}
                          label="Same from here on"
                        />
                      </div>
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: COLORS.inkSoft }}>{fmt(act)}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: remaining >= 0 ? COLORS.success : COLORS.alert }}>
                      {remaining >= 0 ? "" : "+"}{fmt(remaining)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <BulkFillCard household={household} setActualDirect={setActualDirect} />

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 14px", color: COLORS.ink }}>Log a purchase</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: household.partners?.length > 0 ? 10 : 0 }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, minWidth: 180 }}>
            <option value="">Select category…</option>
            {household.categories.expense.map(c => (
              <option key={c} value={c}>{household.categoryIcons?.expense?.[c] ? `${household.categoryIcons.expense[c]} ${c}` : c}</option>
            ))}
          </select>
          <input type="number" onFocus={e => e.target.select()} placeholder={`Amount (${CURRENCY_SYMBOL})`} value={amount} onChange={e => setAmount(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, width: 130 }} />
          <input placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, flex: 1, minWidth: 160 }} />
          <button onClick={addTransaction} style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "0 18px", fontWeight: 700, cursor: "pointer" }}>Add</button>
        </div>
        {household.partners?.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, fontWeight: 600 }}>Logged by:</span>
            {household.partners.map(p => (
              <Chip key={p} active={loggedBy === p} onClick={() => setLoggedBy(p)}>{p}</Chip>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 12px", color: COLORS.ink }}>Recent purchases</h3>
        {expenseTx.length === 0 ? (
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft }}>Nothing logged yet.</p>
        ) : (
          <div>
            {expenseTx.slice(0, 15).map(tx => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}`, ...fontBody, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {showInitials && tx.loggedBy && (
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22,
                      borderRadius: "50%", background: COLORS.lavender, color: COLORS.primary, fontSize: 10, fontWeight: 800,
                    }} title={tx.loggedBy}>
                      {initialsOf(tx.loggedBy)}
                    </span>
                  )}
                  <div>
                    {household.categoryIcons?.expense?.[tx.category] && <span style={{ marginRight: 4 }}>{household.categoryIcons.expense[tx.category]}</span>}
                    <span style={{ fontWeight: 600 }}>{tx.category}</span>
                    {tx.note && <span style={{ color: COLORS.inkSoft }}> · {tx.note}</span>}
                    <span style={{ color: COLORS.inkSoft }}> · {MONTHS[tx.month]}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, color: COLORS.ink }}>-{fmt(tx.amount)}</span>
                  <button
                    onClick={() => deleteTransaction(tx)}
                    title="Delete this entry"
                    style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex", padding: 2 }}
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================================================
   RESERVES VIEW  (the signature feature)
   ============================================================ */
function ReserveGoalCard({ cat, icon, savedYtd, goal, releasedIdx, monthly, selectedMonth, onGoalChange, onMonthlyChange, onRelease, onDelete }) {
  const isReleased = releasedIdx !== null && releasedIdx !== undefined;
  const target = Number(goal?.targetAmount) || 0;
  const remainingMonths = monthsRemainingInclusive(goal?.targetDate, selectedMonth);
  // Base the suggestion on what was saved BEFORE this month, so this month's own
  // entry doesn't get counted twice (once as "saved", once as still "remaining").
  const savedBeforeThisMonth = savedYtd - monthly;
  const stillNeeded = Math.max(0, target - savedBeforeThisMonth);
  const suggested = target > 0 && remainingMonths !== null ? stillNeeded / remainingMonths : null;
  const pct = target > 0 ? Math.min(100, (savedYtd / target) * 100) : 0;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h4 style={{ ...fontDisplay, fontSize: 18, margin: 0, color: COLORS.ink }}>{icon && <span>{icon} </span>}{cat}</h4>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isReleased && <span style={{ ...fontBody, fontSize: 11, background: COLORS.lavender, color: COLORS.primary, padding: "3px 8px", borderRadius: 12, fontWeight: 700 }}>Paid</span>}
          {confirmingDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft }}>Delete & free up {fmt(savedYtd)}?</span>
              <button
                onClick={onDelete}
                style={{ ...fontBody, fontSize: 11, fontWeight: 700, color: "#fff", background: COLORS.alert, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}
              >
                Yes, delete
              </button>
              <button
                onClick={() => setConfirmingDelete(false)}
                style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, background: "none", border: "none", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              title="Delete this reserve goal"
              style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex" }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* left: goal setup */}
        <div style={{ flex: "1 1 220px", minWidth: 220 }}>
          <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
            Annual goal — how much in total?
          </label>
          <div style={{ position: "relative", marginBottom: 10 }}>
            <span style={{ position: "absolute", left: 12, top: 9, ...fontBody, fontSize: 14, color: COLORS.inkSoft }}>{CURRENCY_SYMBOL}</span>
            <input
              type="number" onFocus={e => e.target.select()} value={goal?.targetAmount || ""}
              onChange={e => onGoalChange({ ...goal, targetAmount: Number(e.target.value) })}
              placeholder="e.g. 1200"
              style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 26px", borderRadius: 8, border: `1.5px solid ${COLORS.gold}`, background: "#FFF8EA", fontSize: 14, outline: "none" }}
            />
          </div>
          <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
            When does it need to be paid?
          </label>
          <input
            type="date" value={goal?.targetDate || ""}
            onChange={e => onGoalChange({ ...goal, targetDate: e.target.value })}
            style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.gold}`, background: "#FFF8EA", fontSize: 13, outline: "none", marginBottom: 6 }}
          />
          {goal?.targetDate && (
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: 0 }}>
              Due {formatDate(goal.targetDate)} · {remainingMonths} {remainingMonths === 1 ? "month" : "months"} left to save
            </p>
          )}
        </div>

        {/* right: progress + this month's input */}
        <div style={{ flex: "1 1 240px", minWidth: 240 }}>
          <div style={{ height: 14, width: "100%", background: COLORS.lavender, borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.primary})`, transition: "width .4s" }} />
          </div>
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.ink, margin: "0 0 12px" }}>
            <strong>{fmt(savedYtd)}</strong> saved so far {target > 0 && <span style={{ color: COLORS.inkSoft }}>of {fmt(target)} goal</span>}
          </p>

          {target > 0 && goal?.targetDate ? (
            <div style={{ background: COLORS.lavender, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <p style={{ ...fontBody, fontSize: 12, color: COLORS.primary, fontWeight: 700, margin: "0 0 2px" }}>
                Suggested this month: {fmt(suggested)}
              </p>
              <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: 0 }}>
                {fmt(stillNeeded)} still needed ÷ {remainingMonths || 1} month{remainingMonths === 1 ? "" : "s"} remaining
              </p>
            </div>
          ) : (
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>
              Set a goal amount and date on the left to see a suggested monthly amount.
            </p>
          )}

          <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
            What did you actually set aside this month?
          </label>
          <input
            type="number" onFocus={e => e.target.select()} value={monthly}
            onChange={e => onMonthlyChange(Number(e.target.value))}
            style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.primary}`, fontSize: 14, outline: "none", marginBottom: 10 }}
          />

          <button
            onClick={onRelease}
            style={{
              ...fontBody, width: "100%", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
              border: `1.5px solid ${COLORS.primary}`, background: isReleased ? "#fff" : COLORS.primary, color: isReleased ? COLORS.primary : "#fff",
            }}
          >
            {isReleased ? "Mark as not yet paid" : "Mark as paid — release this reserve"}
          </button>
        </div>
      </div>
    </Card>
  );
}

function ReservesView({ household, update, selectedMonth, setSelectedMonth }) {
  const setMonthly = (cat, val) => {
    update(h => {
      const arr = [...(h.actual.reserve[cat] || zeros())];
      arr[selectedMonth] = val;
      return { ...h, actual: { ...h.actual, reserve: { ...h.actual.reserve, [cat]: arr } } };
    });
  };
  const setGoal = (cat, goal) => {
    update(h => ({ ...h, reserveGoals: { ...h.reserveGoals, [cat]: goal } }));
  };
  const toggleRelease = (cat) => {
    update(h => ({
      ...h,
      releasedThrough: { ...h.releasedThrough, [cat]: h.releasedThrough[cat] == null ? selectedMonth : null },
    }));
  };
  const deleteReserve = (cat) => {
    update(h => {
      const categories = { ...h.categories, reserve: h.categories.reserve.filter(c => c !== cat) };
      const budget = { ...h.budget.reserve }; delete budget[cat];
      const actual = { ...h.actual.reserve }; delete actual[cat];
      const icons = { ...h.categoryIcons.reserve }; delete icons[cat];
      const released = { ...h.releasedThrough }; delete released[cat];
      const goals = { ...h.reserveGoals }; delete goals[cat];
      return {
        ...h,
        categories,
        budget: { ...h.budget, reserve: budget },
        actual: { ...h.actual, reserve: actual },
        categoryIcons: { ...h.categoryIcons, reserve: icons },
        releasedThrough: released,
        reserveGoals: goals,
        // Nothing else needs to change: since this category no longer exists,
        // it drops out of the "reserved" total automatically — any money
        // still sitting in this pot becomes free to spend right away.
      };
    });
  };

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Reserves</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 8px", fontSize: 14, maxWidth: 680 }}>
        Set the total you want to save this year and when it's due — the app splits the rest across your remaining
        months. Save more one month and next month's suggestion drops automatically; save less and it rises. Change
        the goal any time, even mid-year — the months-remaining count just adjusts.
      </p>

      {household.categories.reserve.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40, marginTop: 20 }}>
          <p style={{ ...fontBody, color: COLORS.inkSoft }}>No reserve goals yet — add one in Categories.</p>
        </Card>
      ) : (
        <div style={{ marginTop: 20 }}>
          {household.categories.reserve.map(cat => {
            const arr = household.actual.reserve[cat] || zeros();
            const savedYtd = arr.slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0);
            return (
              <ReserveGoalCard
                key={cat}
                cat={cat}
                icon={household.categoryIcons?.reserve?.[cat]}
                savedYtd={savedYtd}
                goal={household.reserveGoals?.[cat] || { targetAmount: 0, targetDate: "" }}
                releasedIdx={household.releasedThrough[cat]}
                monthly={arr[selectedMonth]}
                selectedMonth={selectedMonth}
                onGoalChange={(g) => setGoal(cat, g)}
                onMonthlyChange={(v) => setMonthly(cat, v)}
                onRelease={() => toggleRelease(cat)}
                onDelete={() => deleteReserve(cat)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   CATEGORIES VIEW
   ============================================================ */
const ICON_CHOICES = ["💰","💵","🏠","🚗","🍔","🛒","🎬","✈️","💊","🎁","⚡","📱","🏥","🎓","❤️","🐶","👶","☕","🧾","💼","📈","🛡️","🔧","🎉"];

function AccountPanel({ household, sessionPassword, onRename }) {
  const [newId, setNewId] = useState(household.code || "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const inviteLink = buildInviteLink(household.code, sessionPassword);

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitRename = async () => {
    setMessage(""); setBusy(true);
    try {
      await onRename(newId, confirmPassword);
      setMessage("✅ Your login id has been updated.");
      setConfirmPassword("");
    } catch (e) {
      setMessage("❌ " + (e?.message || "Couldn't update your login id."));
    }
    setBusy(false);
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 4px", color: COLORS.ink }}>Account</h3>
      <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, margin: "0 0 16px" }}>
        Manage your login id and invite your partner.
      </p>

      <div style={{ marginBottom: 20 }}>
        <p style={{ ...fontBody, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
          <UserPlus size={14} /> Invite your partner
        </p>
        {inviteLink ? (
          <>
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: "0 0 8px" }}>
              Anyone who opens this link is logged straight in — no separate account needed.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                readOnly value={inviteLink}
                style={{ ...fontBody, flex: 1, minWidth: 0, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 12, background: COLORS.lavender, boxSizing: "border-box" }}
                onFocus={e => e.target.select()}
              />
              <button
                onClick={copyLink}
                style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </>
        ) : (
          <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: 0 }}>
            Log out and log back in normally (instead of from a restored backup) to generate an invite link.
          </p>
        )}
      </div>

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 18 }}>
        <p style={{ ...fontBody, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
          <Pencil size={14} /> Change your login id
        </p>
        <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: "0 0 10px" }}>
          Currently <code style={{ background: COLORS.lavender, padding: "2px 6px", borderRadius: 4 }}>{household.code}</code>. Changing it means you'll both need the new id to log in from now on.
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <input
            value={newId} onChange={e => setNewId(e.target.value)}
            placeholder="New login id"
            style={{ ...fontBody, flex: "1 1 160px", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none" }}
          />
          <input
            type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Current password"
            style={{ ...fontBody, flex: "1 1 160px", padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none" }}
          />
          <button
            onClick={submitRename}
            disabled={busy || !newId.trim() || !confirmPassword}
            style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontWeight: 700, cursor: "pointer", opacity: (busy || !newId.trim() || !confirmPassword) ? 0.6 : 1 }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {message && (
          <p style={{ ...fontBody, fontSize: 12, margin: 0, color: message.startsWith("✅") ? COLORS.success : COLORS.alert }}>
            {message}
          </p>
        )}
      </div>
    </Card>
  );
}

function CategoriesView({ household, update, sessionPassword, onRename }) {
  const addCat = (type, name, icon) => {
    if (!name.trim() || household.categories[type].includes(name.trim())) return;
    update(h => ({
      ...h,
      categories: { ...h.categories, [type]: [...h.categories[type], name.trim()] },
      budget: { ...h.budget, [type]: { ...h.budget[type], [name.trim()]: zeros() } },
      actual: { ...h.actual, [type]: { ...h.actual[type], [name.trim()]: zeros() } },
      categoryIcons: { ...h.categoryIcons, [type]: { ...h.categoryIcons[type], [name.trim()]: icon || null } },
      ...(type === "reserve" ? {
        releasedThrough: { ...h.releasedThrough, [name.trim()]: null },
        reserveGoals: { ...h.reserveGoals, [name.trim()]: { targetAmount: 0, targetDate: "" } },
      } : {}),
      ...(type === "income" ? {
        sameEveryMonth: { ...h.sameEveryMonth, income: { ...h.sameEveryMonth.income, [name.trim()]: false } },
        copyActualFromExpected: { ...h.copyActualFromExpected, income: { ...h.copyActualFromExpected.income, [name.trim()]: Array(12).fill(false) } },
      } : {}),
      ...(type === "expense" ? {
        sameEveryMonth: { ...h.sameEveryMonth, expense: { ...h.sameEveryMonth.expense, [name.trim()]: false } },
      } : {}),
    }));
  };
  const removeCat = (type, name) => {
    update(h => {
      const cats = h.categories[type].filter(c => c !== name);
      const budget = { ...h.budget[type] }; delete budget[name];
      const actual = { ...h.actual[type] }; delete actual[name];
      const icons = { ...h.categoryIcons[type] }; delete icons[name];
      return { ...h, categories: { ...h.categories, [type]: cats }, budget: { ...h.budget, [type]: budget }, actual: { ...h.actual, [type]: actual }, categoryIcons: { ...h.categoryIcons, [type]: icons } };
    });
  };

  const IconPicker = ({ icon, setIcon }) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(o => !o)}
          type="button"
          style={{
            width: 38, height: 38, borderRadius: 8, border: `1.5px solid ${COLORS.border}`, background: "#fff",
            fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {icon || "🏷️"}
        </button>
        {open && (
          <div style={{
            position: "absolute", top: 42, left: 0, zIndex: 10, background: "#fff", border: `1px solid ${COLORS.border}`,
            borderRadius: 10, padding: 8, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)", width: 210,
          }}>
            {ICON_CHOICES.map(ic => (
              <button key={ic} type="button" onClick={() => { setIcon(ic); setOpen(false); }}
                style={{ fontSize: 17, background: "none", border: "none", cursor: "pointer", borderRadius: 6, padding: 4 }}>
                {ic}
              </button>
            ))}
            <button type="button" onClick={() => { setIcon(null); setOpen(false); }}
              style={{ fontSize: 11, gridColumn: "span 6", color: COLORS.inkSoft, background: "none", border: "none", cursor: "pointer", ...fontBody }}>
              No icon
            </button>
          </div>
        )}
      </div>
    );
  };

  const Section = ({ type, title, suggestions }) => {
    const [val, setVal] = useState("");
    const [icon, setIcon] = useState(null);
    return (
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 12px", color: COLORS.ink }}>{title}</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {household.categories[type].map(c => (
            <div key={c} style={{
              ...fontBody, display: "flex", alignItems: "center", gap: 6, background: COLORS.lavender,
              color: COLORS.primary, padding: "6px 10px 6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            }}>
              {household.categoryIcons?.[type]?.[c] && <span>{household.categoryIcons[type][c]}</span>}
              {c}
              <button onClick={() => removeCat(type, c)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.primary, display: "flex" }}>
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {suggestions.filter(s => !household.categories[type].includes(s)).map(s => (
            <Chip key={s} onClick={() => addCat(type, s, SUGGESTED_ICONS[type]?.[s])}>
              {SUGGESTED_ICONS[type]?.[s] ? `${SUGGESTED_ICONS[type][s]} ` : "+ "}{s}
            </Chip>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <IconPicker icon={icon} setIcon={setIcon} />
          <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && (addCat(type, val, icon), setVal(""), setIcon(null))}
            placeholder="Add your own category…"
            style={{ ...fontBody, flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none" }} />
          <button onClick={() => { addCat(type, val, icon); setVal(""); setIcon(null); }} style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontWeight: 700, cursor: "pointer" }}>Add</button>
        </div>
      </Card>
    );
  };

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Categories & Settings</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 24px", fontSize: 14 }}>Pick from suggestions or add your own — anytime.</p>
      <AccountPanel household={household} sessionPassword={sessionPassword} onRename={onRename} />
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 4px", color: COLORS.ink }}>Appearance</h3>
        <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, margin: "0 0 4px" }}>Change the app's colors whenever you like.</p>
        <ThemePicker theme={household.theme || THEMES[0]} setTheme={(t) => update(h => ({ ...h, theme: t }))} />
        <CurrencyPicker currency={household.currency || CURRENCIES[0]} setCurrency={(c) => update(h => ({ ...h, currency: c }))} />
      </Card>
      <Section type="income" title="Income" suggestions={SUGGESTED.income} />
      <Section type="expense" title="Expenses" suggestions={SUGGESTED.expense} />
      <Section type="reserve" title="Reserves" suggestions={SUGGESTED.reserve} />
      <PreferencesPanel household={household} update={update} />
    </div>
  );
}

function PreferencesPanel({ household, update }) {
  const [open, setOpen] = useState(false);
  const prefs = household.preferences || { showPartnerInitials: true, numberFormat: "US", dateFormat: "MDY", density: "comfortable" };
  const setPref = (key, val) => update(h => ({ ...h, preferences: { ...h.preferences, [key]: val } }));

  return (
    <Card>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: 0,
        }}
      >
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: 0, color: COLORS.ink }}>Preferences</h3>
        {open ? <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(-90deg)" }} /> : <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(90deg)" }} />}
      </button>

      {open && (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={{ ...fontBody, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 6px" }}>Show who logged it</p>
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: "0 0 8px" }}>
              Show a small partner initial next to purchases in the transaction log.
            </p>
            <Checkbox
              checked={!!prefs.showPartnerInitials}
              onChange={(checked) => setPref("showPartnerInitials", checked)}
              label="Show partner initials on transactions"
            />
          </div>

          <div>
            <p style={{ ...fontBody, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 8px" }}>Number format</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Chip active={prefs.numberFormat === "US"} onClick={() => setPref("numberFormat", "US")}>1,234.56 (US)</Chip>
              <Chip active={prefs.numberFormat === "EU"} onClick={() => setPref("numberFormat", "EU")}>1.234,56 (EU)</Chip>
            </div>
          </div>

          <div>
            <p style={{ ...fontBody, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 8px" }}>Date format</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Chip active={prefs.dateFormat === "MDY"} onClick={() => setPref("dateFormat", "MDY")}>MM/DD/YYYY</Chip>
              <Chip active={prefs.dateFormat === "DMY"} onClick={() => setPref("dateFormat", "DMY")}>DD/MM/YYYY</Chip>
            </div>
          </div>

          <div>
            <p style={{ ...fontBody, fontSize: 13, fontWeight: 700, color: COLORS.ink, margin: "0 0 8px" }}>Density</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Chip active={prefs.density === "comfortable"} onClick={() => setPref("density", "comfortable")}>Comfortable</Chip>
              <Chip active={prefs.density === "compact"} onClick={() => setPref("density", "compact")}>Compact</Chip>
            </div>
            <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, marginTop: 6 }}>Compact tightens spacing in tables and cards — handy on smaller screens.</p>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)),
  ]);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apiCall(path, body, ms = 10000) {
  const res = await withTimeout(
    fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    ms, "Request"
  );
  let json;
  try { json = await res.json(); } catch { json = {}; }
  if (!res.ok) throw new Error(json.error || `Server responded ${res.status}`);
  return json;
}

// Creates a new household record on the server (Supabase), with retries for transient hiccups.
async function createHouseholdRecord(household, plainPassword) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { id } = await apiCall("/api/household/create", { household, password: plainPassword });
      return id;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await sleep(attempt * 800);
    }
  }
  throw lastErr;
}

async function saveHouseholdRecord(id, household, plainPassword) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await apiCall("/api/household/save", { id, password: plainPassword, household });
      return true;
    } catch (e) {
      lastErr = e;
      if (attempt < 3) await sleep(attempt * 800);
    }
  }
  throw lastErr;
}

async function loadHouseholdRecord(id, plainPassword) {
  try {
    const { household } = await apiCall("/api/household/login", { id, password: plainPassword });
    return household;
  } catch (e) {
    return null;
  }
}

async function renameHouseholdRecord(id, plainPassword, newId) {
  const { id: updatedId } = await apiCall("/api/household/rename", { id, password: plainPassword, newId });
  return updatedId;
}

// UTF-8-safe base64 helpers, so accented characters in a password don't break btoa/atob.
function utf8ToBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function base64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

// Invite links carry the id+password in the URL fragment (never sent to the server or logged)
// so a partner can click the link and land straight in the app, logged in.
function buildInviteLink(id, password) {
  if (typeof window === "undefined" || !id || !password) return "";
  const payload = utf8ToBase64(JSON.stringify({ id, password }));
  return `${window.location.origin}${window.location.pathname}#invite=${payload}`;
}

function parseInviteFromHash() {
  if (typeof window === "undefined") return null;
  const match = window.location.hash.match(/#invite=([^&]+)/);
  if (!match) return null;
  try {
    const decoded = JSON.parse(base64ToUtf8(decodeURIComponent(match[1])));
    if (decoded?.id && decoded?.password) return decoded;
  } catch {}
  return null;
}

const SESSION_KEY = "twogether_session"; // { id, password } — stored locally so you stay logged in

// --- Backup safety net: works even when the cloud storage above is having a bad day ---
function exportHouseholdToFile(household) {
  const blob = new Blob([JSON.stringify({ household, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `twogether-${(household.code || household.name || "household").replace(/[^a-z0-9-]/gi, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function readHouseholdFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const h = parsed.household || parsed; // tolerate either wrapped or raw household JSON
        if (!h || !h.categories) throw new Error("This doesn't look like a Twogether backup file.");
        resolve(h);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.readAsText(file);
  });
}

function LandingScreen({ onCreate, onJoin, onImport }) {
  const [mode, setMode] = useState("choose"); // "choose" | "join"
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState("");
  const [testing, setTesting] = useState(false);

  const submitJoin = async () => {
    setError(""); setLoading(true);
    const ok = await onJoin(code.trim(), password);
    setLoading(false);
    if (!ok) setError("Couldn't find that household, or the password is wrong.");
  };

  const runStorageTest = async () => {
    setTesting(true); setTestResult("");
    try {
      const id = await createHouseholdRecord({ name: "diagnostic-test", test: true, categories: { income: [], expense: [], reserve: [] } }, "diagnostic-password");
      const loaded = await loadHouseholdRecord(id, "diagnostic-password");
      if (loaded && loaded.test === true) {
        setTestResult("✅ Database connection works! (created and read back a test record fine)");
      } else {
        setTestResult("⚠ Server responded, but with unexpected content: " + JSON.stringify(loaded));
      }
    } catch (e) {
      setTestResult("❌ Database test failed: " + (e?.message || String(e)) + " — check your Supabase environment variables.");
    }
    setTesting(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 20% 10%, ${COLORS.lavender}, ${COLORS.bg} 60%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, justifyContent: "center" }}>
          <div style={{ background: COLORS.primary, borderRadius: 12, padding: 10, display: "flex" }}>
            <PiggyBank size={22} color="#fff" />
          </div>
          <span style={{ ...fontDisplay, fontSize: 24, color: COLORS.primary, fontWeight: 600 }}>Twogether</span>
        </div>

        <Card>
          {mode === "choose" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={onCreate}
                style={{
                  ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10,
                  padding: "14px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "left",
                }}
              >
                ✨ Create a new household
              </button>
              <button
                onClick={() => setMode("join")}
                style={{
                  ...fontBody, background: "#fff", color: COLORS.primary, border: `1.5px solid ${COLORS.border}`, borderRadius: 10,
                  padding: "14px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "left",
                }}
              >
                🔑 Log in to an existing household
              </button>
              <label
                style={{
                  ...fontBody, background: "#fff", color: COLORS.primary, border: `1.5px solid ${COLORS.gold}`, borderRadius: 10,
                  padding: "14px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "left", display: "block",
                }}
              >
                📂 Restore from a backup file
                <input
                  type="file" accept=".json,application/json" style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const h = await readHouseholdFromFile(file);
                      onImport(h);
                    } catch (err) {
                      setError(err.message || "Couldn't read that file.");
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              {error && mode === "choose" && (
                <p style={{ ...fontBody, fontSize: 12, color: COLORS.alert, margin: 0 }}>{error}</p>
              )}
              <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 12 }}>
                <button
                  onClick={runStorageTest}
                  disabled={testing}
                  style={{
                    ...fontBody, background: "none", border: "none", color: COLORS.inkSoft, cursor: "pointer",
                    fontSize: 12, fontWeight: 600, padding: 0,
                  }}
                >
                  {testing ? "Testing storage…" : "🔧 Not working? Test storage connection"}
                </button>
                {testResult && (
                  <p style={{ ...fontBody, fontSize: 12, marginTop: 8, color: testResult.startsWith("✅") ? COLORS.success : COLORS.alert }}>
                    {testResult}
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === "join" && (
            <div>
              <h2 style={{ ...fontDisplay, fontSize: 20, margin: "0 0 16px", color: COLORS.ink }}>Log in</h2>
              <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>Household ID</label>
              <input
                value={code} onChange={e => setCode(e.target.value)}
                placeholder="Paste the ID your partner shared"
                style={{ ...fontBody, width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
              />
              <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitJoin()}
                style={{ ...fontBody, width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
              />
              {error && <p style={{ ...fontBody, fontSize: 12, color: COLORS.alert, margin: "0 0 8px" }}>{error}</p>}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button
                  onClick={() => setMode("choose")}
                  style={{ ...fontBody, background: "none", border: "none", color: COLORS.inkSoft, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  Back
                </button>
                <button
                  onClick={submitJoin}
                  disabled={!code.trim() || !password || loading}
                  style={{
                    ...fontBody, flex: 1, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10,
                    padding: "10px 18px", fontWeight: 700, cursor: "pointer", opacity: (!code.trim() || !password || loading) ? 0.6 : 1,
                  }}
                >
                  {loading ? "Checking…" : "Log in"}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function HouseholdBudgetApp() {
  const [screen, setScreen] = useState("loading"); // "loading" | "landing" | "onboarding" | "app" | "created"
  const [household, setHousehold] = useState(null);
  const [sessionPassword, setSessionPassword] = useState(null); // kept in memory + localStorage so you stay logged in
  const [view, setView] = useState("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(DEFAULT_MONTH_IDX);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved", "error"
  const [justCreatedId, setJustCreatedId] = useState(null);

  const update = (fn) => setHousehold(h => fn(h));

  // On first load, try to restore the session from localStorage so you don't
  // have to log in again every time you open the site.
  useEffect(() => {
    (async () => {
      const invite = parseInviteFromHash();
      if (invite) {
        // Strip the credentials out of the URL/history right away, whether or not login succeeds.
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        const h = await loadHouseholdRecord(invite.id, invite.password);
        if (h) {
          setHousehold({ ...h, code: invite.id });
          setSessionPassword(invite.password);
          try { localStorage.setItem(SESSION_KEY, JSON.stringify({ id: invite.id, password: invite.password })); } catch {}
          setScreen("app");
          return;
        }
      }
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch {}
      if (saved?.id && saved?.password) {
        const h = await loadHouseholdRecord(saved.id, saved.password);
        if (h) {
          setHousehold({ ...h, code: saved.id });
          setSessionPassword(saved.password);
          setScreen("app");
          return;
        }
      }
      setScreen("landing");
    })();
  }, []);

  // Persist to the remote record whenever household data changes (after initial creation/join)
  useEffect(() => {
    if (!household || !sessionPassword || !household.code) return;
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      try {
        await saveHouseholdRecord(household.code, household, sessionPassword);
        setSaveStatus("saved");
      } catch (e) {
        console.error("Auto-save failed:", e);
        setSaveStatus("error");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [household, sessionPassword]);

  useEffect(() => {
    if (household?.theme) {
      applyTheme(household.theme);
      PALETTE = paletteFor(household.theme);
    }
  }, [household?.theme]);

  useEffect(() => {
    if (household?.currency) {
      CURRENCY_SYMBOL = household.currency.symbol;
    }
  }, [household?.currency]);

  useEffect(() => {
    if (household?.preferences) {
      NUMBER_LOCALE = household.preferences.numberFormat === "EU" ? "de-DE" : "en-US";
      DATE_FORMAT = household.preferences.dateFormat || "MDY";
      DENSITY = household.preferences.density || "comfortable";
    }
  }, [household?.preferences]);

  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const rememberSession = (id, password) => {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify({ id, password })); } catch {}
  };

  const handleCreate = async (h, plainPassword) => {
    setAuthError(""); setAuthBusy(true);
    try {
      const id = await createHouseholdRecord(h, plainPassword);
      h.code = id;
      setSessionPassword(plainPassword);
      setHousehold(h);
      setJustCreatedId(id);
      rememberSession(id, plainPassword);
      setScreen("created"); // show the share-this-id screen before entering the app
    } catch (e) {
      console.error("Create failed:", e);
      setAuthError("Couldn't create your household right now: " + (e?.message || String(e)) + ". Please try again.");
    }
    setAuthBusy(false);
  };

  const handleJoin = async (code, plainPassword) => {
    if (!code) return false;
    try {
      const h = await loadHouseholdRecord(code.trim(), plainPassword);
      if (!h) return false;
      const withCode = { ...h, code: code.trim() };
      setSessionPassword(plainPassword);
      setHousehold(withCode);
      rememberSession(code.trim(), plainPassword);
      setScreen("app");
      return true;
    } catch (e) {
      console.error("Join failed:", e);
      return false;
    }
  };

  const handleRename = async (newId, currentPassword) => {
    const updatedId = await renameHouseholdRecord(household.code, currentPassword, newId);
    setHousehold(h => ({ ...h, code: updatedId }));
    rememberSession(updatedId, sessionPassword);
    return updatedId;
  };

  const handleLogout = () => {
    setHousehold(null);
    setSessionPassword(null);
    try { localStorage.removeItem(SESSION_KEY); } catch {}
    setScreen("landing");
  };

  if (screen === "loading") {
    return (
      <>
        <FontLoader />
        <ResponsiveStyles />
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: COLORS.bg, ...fontBody, color: COLORS.inkSoft }}>
          Loading…
        </div>
      </>
    );
  }

  if (screen === "landing") {
    return (
      <>
        <FontLoader />
        <ResponsiveStyles />
        <LandingScreen
          onCreate={() => setScreen("onboarding")}
          onJoin={handleJoin}
          onImport={(h) => {
            setHousehold(h);
            setSessionPassword(null); // restored from file, not tied to cloud storage until saved again
            setScreen("app");
          }}
        />
      </>
    );
  }

  if (screen === "onboarding" || (!household && screen !== "created")) {
    return (
      <>
        <FontLoader />
        <ResponsiveStyles />
        <Onboarding onComplete={handleCreate} authError={authError} authBusy={authBusy} />
      </>
    );
  }

  if (screen === "created") {
    return (
      <>
        <FontLoader />
        <ResponsiveStyles />
        <div style={{ minHeight: "100vh", background: `radial-gradient(circle at 20% 10%, ${COLORS.lavender}, ${COLORS.bg} 60%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 460 }}>
            <Card>
              <h2 style={{ ...fontDisplay, fontSize: 22, margin: "0 0 8px", color: COLORS.ink }}>🎉 Household created!</h2>
              <p style={{ ...fontBody, fontSize: 14, color: COLORS.inkSoft, margin: "0 0 16px" }}>
                Share this ID and your password with your partner if you want them to log in too — no account needed on their end.
              </p>
              <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>Household ID</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <input
                  readOnly value={justCreatedId}
                  style={{ ...fontBody, flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 14, background: COLORS.lavender, boxSizing: "border-box" }}
                  onFocus={e => e.target.select()}
                />
                <button
                  onClick={() => { navigator.clipboard?.writeText(justCreatedId); }}
                  style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontWeight: 700, cursor: "pointer" }}
                >
                  Copy
                </button>
              </div>
              <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, marginBottom: 16 }}>
                Keep this ID somewhere safe — you'll both need it (plus your password) to log back in later.
              </p>
              <button
                onClick={() => setScreen("app")}
                style={{
                  ...fontBody, width: "100%", background: COLORS.gold, color: COLORS.ink, border: "none", borderRadius: 10,
                  padding: "12px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer",
                }}
              >
                Continue to my household →
              </button>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <FontLoader />
      <ResponsiveStyles />
      <div className="app-shell" style={{ background: COLORS.bg }}>
        <Sidebar view={view} setView={setView} household={household} onLogout={handleLogout} saveStatus={saveStatus} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {saveStatus === "error" && (
            <div style={{
              background: COLORS.alert, color: "#fff", padding: "10px 20px", ...fontBody, fontSize: 13, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
            }}>
              <span>⚠ Your changes aren't being saved right now — if you close or refresh this page, you could lose them.</span>
              <button
                onClick={() => setHousehold(h => ({ ...h }))}
                style={{ ...fontBody, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
              >
                Retry now
              </button>
            </div>
          )}
          <div className="top-bar" style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.card }}>
            <span style={{ ...fontBody, fontSize: 14, fontWeight: 600, color: COLORS.inkSoft }}>{household.name}</span>
            <MonthSwitcher selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
          </div>
          <div style={{ flex: 1 }}>
            {view === "dashboard" && <Dashboard household={household} selectedMonth={selectedMonth} />}
            {view === "income" && <IncomeView household={household} update={update} selectedMonth={selectedMonth} />}
            {view === "expenses" && <ExpensesView household={household} update={update} selectedMonth={selectedMonth} />}
            {view === "reserves" && <ReservesView household={household} update={update} selectedMonth={selectedMonth} />}
            {view === "categories" && <CategoriesView household={household} update={update} sessionPassword={sessionPassword} onRename={handleRename} />}
          </div>
        </div>
      </div>
    </>
  );
}

function FontLoader() {
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
}

function ResponsiveStyles() {
  return (
    <style>{`
      * { box-sizing: border-box; }
      .app-shell { display: flex; min-height: 100vh; }
      .sidebar { width: 220px; }
      .sidebar-nav-item { width: 100%; }
      .top-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 16px 32px; }
      .page-content { padding: 32px; }
      .kpi-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
      .kpi-card { flex: 1; min-width: 180px; }

      @media (max-width: 760px) {
        .app-shell { flex-direction: column; }
        .sidebar {
          width: 100%; min-height: auto !important; position: sticky; top: 0; z-index: 20;
          padding: 8px 6px !important; order: -1;
        }
        .sidebar-header, .sidebar-household, .sidebar-footer { display: none; }
        .sidebar-nav { display: flex; flex-direction: row; justify-content: space-around; gap: 2px; }
        .sidebar-nav-item {
          flex-direction: column; gap: 2px !important; font-size: 10px !important; padding: 6px 2px !important;
          margin-bottom: 0 !important; text-align: center; justify-content: center;
        }
        .sidebar-nav-label { font-size: 10px; }

        .top-bar { padding: 10px 14px !important; gap: 8px; }
        .top-bar > span { font-size: 12px !important; }

        .page-content { padding: 16px !important; }
        h1 { font-size: 22px !important; }

        .kpi-row { gap: 10px; }
        .kpi-card { min-width: 47% !important; flex: 1 1 47% !important; }
        .kpi-card .kpi-value { font-size: 15px !important; }

        table { font-size: 11px !important; }
      }
    `}</style>
  );
}
