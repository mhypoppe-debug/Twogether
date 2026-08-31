"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Home, Wallet, PiggyBank, Receipt, ChevronRight, ChevronLeft,
  Plus, X, Check, Users, TrendingUp, TrendingDown, Sparkles, Lock,
  UserPlus, Pencil, GripVertical, Settings as SettingsIcon, CreditCard, RefreshCw,
  Download, Share, Camera
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
const DEFAULT_MONTH_IDX = new Date().getMonth(); // open on the current real-world month

const SUGGESTED = {
  income: ["Partner 1 Salary", "Partner 2 Salary", "Bonus", "Investments / Dividends", "Other / Extra"],
  expense: ["Rent", "Mortgage", "Groceries", "Utilities", "Transportation", "Dining Out", "Health", "Taxes", "Insurance", "Maintenance"],
  reserve: ["Insurance", "Gifts", "Vacation fund", "Home Repairs", "Taxes"],
  debt: ["Credit card", "Student loan", "Car loan", "Mortgage", "Personal loan"],
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
  debt: {
    "Credit card": "💳",
    "Student loan": "🎓",
    "Car loan": "🚗",
    "Mortgage": "🏦",
    "Personal loan": "🧾",
  },
};

const DEBT_FREQUENCIES = [
  { key: "monthly", label: "Monthly", perYear: 12 },
  { key: "quarterly", label: "Quarterly", perYear: 4 },
  { key: "biannual", label: "Half-yearly", perYear: 2 },
  { key: "yearly", label: "Yearly", perYear: 1 },
];

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

// decimals defaults to 0 (Dashboard and Debt show whole numbers); other tabs pass 2.
const fmt = (n, decimals = 0) => {
  const v = Number(n) || 0;
  const neg = v < 0;
  return (neg ? `-${CURRENCY_SYMBOL}` : CURRENCY_SYMBOL) + Math.abs(v).toLocaleString(NUMBER_LOCALE, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
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
    releasedAmount: {}, // { reserveCatName: amount actually paid, when it differs from what was saved }
    archivedReserves: [], // [reserveCatName] — settled goals tucked out of the active list
    reserveGoals: {}, // { reserveCatName: { targetAmount, targetDate: "YYYY-MM-DD" } }
    sameEveryMonth: { income: {}, expense: {} }, // { catName: bool } — planned value applies to all 12 months
    copyActualFromExpected: { income: {} }, // { catName: bool } — actual income mirrors the planned amount
    categoryIcons: { income: {}, expense: {}, reserve: {} }, // { catName: emoji }
    categoryAddedMonth: { income: {}, expense: {}, reserve: {} }, // { catName: monthIdx } — hidden before this month
    categoryRemovedMonth: { income: {}, expense: {}, reserve: {} }, // { catName: monthIdx | null } — hidden from this month on
    debts: [], // [{ id, name, icon, currentAmount, interestRate (annual %), paymentFrequency, paymentAmount }]
    preferences: {
      showPartnerInitials: true,
      numberFormat: "US",   // "US" = 1,234.56   ·   "EU" = 1.234,56
      dateFormat: "MDY",    // "MDY" = 07/14/2026   ·   "DMY" = 14/07/2026
      density: "comfortable", // "comfortable" | "compact"
    },
  };
}

function zeros() { return Array(12).fill(0); }

// A category is visible for a given month if it had already been added by then,
// and hadn't been removed yet — old months keep showing categories that have
// since been removed; months before a category existed never show it.
function isCategoryVisible(household, type, cat, monthIdx) {
  const added = household.categoryAddedMonth?.[type]?.[cat] ?? 0;
  const removed = household.categoryRemovedMonth?.[type]?.[cat];
  return monthIdx >= added && (removed == null || monthIdx < removed);
}
function visibleCategories(household, type, monthIdx) {
  return household.categories[type].filter(c => isCategoryVisible(household, type, c, monthIdx));
}

// Renames a category everywhere it's used as a key — past months, icons, goals, linked
// debts, transaction history, all of it — so the change really does apply retroactively
// instead of just to the category list.
function renameCategory(h, type, oldName, newName) {
  const trimmed = (newName || "").trim();
  if (!trimmed || trimmed === oldName || h.categories[type].includes(trimmed)) return h;
  const renameKey = (obj) => {
    if (!obj || !(oldName in obj)) return obj;
    const { [oldName]: val, ...rest } = obj;
    return { ...rest, [trimmed]: val };
  };
  const next = {
    ...h,
    categories: { ...h.categories, [type]: h.categories[type].map(c => c === oldName ? trimmed : c) },
    budget: { ...h.budget, [type]: renameKey(h.budget[type]) },
    actual: { ...h.actual, [type]: renameKey(h.actual[type]) },
    categoryIcons: { ...h.categoryIcons, [type]: renameKey(h.categoryIcons[type]) },
    categoryAddedMonth: { ...h.categoryAddedMonth, [type]: renameKey(h.categoryAddedMonth[type]) },
    categoryRemovedMonth: { ...h.categoryRemovedMonth, [type]: renameKey(h.categoryRemovedMonth[type]) },
    transactions: h.transactions.map(t => t.type === type && t.category === oldName ? { ...t, category: trimmed } : t),
    debts: (h.debts || []).map(d => d.linkedCategory?.type === type && d.linkedCategory?.name === oldName
      ? { ...d, linkedCategory: { ...d.linkedCategory, name: trimmed } }
      : d),
  };
  if (type === "reserve") {
    next.releasedThrough = renameKey(h.releasedThrough);
    next.releasedAmount = renameKey(h.releasedAmount);
    next.reserveGoals = renameKey(h.reserveGoals);
    next.archivedReserves = (h.archivedReserves || []).map(c => c === oldName ? trimmed : c);
  }
  if (type === "income") {
    next.sameEveryMonth = { ...h.sameEveryMonth, income: renameKey(h.sameEveryMonth.income) };
    next.copyActualFromExpected = { ...h.copyActualFromExpected, income: renameKey(h.copyActualFromExpected.income) };
  }
  if (type === "expense") {
    next.sameEveryMonth = { ...h.sameEveryMonth, expense: renameKey(h.sameEveryMonth.expense) };
  }
  return next;
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

function KpiCard({ icon: Icon, label, value, delta, tone, breakdown, decimals = 0 }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="kpi-card"
      onMouseEnter={() => breakdown && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(135deg, ${tone} 0%, ${COLORS.primary} 100%)`,
        borderRadius: 18, padding: "20px 22px", color: "#fff",
        boxShadow: "0 4px 14px rgba(91,33,89,0.18)", position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.9, fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", ...fontBody }}>
        <Icon size={15} /> {label}
      </div>
      <div className="kpi-value" style={{ ...fontDisplay, fontSize: 30, fontWeight: 600, marginTop: 8 }}>{fmt(value, decimals)}</div>
      {delta !== undefined && (
        <div style={{ ...fontBody, fontSize: 12, marginTop: 6, opacity: 0.9, display: "flex", alignItems: "center", gap: 4 }}>
          {delta >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {fmt(Math.abs(delta), decimals)} vs last month
        </div>
      )}
      {breakdown && hovered && breakdown.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 30, minWidth: 200,
          background: COLORS.card, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          padding: "10px 14px", ...fontBody,
        }}>
          {breakdown.map(b => (
            <div key={b.name} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12, color: COLORS.ink, padding: "3px 0" }}>
              <span>{b.icon && <span>{b.icon} </span>}{b.name}</span>
              <span style={{ fontWeight: 700, whiteSpace: "nowrap", paddingLeft: 10 }}>{b.display ?? fmt(b.value, decimals)}</span>
            </div>
          ))}
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
  const [theme, setThemeState] = useState(THEMES[0]);
  const [currency, setCurrencyState] = useState(CURRENCIES[0]);
  const [income, setIncome] = useState([]);
  const [expense, setExpense] = useState([]);
  const [reserve, setReserve] = useState([]);
  const [startBal, setStartBal] = useState("");

  // Apply the mutation *before* the state update that triggers the re-render, so the
  // very next render already reflects it — waiting for a separate effect means the
  // change only shows up visually on some *later*, unrelated re-render.
  const setTheme = (t) => { applyTheme(t); PALETTE = paletteFor(t); setThemeState(t); };
  const setCurrency = (c) => { CURRENCY_SYMBOL = c.symbol; setCurrencyState(c); };

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
    <div style={{ minHeight: "100dvh", background: `radial-gradient(circle at 20% 10%, ${COLORS.lavender}, ${COLORS.bg} 60%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
    { key: "debt", label: "Debt", icon: CreditCard },
    { key: "categories", label: "Settings", icon: SettingsIcon },
  ];
  const statusText = { saving: "Saving…", saved: "✓ Saved", error: "⚠ Save failed" }[saveStatus] || "";
  return (
    <div className="sidebar" style={{ background: COLORS.primary, minHeight: "100dvh", padding: "24px 16px", boxSizing: "border-box", flexShrink: 0, position: "relative" }}>
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
            {Icon && <Icon size={17} />} <span className="sidebar-nav-label">{label}</span>
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
      const savedThroughRelease = arr.slice(0, Math.min(releasedIdx, monthIdx) + 1).reduce((a, b) => a + b, 0);
      // releasedAmount is what was actually paid, which can differ from what was saved
      // (e.g. you chose to keep the leftover saved instead of freeing it up).
      const paidAmount = h.releasedAmount?.[cat];
      const accrued = paidAmount != null ? Math.min(paidAmount, savedThroughRelease) : savedThroughRelease;
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
        {MONTHS.map((m, i) => <option key={m} value={i}>{m} {new Date().getFullYear()}</option>)}
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

// A reserve category's suggested monthly amount, computed the same way ReserveGoalCard
// does — either a fixed slice of a linked debt's next payment, or (for a plain goal)
// what's still needed divided by the months left. Returns null if there's nothing to
// compare against (no goal, no link).
function reserveMonthlySuggestion(household, cat, selectedMonth) {
  const linkedDebt = (household.debts || []).find(d => d.linkedCategory?.type === "reserve" && d.linkedCategory?.name === cat);
  if (linkedDebt) {
    const payment = nextDebtPaymentTotal(linkedDebt);
    return { suggested: payment.total / payment.monthsPerPeriod, linkedDebt };
  }
  const goal = household.reserveGoals?.[cat];
  const target = Number(goal?.targetAmount) || 0;
  const remainingMonths = monthsRemainingInclusive(goal?.targetDate, selectedMonth);
  if (target > 0 && remainingMonths !== null) {
    const arr = household.actual.reserve[cat] || zeros();
    const savedYtd = arr.slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0);
    const savedBefore = savedYtd - (arr[selectedMonth] || 0);
    return { suggested: Math.max(0, target - savedBefore) / remainingMonths, linkedDebt: null };
  }
  return null;
}

function StatusOverview({ household, selectedMonth }) {
  const visibleReserve = (household.categories.reserve || []).filter(cat => !(household.archivedReserves || []).includes(cat));

  // A small overshoot isn't really worth a headline — require a solid amount of extra
  // before calling it out.
  const MEANINGFUL_EXTRA = 500;

  const reserveStatus = visibleReserve.map(cat => {
    const arr = household.actual.reserve[cat] || zeros();
    const thisMonth = arr[selectedMonth] || 0;
    const info = reserveMonthlySuggestion(household, cat, selectedMonth);
    if (!info) return null;
    return {
      cat, icon: household.categoryIcons?.reserve?.[cat], thisMonth,
      suggested: info.suggested, extra: thisMonth - info.suggested,
      onTrack: thisMonth >= info.suggested - 0.01, linkedDebtName: info.linkedDebt?.name || null,
    };
  }).filter(Boolean);

  // Reserve goals (not debt-linked ones — those don't really "finish") crossed this month.
  const goalsReached = visibleReserve.map(cat => {
    const target = Number(household.reserveGoals?.[cat]?.targetAmount) || 0;
    if (target <= 0) return null;
    const arr = household.actual.reserve[cat] || zeros();
    const savedYtd = arr.slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0);
    const savedBefore = savedYtd - (arr[selectedMonth] || 0);
    if (savedBefore < target && savedYtd >= target) return { cat, icon: household.categoryIcons?.reserve?.[cat] };
    return null;
  }).filter(Boolean);

  // Debts paid down extra this month, via a linked reserve overshooting its target.
  const debtWins = (household.debts || [])
    .filter(d => d.linkedCategory?.type === "reserve" && (d.reserveSurplusMode || "add") === "add")
    .map(d => {
      const arr = household.actual.reserve[d.linkedCategory.name] || zeros();
      const payment = nextDebtPaymentTotal(d);
      const regularMonthly = payment.total / payment.monthsPerPeriod;
      const extra = (arr[selectedMonth] || 0) - regularMonthly;
      return extra > MEANINGFUL_EXTRA ? { name: d.name, icon: d.icon, extra } : null;
    })
    .filter(Boolean);

  const incomeThisMonth = sumMonth(household.actual.income, selectedMonth);
  const priorIncomeAvg = selectedMonth > 0
    ? Array.from({ length: selectedMonth }, (_, i) => sumMonth(household.actual.income, i)).reduce((a, b) => a + b, 0) / selectedMonth
    : 0;
  const incomeWin = priorIncomeAvg > 0 && incomeThisMonth > priorIncomeAvg * 1.1;

  // Pick the single most exciting thing to headline, most specific/exciting first —
  // always naming the amount, not just that something good happened.
  let positive = null;
  if (debtWins.length > 0) {
    const best = debtWins.sort((a, b) => b.extra - a.extra)[0];
    positive = `Paying down ${best.icon ? `${best.icon} ` : ""}${best.name} an extra ${fmt(best.extra, 2)} this month — nice! 💪`;
  } else if (goalsReached.length > 0) {
    const g = goalsReached[0];
    const target = Number(household.reserveGoals?.[g.cat]?.targetAmount) || 0;
    positive = `You hit your ${g.icon ? `${g.icon} ` : ""}${g.cat} goal — ${fmt(target, 2)} saved! 🎉`;
  } else if (reserveStatus.some(r => r.extra > MEANINGFUL_EXTRA)) {
    const best = reserveStatus.filter(r => r.extra > MEANINGFUL_EXTRA).sort((a, b) => b.extra - a.extra)[0];
    positive = `Extra ${fmt(best.extra, 2)} saved for ${best.icon ? `${best.icon} ` : ""}${best.cat} this month!`;
  } else if (incomeWin) {
    positive = `Income up this month — ${fmt(incomeThisMonth, 2)} vs your usual ${fmt(priorIncomeAvg, 2)}.`;
  } else {
    positive = "Steady as she goes this month.";
  }

  // Flag whichever expense category is running well above its own recent average —
  // a simple "watch out" signal, not a judgement on any particular category.
  let warning = null;
  if (selectedMonth > 0) {
    const spikes = household.categories.expense.map(cat => {
      const arr = household.actual.expense[cat] || zeros();
      const thisMonth = arr[selectedMonth] || 0;
      const avg = arr.slice(0, selectedMonth).reduce((a, b) => a + b, 0) / selectedMonth;
      const overshoot = thisMonth - avg;
      return avg > 0 && thisMonth > avg * 1.5 && overshoot > 20
        ? { cat, icon: household.categoryIcons?.expense?.[cat], thisMonth, avg, overshoot }
        : null;
    }).filter(Boolean).sort((a, b) => b.overshoot - a.overshoot);
    if (spikes.length > 0) {
      const s = spikes[0];
      warning = `${s.icon ? `${s.icon} ` : ""}${s.cat} is running high this month — ${fmt(s.thisMonth, 2)} vs your usual ${fmt(s.avg, 2)}. Keep an eye on it.`;
    }
  }

  return (
    <Card>
      <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 10px", color: COLORS.ink }}>How you're doing</h3>
      <p style={{ ...fontBody, fontSize: 14, color: COLORS.primary, fontWeight: 700, margin: warning ? "0 0 6px" : 0 }}>{positive}</p>
      {warning && (
        <p style={{ ...fontBody, fontSize: 13, color: COLORS.alert, fontWeight: 600, margin: 0 }}>⚠ {warning}</p>
      )}
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

  const spendingData = [
    ...household.categories.expense.map(c => ({ name: c, icon: household.categoryIcons?.expense?.[c], reserved: false, value: (household.actual.expense[c] || zeros()).slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0) })),
    ...household.categories.reserve.map(c => ({ name: c, icon: household.categoryIcons?.reserve?.[c], reserved: true, value: (household.actual.reserve[c] || zeros()).slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0) })),
  ].filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  const spendingMax = Math.max(1, ...spendingData.map(d => d.value));
  const spendingTotal = spendingData.reduce((a, d) => a + d.value, 0);

  // Mirrors the per-category logic inside computeKpis, so these totals add up to kpis.reservedTotal.
  const reserveBreakdown = household.categories.reserve
    .map(cat => {
      const arr = household.actual.reserve[cat] || zeros();
      const releasedIdx = household.releasedThrough[cat];
      const saved = arr.slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0);
      let reservedAmt = saved;
      if (releasedIdx !== null && releasedIdx !== undefined) {
        const savedThroughRelease = arr.slice(0, Math.min(releasedIdx, selectedMonth) + 1).reduce((a, b) => a + b, 0);
        const paidAmount = household.releasedAmount?.[cat];
        const accrued = paidAmount != null ? Math.min(paidAmount, savedThroughRelease) : savedThroughRelease;
        reservedAmt = Math.max(0, saved - accrued);
      }
      return { name: cat, icon: household.categoryIcons?.reserve?.[cat], value: reservedAmt };
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Each debt's payoff date (if a first-payment date is set) or payments remaining otherwise.
  const debtBreakdown = (household.debts || [])
    .filter(d => (Number(d.currentAmount) || 0) > 0)
    .map(d => {
      const paymentIncludesInterest = d.paymentIncludesInterest ?? true;
      const { rows, freq } = buildDebtSchedule(d.currentAmount, d.interestRate, d.paymentFrequency, d.paymentAmount, paymentIncludesInterest, d.paymentOverrides || {});
      let display;
      if (rows.length === 0) {
        display = "—";
      } else if (d.firstPaymentDate) {
        const monthsPerPeriod = 12 / freq.perYear;
        display = formatDate(addMonthsToDateStr(d.firstPaymentDate, ((d.paidPeriods || 0) + rows.length - 1) * monthsPerPeriod));
      } else {
        display = `${rows.length} payments left`;
      }
      return { name: d.name, icon: d.icon, value: Number(d.currentAmount) || 0, display };
    })
    .sort((a, b) => b.value - a.value);
  const totalDebt = (household.debts || []).reduce((a, d) => a + (Number(d.currentAmount) || 0), 0);

  const noData = household.transactions.length === 0;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Where you stand</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 20px", fontSize: 14 }}>{MONTHS[selectedMonth]} {new Date().getFullYear()}</p>

      <div className="kpi-row" style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <KpiCard icon={Wallet} label="Bank balance" value={kpis.bankBalance} tone={COLORS.accent} />
        <KpiCard icon={Sparkles} label="Free to spend" value={kpis.freeToSpend} tone={COLORS.gold} />
        <KpiCard icon={PiggyBank} label="Reserved" value={kpis.reservedTotal} tone={"#6B4C8A"} breakdown={reserveBreakdown} />
        {totalDebt > 0 && (
          <KpiCard icon={CreditCard} label="Debt" value={totalDebt} tone={COLORS.alert} breakdown={debtBreakdown} />
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <StatusOverview household={household} selectedMonth={selectedMonth} />
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
            <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 16px", color: COLORS.ink }}>Year at a glance</h3>
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
            <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 16px", color: COLORS.ink }}>Spending year to date</h3>
            {spendingData.length === 0 ? (
              <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft }}>No spending logged yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {spendingData.map((d, i) => (
                  <div key={`${d.name}-${d.reserved}`}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                      <span style={{ ...fontBody, fontSize: 12, color: COLORS.ink, display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                        {d.icon && <span>{d.icon}</span>}
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {d.name}{d.reserved && <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> (reserved)</span>}
                        </span>
                      </span>
                      <span style={{ ...fontBody, fontSize: 12, flexShrink: 0, paddingLeft: 8 }}>
                        <span style={{ fontWeight: 700, color: COLORS.ink }}>{fmt(d.value)}</span>
                        <span style={{ color: COLORS.inkSoft }}> · {spendingTotal > 0 ? Math.round((d.value / spendingTotal) * 100) : 0}%</span>
                      </span>
                    </div>
                    <div style={{ height: 8, width: "100%", background: COLORS.lavender, borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(d.value / spendingMax) * 100}%`, background: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
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
function IncomeView({ household, update, selectedMonth, setSelectedMonth }) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loggedBy, setLoggedBy] = useState(household.partners?.[0] || "");
  const [chartMode, setChartMode] = useState("month"); // "month" | "ytd"

  const addTransaction = () => {
    if (!category || !amount) return;
    update(h => {
      const arr = [...(h.actual.income[category] || zeros())];
      arr[selectedMonth] += Number(amount);
      const tx = {
        id: Date.now(), month: selectedMonth, type: "income", category, amount: Number(amount), note, loggedBy: loggedBy || null,
        date: new Date().toISOString().slice(0, 10),
      };
      return {
        ...h,
        actual: { ...h.actual, income: { ...h.actual.income, [category]: arr } },
        transactions: [tx, ...h.transactions],
      };
    });
    setAmount(""); setNote("");
  };

  const deleteTransaction = (tx) => {
    update(h => {
      const arr = [...(h.actual.income[tx.category] || zeros())];
      arr[tx.month] = Math.max(0, arr[tx.month] - tx.amount);
      return {
        ...h,
        actual: { ...h.actual, income: { ...h.actual.income, [tx.category]: arr } },
        transactions: h.transactions.filter(t => t.id !== tx.id),
      };
    });
  };

  const updateTransactionDate = (txId, date) => {
    update(h => ({ ...h, transactions: h.transactions.map(t => t.id === txId ? { ...t, date } : t) }));
  };

  const incomeTx = household.transactions.filter(t => t.type === "income" && t.month === selectedMonth);
  const showInitials = household.preferences?.showPartnerInitials && household.partners?.length > 0;

  const visibleIncome = visibleCategories(household, "income", selectedMonth);

  const monthIncomeData = visibleIncome
    .map(c => ({ name: c, icon: household.categoryIcons?.income?.[c], value: (household.actual.income[c] || zeros())[selectedMonth] }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const monthIncomeMax = Math.max(1, ...monthIncomeData.map(d => d.value));
  const monthIncomeTotal = monthIncomeData.reduce((a, d) => a + d.value, 0);

  const incomeBreakdown = household.categories.income
    .map(c => ({ name: c, icon: household.categoryIcons?.income?.[c], value: (household.actual.income[c] || zeros()).slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const incomeYtd = incomeBreakdown.reduce((a, d) => a + d.value, 0);

  const chartData = chartMode === "ytd" ? incomeBreakdown : monthIncomeData;
  const chartMax = chartMode === "ytd" ? Math.max(1, ...incomeBreakdown.map(d => d.value)) : monthIncomeMax;
  const chartTotal = chartMode === "ytd" ? incomeYtd : monthIncomeTotal;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Income</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 24px", fontSize: 14 }}>Log income as it comes in — {MONTHS[selectedMonth]}'s breakdown below.</p>

      {(monthIncomeData.length > 0 || incomeBreakdown.length > 0) && (
        <Card style={{ marginBottom: 20, maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
            <h3 style={{ ...fontDisplay, fontSize: 17, margin: 0, color: COLORS.ink }}>
              {chartMode === "ytd" ? "Year to date" : `${MONTHS[selectedMonth]}'s income`}
              <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {fmt(chartTotal, 2)}</span>
            </h3>
            <button
              onClick={() => setChartMode(m => m === "ytd" ? "month" : "ytd")}
              title={chartMode === "ytd" ? "Switch to this month" : "Switch to YTD view"}
              style={{
                ...fontBody, display: "flex", alignItems: "center", gap: 6, background: COLORS.lavender, color: COLORS.primary,
                border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
              }}
            >
              <RefreshCw size={13} />
              {chartMode === "ytd" ? MONTHS[selectedMonth] : "YTD View"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chartData.map((d, i) => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ ...fontBody, fontSize: 12, color: COLORS.ink, display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    {d.icon && <span>{d.icon}</span>}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  </span>
                  <span style={{ ...fontBody, fontSize: 12, flexShrink: 0, paddingLeft: 8 }}>
                    <span style={{ fontWeight: 700, color: COLORS.ink }}>{fmt(d.value, 2)}</span>
                    <span style={{ color: COLORS.inkSoft }}> · {chartTotal > 0 ? Math.round((d.value / chartTotal) * 100) : 0}%</span>
                  </span>
                </div>
                <div style={{ height: 8, width: "100%", background: COLORS.lavender, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.value / chartMax) * 100}%`, background: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 14px", color: COLORS.ink }}>Log income</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: household.partners?.length > 0 ? 10 : 0 }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, minWidth: 180 }}>
            <option value="">Select source…</option>
            {visibleIncome.map(c => (
              <option key={c} value={c}>{household.categoryIcons?.income?.[c] ? `${household.categoryIcons.income[c]} ${c}` : c}</option>
            ))}
          </select>
          <input type="number" onFocus={e => e.target.select()} onKeyDown={e => e.key === "Enter" && addTransaction()} placeholder={`Amount (${CURRENCY_SYMBOL})`} value={amount} onChange={e => setAmount(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, width: 130 }} />
          <input placeholder="Note (optional)" onKeyDown={e => e.key === "Enter" && addTransaction()} value={note} onChange={e => setNote(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, flex: 1, minWidth: 160 }} />
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
        <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 12px", color: COLORS.ink }}>{MONTHS[selectedMonth]} income</h3>
        {incomeTx.length === 0 ? (
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft }}>Nothing logged for {MONTHS[selectedMonth]} yet.</p>
        ) : (
          <div>
            {incomeTx.slice(0, 15).map(tx => (
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
                    {household.categoryIcons?.income?.[tx.category] && <span style={{ marginRight: 4 }}>{household.categoryIcons.income[tx.category]}</span>}
                    <span style={{ fontWeight: 600 }}>{tx.category}</span>
                    {tx.note && <span style={{ color: COLORS.inkSoft }}> · {tx.note}</span>}
                    <div>
                      <input
                        type="date" value={tx.date || ""} onChange={e => updateTransactionDate(tx.id, e.target.value)}
                        style={{
                          ...fontBody, fontSize: 11, color: COLORS.inkSoft, background: "none", border: "none", padding: 0,
                          outline: "none", cursor: "pointer", marginTop: 2,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, color: COLORS.success }}>+{fmt(tx.amount, 2)}</span>
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

      <ChangeCategoriesPanel type="income" suggestions={SUGGESTED.income} household={household} update={update} selectedMonth={selectedMonth} />
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

// Shared currency-amount shape, reused everywhere an amount needs to be found or stripped
// out of OCR'd text so the "what counts as an amount" rule can't drift between call sites.
// Matches ordinary "45,30" / "45.30" / "1.234,56" style amounts, and also the Dutch banking
// shorthand for a whole-euro amount, "12,-" (no cents shown at all).
const OCR_AMOUNT_SOURCE = "-?\\s?[€$£]?\\s?\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{2}\\b|,-(?!\\d))";
const OCR_AMOUNT_RE = new RegExp(OCR_AMOUNT_SOURCE);
const OCR_AMOUNT_RE_G = new RegExp(OCR_AMOUNT_SOURCE, "g");

// Works out whether "," or "." is the decimal separator from whichever comes last in the
// match, and handles the cents-less "12,-" shorthand as a whole-euro amount.
function parseOcrAmountMatch(raw) {
  const cleaned = raw.replace(/[€$£\s-]/g, "");
  if (cleaned.endsWith(",") || cleaned.endsWith(".")) {
    const value = Number(cleaned.slice(0, -1));
    return isNaN(value) || value <= 0 ? null : value;
  }
  const decimalIdx = Math.max(cleaned.lastIndexOf(","), cleaned.lastIndexOf("."));
  if (decimalIdx === -1) return null;
  const intPart = cleaned.slice(0, decimalIdx).replace(/[.,]/g, "");
  const decPart = cleaned.slice(decimalIdx + 1);
  const value = Number(`${intPart}.${decPart}`);
  return isNaN(value) || value <= 0 ? null : value;
}

// Best-effort amount extraction from OCR'd bank-app text: grabs the first currency-shaped
// number (banking screenshots put the transaction amount right at the top).
function extractAmountFromOcrText(text) {
  const matches = text.match(OCR_AMOUNT_RE_G);
  if (!matches || matches.length === 0) return null;
  return parseOcrAmountMatch(matches[0]);
}

// A rough guess at a description: the first line with real words in it (skips lines that
// are just numbers, dates, or symbols) — always left editable, this is only a head start.
function extractNoteFromOcrText(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const candidate = lines.find(l => /[a-zA-Z]{3,}/.test(l) && l.length <= 40 && !OCR_AMOUNT_RE.test(l));
  return candidate || "";
}

const OCR_MONTH_NAMES = {
  jan: 1, january: 1, januari: 1,
  feb: 2, february: 2, februari: 2,
  mar: 3, march: 3, maart: 3,
  apr: 4, april: 4,
  may: 5, mei: 5,
  jun: 6, june: 6, juni: 6,
  jul: 7, july: 7, juli: 7,
  aug: 8, august: 8, augustus: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, okt: 10, october: 10, oktober: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

// Best-effort date extraction (EN/NL) — "26 augustus 2026", "26/08/2026", ISO, or
// "today"/"vandaag" & "yesterday"/"gisteren" relative to now. Returns "YYYY-MM-DD" or
// null if nothing recognizable was found — better to skip the duplicate check than guess.
function extractDateFromOcrText(text, referenceDate = new Date()) {
  const lower = text.toLowerCase();
  if (/\bvandaag\b|\btoday\b/.test(lower)) return referenceDate.toISOString().slice(0, 10);
  if (/\bgisteren\b|\byesterday\b/.test(lower)) {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  let m = text.match(/\b(\d{1,2})\s+([a-zA-Zéû]+)\s+(\d{4})\b/); // "26 augustus 2026"
  if (m) {
    const day = Number(m[1]);
    const month = OCR_MONTH_NAMES[m[2].toLowerCase()];
    const year = Number(m[3]);
    if (month && day >= 1 && day <= 31) return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  m = text.match(/\b([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})\b/); // "Aug 26, 2026"
  if (m) {
    const month = OCR_MONTH_NAMES[m[1].toLowerCase()];
    const day = Number(m[2]);
    const year = Number(m[3]);
    if (month && day >= 1 && day <= 31) return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/); // day-first, European convention
  if (m) {
    const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

// Walks a screenshot line by line so a transaction *list* (several rows, maybe grouped
// under date headers) yields one candidate per amount found, instead of just the first.
// A date header line updates "the date in effect" for every row under it until the next
// one; a line with both a date and an amount uses its own date. A single line can also
// hold more than one amount — Tesseract sometimes merges two visually-close rows (or a
// running balance) into one line — so every amount on a line becomes its own candidate,
// sharing that line's leftover text as a note. Works just as well for a single-transaction
// screenshot — that just yields a list of one.
function extractTransactionCandidatesFromOcrLines(lines, referenceDate = new Date()) {
  let currentDate = null;
  const candidates = [];
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const dateHere = extractDateFromOcrText(line, referenceDate);
    if (dateHere) currentDate = dateHere;
    let amountMatches = line.match(OCR_AMOUNT_RE_G);
    let usedBareFallback = false;
    if (!amountMatches && dateHere) {
      // OCR sometimes drops the decimal separator entirely (e.g. "13,50" read as "1350"),
      // most often on a line that's otherwise a clean "date + amount" pair. Only try this
      // narrow fallback there — a bare number right after a recognised date and a currency
      // word/symbol, read as whole-euros-and-cents — rather than anywhere in the text.
      const bare = line.match(/(?:USD|EUR|GBP|[€$£])\s*(\d{3,5})\b/i);
      if (bare) { amountMatches = [`${bare[1].slice(0, -2)}.${bare[1].slice(-2)}`]; usedBareFallback = true; }
    }
    if (!amountMatches) return;
    // A line that itself contains the date (e.g. "on 24-08-2026 USD 123,85") is almost
    // always a metadata line, not a description — the merchant name is on the line above
    // it, so prefer that. Otherwise (amount and description share one line, no date on
    // it) strip the amount out of the line itself, same as before.
    let note = "";
    if (dateHere) {
      const prev = (lines[i - 1] || "").trim();
      if (/[a-zA-Z]{3,}/.test(prev) && !OCR_AMOUNT_RE.test(prev)) note = prev;
    }
    if (!note) note = usedBareFallback ? "" : line.replace(OCR_AMOUNT_RE_G, "").trim();
    if (note.length < 3) {
      const prev = (lines[i - 1] || "").trim();
      if (/[a-zA-Z]{3,}/.test(prev) && !OCR_AMOUNT_RE.test(prev)) note = prev;
    }
    amountMatches.forEach(raw2 => {
      const amount = parseOcrAmountMatch(raw2);
      if (amount != null) candidates.push({ amount, note, date: dateHere || currentDate });
    });
  });
  return candidates;
}

// Many bank apps lay a transaction list out in two columns: merchant name + date on the
// left (often two lines each), and just the amount on the right, lined up per row.
// Tesseract's layout analysis reads that as separate blocks — every description
// top-to-bottom, then every amount top-to-bottom — rather than interleaving them row by
// row, which is why a plain line-by-line walk drops or misattributes rows. Detect a block
// whose lines are ALL amounts (that's the amount column) and pair amount #i with the i-th
// group of lines from the other block(s) by position instead.
function ocrBlocksToLineGroups(blocks) {
  return (blocks || [])
    .map(b => (b.paragraphs || []).flatMap(p => (p.lines || []).map(l => l.text.trim())).filter(Boolean))
    .filter(g => g.length > 0);
}

function extractTransactionCandidatesFromOcrBlocks(blocks, referenceDate = new Date()) {
  const blockLineGroups = ocrBlocksToLineGroups(blocks);

  const amountBlockIdx = blockLineGroups.findIndex(g => g.length > 1 && g.every(l => OCR_AMOUNT_RE.test(l)));

  if (amountBlockIdx !== -1) {
    const amountLines = blockLineGroups[amountBlockIdx];
    const textLines = blockLineGroups.filter((_, i) => i !== amountBlockIdx).flat();
    const groupSize = Math.max(1, Math.round(textLines.length / amountLines.length) || 1);
    const candidates = amountLines.map((amtLine, i) => {
      const match = amtLine.match(OCR_AMOUNT_RE);
      const amount = match ? parseOcrAmountMatch(match[0]) : null;
      if (amount == null) return null;
      const group = textLines.slice(i * groupSize, i * groupSize + groupSize);
      let date = null;
      const noteParts = [];
      group.forEach(l => {
        const d = extractDateFromOcrText(l, referenceDate);
        if (d) date = d; else if (/[a-zA-Z]{3,}/.test(l)) noteParts.push(l);
      });
      return { amount, note: noteParts.join(" ").trim(), date };
    }).filter(Boolean);
    if (candidates.length > 0) return candidates;
  }

  return extractTransactionCandidatesFromOcrLines(blockLineGroups.flat(), referenceDate);
}

function ExpensesView({ household, update, selectedMonth, setSelectedMonth }) {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loggedBy, setLoggedBy] = useState(household.partners?.[0] || "");
  const [chartMode, setChartMode] = useState("month"); // "month" | "ytd"
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [duplicateTx, setDuplicateTx] = useState(null); // the existing transaction this scan looks like a repeat of
  const [scannedDate, setScannedDate] = useState(""); // "YYYY-MM-DD" read off the screenshot, if found
  const [scanQueue, setScanQueue] = useState([]); // several candidates found on one screenshot, reviewed one by one
  const [scanDebugText, setScanDebugText] = useState(""); // what the scanner actually read, shown collapsed for troubleshooting
  const [categoryFilter, setCategoryFilter] = useState(""); // "" = all categories

  const findDuplicate = (date, amt) => date && household.transactions.find(t =>
    t.type === "expense" && t.date === date && Math.abs(t.amount - amt) < 0.005
  );

  // Runs entirely in the browser (Tesseract.js, no server, no API key, no cost) — reads
  // the screenshot's text, pulls out an amount, a date, and a rough description, and
  // fills the form so all that's left is picking the category. When the screenshot is a
  // list (several rows, like a bank-app transaction history) it queues up every row it
  // found instead, so each one can be reviewed and categorised individually.
  const scanScreenshot = async (file) => {
    setScanning(true);
    setScanError("");
    setDuplicateTx(null);
    setScannedDate("");
    setScanQueue([]);
    setScanDebugText("");
    try {
      const Tesseract = await import("tesseract.js");
      // Tesseract.recognize(file, lang) only ever returns { text }. Per-line data lives
      // under { blocks: true } output, which needs the lower-level worker API instead of
      // the recognize() shorthand.
      const worker = await Tesseract.createWorker("eng");
      const { data } = await worker.recognize(file, {}, { text: true, blocks: true });
      await worker.terminate();
      const blockLineGroups = ocrBlocksToLineGroups(data.blocks || []);
      setScanDebugText(blockLineGroups.map((g, i) => `Block ${i + 1}:\n${g.map(l => `  "${l}"`).join("\n")}`).join("\n\n") || data.text || "(nothing recognised)");
      const candidates = extractTransactionCandidatesFromOcrBlocks(data.blocks || []);

      if (candidates.length > 1) {
        setScanQueue(candidates.map((c, i) => ({
          id: `${Date.now()}-${i}`, amount: String(c.amount), note: c.note || "", date: c.date || "",
          category: "", duplicateOf: findDuplicate(c.date, c.amount) || null,
        })));
      } else {
        // A single row (or nothing recognisable as a list) — the whole-text extraction
        // is tuned for this case and reads single-transaction screenshots more reliably.
        const foundAmount = extractAmountFromOcrText(data.text);
        const foundDate = extractDateFromOcrText(data.text);
        const foundNote = extractNoteFromOcrText(data.text);
        if (foundAmount != null) {
          setAmount(String(foundAmount));
          if (foundDate) {
            setScannedDate(foundDate);
            // Same amount AND same date already logged — flag it rather than silently let
            // a re-scanned or duplicate screenshot get added twice. Two genuine purchases
            // for the same amount on the same day would normally show up together on one
            // bank-app screenshot anyway, so this combination is a safe enough signal.
            const existing = findDuplicate(foundDate, foundAmount);
            if (existing) setDuplicateTx(existing);
          }
          if (foundNote) setNote(foundNote);
        } else {
          setScanError("Couldn't find an amount in that screenshot — enter it by hand.");
        }
      }
    } catch (e) {
      setScanError("Couldn't read that screenshot — enter the details by hand.");
    }
    setScanning(false);
  };

  // Shared by the manual "Add" button and every per-row "Add" button in the scan queue.
  const logExpense = (cat, amt, txNote, date) => {
    update(h => {
      const arr = [...(h.actual.expense[cat] || zeros())];
      arr[selectedMonth] += Number(amt);
      const tx = {
        id: Date.now() + Math.random(), month: selectedMonth, type: "expense", category: cat, amount: Number(amt), note: txNote, loggedBy: loggedBy || null,
        date: date || new Date().toISOString().slice(0, 10),
      };
      // Logging an expense in a category linked to a debt IS that period's payment —
      // pay it down automatically instead of requiring a separate settle step.
      const debts = payDownLinkedDebt(h, "expense", cat, Number(amt), selectedMonth);
      return {
        ...h,
        actual: { ...h.actual, expense: { ...h.actual.expense, [cat]: arr } },
        transactions: [tx, ...h.transactions],
        debts,
      };
    });
  };

  const addTransaction = () => {
    if (!category || !amount) return;
    logExpense(category, amount, note, scannedDate);
    setAmount(""); setNote(""); setDuplicateTx(null); setScannedDate("");
  };

  const updateQueueItem = (id, patch) => setScanQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item));

  const addQueueItem = (item) => {
    if (!item.category || !item.amount) return;
    logExpense(item.category, item.amount, item.note, item.date);
    setScanQueue(q => q.filter(i => i.id !== item.id));
  };

  // "Skip" only drops this one row from the queue — a duplicate in a list of five
  // shouldn't throw away the other four.
  const skipQueueItem = (id) => setScanQueue(q => q.filter(i => i.id !== id));

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

  const updateTransactionDate = (txId, date) => {
    update(h => ({ ...h, transactions: h.transactions.map(t => t.id === txId ? { ...t, date } : t) }));
  };

  const expenseTx = household.transactions.filter(t => t.type === "expense" && t.month === selectedMonth);
  const expenseCategoriesLogged = [...new Set(expenseTx.map(t => t.category))].sort();
  const filteredExpenseTx = categoryFilter ? expenseTx.filter(t => t.category === categoryFilter) : expenseTx;
  const showInitials = household.preferences?.showPartnerInitials && household.partners?.length > 0;

  const visibleExpense = visibleCategories(household, "expense", selectedMonth);

  const monthExpenseData = visibleExpense
    .map(c => ({ name: c, icon: household.categoryIcons?.expense?.[c], value: (household.actual.expense[c] || zeros())[selectedMonth] }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const monthExpenseMax = Math.max(1, ...monthExpenseData.map(d => d.value));
  const monthExpenseTotal = monthExpenseData.reduce((a, d) => a + d.value, 0);

  const expenseBreakdown = household.categories.expense
    .map(c => ({ name: c, icon: household.categoryIcons?.expense?.[c], value: (household.actual.expense[c] || zeros()).slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const expenseYtd = expenseBreakdown.reduce((a, d) => a + d.value, 0);

  const chartData = chartMode === "ytd" ? expenseBreakdown : monthExpenseData;
  const chartMax = chartMode === "ytd" ? Math.max(1, ...expenseBreakdown.map(d => d.value)) : monthExpenseMax;
  const chartTotal = chartMode === "ytd" ? expenseYtd : monthExpenseTotal;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Expenses</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 24px", fontSize: 14 }}>Log purchases as they happen — {MONTHS[selectedMonth]}'s breakdown below.</p>

      {(monthExpenseData.length > 0 || expenseBreakdown.length > 0) && (
        <Card style={{ marginBottom: 20, maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
            <h3 style={{ ...fontDisplay, fontSize: 17, margin: 0, color: COLORS.ink }}>
              {chartMode === "ytd" ? "Year to date" : `${MONTHS[selectedMonth]}'s expenses`}
              <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {fmt(chartTotal, 2)}</span>
            </h3>
            <button
              onClick={() => setChartMode(m => m === "ytd" ? "month" : "ytd")}
              title={chartMode === "ytd" ? "Switch to this month" : "Switch to YTD view"}
              style={{
                ...fontBody, display: "flex", alignItems: "center", gap: 6, background: COLORS.lavender, color: COLORS.primary,
                border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
              }}
            >
              <RefreshCw size={13} />
              {chartMode === "ytd" ? MONTHS[selectedMonth] : "YTD View"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chartData.map((d, i) => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ ...fontBody, fontSize: 12, color: COLORS.ink, display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    {d.icon && <span>{d.icon}</span>}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  </span>
                  <span style={{ ...fontBody, fontSize: 12, flexShrink: 0, paddingLeft: 8 }}>
                    <span style={{ fontWeight: 700, color: COLORS.ink }}>{fmt(d.value, 2)}</span>
                    <span style={{ color: COLORS.inkSoft }}> · {chartTotal > 0 ? Math.round((d.value / chartTotal) * 100) : 0}%</span>
                  </span>
                </div>
                <div style={{ height: 8, width: "100%", background: COLORS.lavender, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.value / chartMax) * 100}%`, background: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 10px", color: COLORS.ink }}>Log an expense</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
          <label style={{
            ...fontBody, display: "inline-flex", alignItems: "center", gap: 6, background: COLORS.lavender, color: COLORS.primary,
            border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700,
            cursor: scanning ? "default" : "pointer", opacity: scanning ? 0.7 : 1,
          }}>
            <Camera size={14} />
            {scanning ? "Reading screenshot…" : "Scan a screenshot"}
            <input
              type="file" accept="image/*" disabled={scanning} style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) scanScreenshot(f); }}
            />
          </label>
          <span style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft }}>
            {scannedDate
              ? `Fills in the amount & note, and will log it as ${formatDate(scannedDate)} — always double-check before adding.`
              : "Fills in the amount & note from a bank-app screenshot — always double-check before adding."}
          </span>
          {scanError && <span style={{ ...fontBody, fontSize: 12, color: COLORS.alert }}>{scanError}</span>}
        </div>
        {scanDebugText && (
          <details style={{ marginBottom: 14 }}>
            <summary style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, cursor: "pointer" }}>What the scanner read (tap to check / share)</summary>
            <pre style={{
              ...fontBody, fontSize: 11, color: COLORS.inkSoft, background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, padding: 10, marginTop: 6, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 220, overflowY: "auto",
            }}>
              {scanDebugText}
            </pre>
          </details>
        )}
        {scanQueue.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            <span style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, fontWeight: 600 }}>
              Found {scanQueue.length} transactions — review each one, then add or skip it:
            </span>
            {scanQueue.map(item => (
              <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 6, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10 }}>
                {item.duplicateOf && (
                  <span style={{ ...fontBody, fontSize: 11, color: COLORS.gold, fontWeight: 700 }}>
                    ⚠ Looks like a duplicate of {fmt(item.duplicateOf.amount, 2)}{item.duplicateOf.note ? ` (${item.duplicateOf.note})` : ""} on {formatDate(item.duplicateOf.date)} — check before adding.
                  </span>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <select value={item.category} onChange={e => updateQueueItem(item.id, { category: e.target.value })} style={{ ...fontBody, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, minWidth: 160 }}>
                    <option value="">Select category…</option>
                    {visibleExpense.map(c => (
                      <option key={c} value={c}>{household.categoryIcons?.expense?.[c] ? `${household.categoryIcons.expense[c]} ${c}` : c}</option>
                    ))}
                  </select>
                  <input type="number" onFocus={e => e.target.select()} value={item.amount} onChange={e => updateQueueItem(item.id, { amount: e.target.value })} style={{ ...fontBody, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, width: 100 }} />
                  <input placeholder="Note" value={item.note} onChange={e => updateQueueItem(item.id, { note: e.target.value })} style={{ ...fontBody, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, flex: 1, minWidth: 120 }} />
                  {item.date && <span style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, whiteSpace: "nowrap" }}>{formatDate(item.date)}</span>}
                  <button
                    onClick={() => addQueueItem(item)} disabled={!item.category || !item.amount}
                    style={{
                      ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px",
                      fontWeight: 700, cursor: item.category && item.amount ? "pointer" : "default", opacity: item.category && item.amount ? 1 : 0.5, whiteSpace: "nowrap",
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => skipQueueItem(item.id)}
                    style={{ ...fontBody, background: "none", color: COLORS.inkSoft, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "7px 12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {duplicateTx && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap",
            fontSize: 12, color: COLORS.gold, fontWeight: 600, background: "#FFF8EA", border: `1px solid ${COLORS.gold}`,
            borderRadius: 8, padding: "8px 12px", margin: "0 0 10px", ...fontBody,
          }}>
            <span>
              ⚠ You already logged {fmt(duplicateTx.amount, 2)}{duplicateTx.category ? ` for ${duplicateTx.category}` : ""}{duplicateTx.note ? ` (${duplicateTx.note})` : ""} on {formatDate(duplicateTx.date)} — make sure this isn't the same purchase.
            </span>
            <button
              onClick={() => { setAmount(""); setNote(""); setCategory(""); setScannedDate(""); setDuplicateTx(null); }}
              style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: "#fff", background: COLORS.alert, border: "none", borderRadius: 6, padding: "5px 10px", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
            >
              Discard this scan
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: household.partners?.length > 0 ? 10 : 0 }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, minWidth: 180 }}>
            <option value="">Select category…</option>
            {visibleExpense.map(c => (
              <option key={c} value={c}>{household.categoryIcons?.expense?.[c] ? `${household.categoryIcons.expense[c]} ${c}` : c}</option>
            ))}
          </select>
          <input type="number" onFocus={e => e.target.select()} onKeyDown={e => e.key === "Enter" && addTransaction()} placeholder={`Amount (${CURRENCY_SYMBOL})`} value={amount} onChange={e => setAmount(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, width: 130 }} />
          <input placeholder="Note (optional)" onKeyDown={e => e.key === "Enter" && addTransaction()} value={note} onChange={e => setNote(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, flex: 1, minWidth: 160 }} />
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <h3 style={{ ...fontDisplay, fontSize: 16, margin: 0, color: COLORS.ink }}>{MONTHS[selectedMonth]} expenses</h3>
          {expenseCategoriesLogged.length > 1 && (
            <select
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              style={{ ...fontBody, padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 12, color: COLORS.inkSoft }}
            >
              <option value="">All categories</option>
              {expenseCategoriesLogged.map(c => (
                <option key={c} value={c}>{household.categoryIcons?.expense?.[c] ? `${household.categoryIcons.expense[c]} ${c}` : c}</option>
              ))}
            </select>
          )}
        </div>
        {expenseTx.length === 0 ? (
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft }}>Nothing logged for {MONTHS[selectedMonth]} yet.</p>
        ) : filteredExpenseTx.length === 0 ? (
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft }}>Nothing logged for {categoryFilter} in {MONTHS[selectedMonth]}.</p>
        ) : (
          <div>
            {filteredExpenseTx.map(tx => (
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
                    <div>
                      <input
                        type="date" value={tx.date || ""} onChange={e => updateTransactionDate(tx.id, e.target.value)}
                        style={{
                          ...fontBody, fontSize: 11, color: COLORS.inkSoft, background: "none", border: "none", padding: 0,
                          outline: "none", cursor: "pointer", marginTop: 2,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, color: COLORS.ink }}>-{fmt(tx.amount, 2)}</span>
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

      <ChangeCategoriesPanel type="expense" suggestions={SUGGESTED.expense} household={household} update={update} selectedMonth={selectedMonth} />
    </div>
  );
}

/* ============================================================
   RESERVES VIEW  (the signature feature)
   ============================================================ */
function SettleReserveFlow({ savedYtd, onCancel, onSettle }) {
  const [paidAmount, setPaidAmount] = useState(String(savedYtd));
  const [step, setStep] = useState("amount"); // "amount" | "leftover" | "followup"
  const [leftoverAction, setLeftoverAction] = useState(null); // "free" | "carry"

  const paid = Number(paidAmount) || 0;
  const diff = Math.round((paid - savedYtd) * 100) / 100;

  const confirmAmount = () => setStep(diff < 0 ? "leftover" : "followup");
  const chooseLeftover = (action) => { setLeftoverAction(action); setStep("followup"); };
  const finish = (postAction) => onSettle({ paidAmount: paid, leftoverAction, postAction });

  const stepButton = (onClick, label, filled) => (
    <button
      onClick={onClick}
      style={{
        ...fontBody, flex: "1 1 130px", borderRadius: 8, padding: "8px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer",
        background: filled ? COLORS.primary : "#fff", color: filled ? "#fff" : COLORS.primary, border: `1.5px solid ${COLORS.primary}`,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ background: COLORS.lavender, borderRadius: 10, padding: 14, marginTop: 4 }}>
      {step === "amount" && (
        <>
          <p style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.ink, margin: "0 0 6px" }}>
            You'd saved {fmt(savedYtd, 2)} for this. What was actually paid?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="number" autoFocus onFocus={e => e.target.select()}
              value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
              style={{ ...fontBody, flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.primary}`, fontSize: 14, outline: "none" }}
            />
            {stepButton(confirmAmount, "Continue", true)}
            <button onClick={onCancel} style={{ ...fontBody, background: "none", border: "none", color: COLORS.inkSoft, cursor: "pointer", fontSize: 12 }}>
              Cancel
            </button>
          </div>
          {diff > 0 && (
            <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: "6px 0 0" }}>
              That's {fmt(diff, 2)} more than you'd saved — we'll add it to this month.
            </p>
          )}
        </>
      )}

      {step === "leftover" && (
        <>
          <p style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.ink, margin: "0 0 8px" }}>
            You have {fmt(-diff, 2)} left over. What do you want to do with it?
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {stepButton(() => chooseLeftover("free"), "Free it up to spend", true)}
            {stepButton(() => chooseLeftover("carry"), "Keep saving it forward", false)}
          </div>
        </>
      )}

      {step === "followup" && (
        <>
          <p style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.ink, margin: "0 0 8px" }}>
            Settled. What should happen to this goal now?
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {stepButton(() => finish("keep"), "Keep it closed", true)}
            {stepButton(() => finish("archive"), "Archive it", false)}
            {stepButton(() => finish("reopen"), "Start saving again", false)}
          </div>
        </>
      )}
    </div>
  );
}

function ReserveGoalCard({ cat, icon, savedYtd, arr, goal, releasedIdx, monthly, selectedMonth, linkedDebt, onGoalChange, onLinkedModeChange, onRelease, onSettle, onDelete, onRename }) {
  const isReleased = releasedIdx !== null && releasedIdx !== undefined;
  const [settling, setSettling] = useState(false);
  const target = Number(goal?.targetAmount) || 0;
  const remainingMonths = monthsRemainingInclusive(goal?.targetDate, selectedMonth);
  // Base the suggestion on what was saved BEFORE this month, so this month's own
  // entry doesn't get counted twice (once as "saved", once as still "remaining").
  const savedBeforeThisMonth = savedYtd - monthly;
  const stillNeeded = Math.max(0, target - savedBeforeThisMonth);
  // Linked to a debt: the suggestion is based on the *full* amount due next (principal +
  // interest + any known fee, not just the principal). Two modes: "add" keeps a fixed
  // slice every month (extra one month doesn't lower future suggestions — it just pays
  // down the debt early); "net" instead recalculates from what's still needed for the
  // current cycle, same as a regular goal, so an extra month lowers what's suggested next.
  const linkedPayment = linkedDebt ? nextDebtPaymentTotal(linkedDebt) : null;
  const linkedFreq = linkedPayment?.freq || null;
  const linkedMode = linkedDebt?.reserveSurplusMode || "add";
  let linkedCycle = null;
  let linkedStillNeeded = null;
  if (linkedDebt && linkedMode === "net") {
    linkedCycle = debtCycleInfo(linkedDebt, selectedMonth);
    const savedThisCycleBeforeThisMonth = (arr || [])
      .slice(linkedCycle.cycleStartMonth, selectedMonth)
      .reduce((a, b) => a + b, 0);
    linkedStillNeeded = Math.max(0, linkedPayment.total - savedThisCycleBeforeThisMonth);
  }
  const suggested = linkedDebt
    ? (linkedMode === "net" ? linkedStillNeeded / linkedCycle.remainingMonths : linkedPayment.total / linkedPayment.monthsPerPeriod)
    : (target > 0 && remainingMonths !== null ? stillNeeded / remainingMonths : null);
  const pct = target > 0 ? Math.min(100, (savedYtd / target) * 100) : 0;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(cat);

  const saveName = () => {
    onRename(nameDraft);
    setEditingName(false);
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h4 style={{ ...fontDisplay, fontSize: 18, margin: 0, color: COLORS.ink, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <GripVertical size={16} color={COLORS.inkSoft} style={{ cursor: "grab", flexShrink: 0 }} />
          {editingName ? (
            <>
              <input
                autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                style={{ ...fontDisplay, fontSize: 16, padding: "3px 8px", borderRadius: 6, border: `1.5px solid ${COLORS.primary}`, outline: "none", width: 160, boxSizing: "border-box" }}
              />
              <button onClick={saveName} title="Save" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.success, display: "flex", flexShrink: 0 }}>
                <Check size={16} />
              </button>
              <button onClick={() => setEditingName(false)} title="Cancel" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex", flexShrink: 0 }}>
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              {icon && <span>{icon} </span>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</span>
              <button
                onClick={() => { setNameDraft(cat); setEditingName(true); }}
                title="Rename this reserve"
                style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex", flexShrink: 0 }}
              >
                <Pencil size={13} />
              </button>
            </>
          )}
        </h4>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isReleased && <span style={{ ...fontBody, fontSize: 11, background: COLORS.lavender, color: COLORS.primary, padding: "3px 8px", borderRadius: 12, fontWeight: 700 }}>Paid</span>}
          {confirmingDelete ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft }}>Delete & free up {fmt(savedYtd, 2)}?</span>
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

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {linkedDebt ? (
          <div style={{ background: COLORS.lavender, borderRadius: 10, padding: "10px 12px" }}>
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.primary, fontWeight: 700, margin: "0 0 2px" }}>
              Linked to debt: {linkedDebt.icon ? `${linkedDebt.icon} ` : ""}{linkedDebt.name}
            </p>
            <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: "0 0 8px" }}>
              Saving toward {fmt(linkedPayment.total, 2)} due every {linkedFreq.label.toLowerCase()}
            </p>
            <p style={{ ...fontBody, fontSize: 11, fontWeight: 700, color: COLORS.inkSoft, margin: "0 0 4px" }}>
              If you save extra one month
            </p>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Chip active={linkedMode === "add"} onClick={() => onLinkedModeChange(linkedDebt.id, "add")}>
                Pay the debt down early
              </Chip>
              <Chip active={linkedMode === "net"} onClick={() => onLinkedModeChange(linkedDebt.id, "net")}>
                Save less next time
              </Chip>
            </div>
          </div>
        ) : (
        /* goal setup, collapsed by default */
        <div>
          <button
            onClick={() => setGoalOpen(o => !o)}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "space-between", padding: 0, marginBottom: 4,
            }}
          >
            <span style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft }}>
              {target > 0 ? `Goal: ${fmt(target, 2)}${goal?.targetDate ? ` · due ${formatDate(goal.targetDate)}` : ""}` : "No goal set"}
            </span>
            <ChevronLeft size={16} color={COLORS.inkSoft} style={{ transform: goalOpen ? "rotate(90deg)" : "rotate(-90deg)", flexShrink: 0 }} />
          </button>
          {goalOpen && (
            <>
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
            </>
          )}
        </div>
        )}

        {/* progress + this month's input */}
        <div>
          <div style={{ height: 14, width: "100%", background: COLORS.lavender, borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS.gold}, ${COLORS.primary})`, transition: "width .4s" }} />
          </div>
          <p style={{ ...fontBody, fontSize: 13, color: COLORS.ink, margin: "0 0 12px" }}>
            <strong>{fmt(savedYtd, 2)}</strong> saved so far {target > 0 && <span style={{ color: COLORS.inkSoft }}>of {fmt(target, 2)} goal</span>}
          </p>

          {linkedDebt ? (
            <div style={{ background: COLORS.lavender, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <p style={{ ...fontBody, fontSize: 12, color: COLORS.primary, fontWeight: 700, margin: "0 0 2px" }}>
                Suggested this month: {fmt(suggested, 2)}
              </p>
              <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: 0 }}>
                {linkedMode === "net"
                  ? `${fmt(linkedStillNeeded, 2)} still needed ÷ ${linkedCycle.remainingMonths} month${linkedCycle.remainingMonths === 1 ? "" : "s"} left in this cycle`
                  : `Fixed amount: ${fmt(linkedPayment.total, 2)} ÷ ${linkedPayment.monthsPerPeriod} month${linkedPayment.monthsPerPeriod === 1 ? "" : "s"} per ${linkedFreq.label.toLowerCase()} payment`}
              </p>
            </div>
          ) : target > 0 && goal?.targetDate ? (
            <div style={{ background: COLORS.lavender, borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <p style={{ ...fontBody, fontSize: 12, color: COLORS.primary, fontWeight: 700, margin: "0 0 2px" }}>
                Suggested this month: {fmt(suggested, 2)}
              </p>
              <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: 0 }}>
                {fmt(stillNeeded, 2)} still needed ÷ {remainingMonths || 1} month{remainingMonths === 1 ? "" : "s"} remaining
              </p>
            </div>
          ) : (
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, marginBottom: 12 }}>
              No goal set — that's fine, this can just be an open-ended pot. Add a goal amount and date on the left anytime if you want a suggested monthly amount.
            </p>
          )}

          <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: "0 0 12px" }}>
            {fmt(monthly, 2)} set aside in {MONTHS[selectedMonth]} — log contributions above.
          </p>

          {isReleased ? (
            <button
              onClick={onRelease}
              style={{
                ...fontBody, width: "100%", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${COLORS.primary}`, background: "#fff", color: COLORS.primary,
              }}
            >
              Mark as not yet paid
            </button>
          ) : settling ? (
            <SettleReserveFlow
              savedYtd={savedYtd}
              onCancel={() => setSettling(false)}
              onSettle={(payload) => { onSettle(payload); setSettling(false); }}
            />
          ) : (
            <button
              onClick={() => setSettling(true)}
              style={{
                ...fontBody, width: "100%", padding: "8px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                border: `1.5px solid ${COLORS.primary}`, background: COLORS.primary, color: "#fff",
              }}
            >
              Mark as paid — settle this reserve
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

function ReservesView({ household, update, selectedMonth, setSelectedMonth }) {
  const [draggedCat, setDraggedCat] = useState(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loggedBy, setLoggedBy] = useState(household.partners?.[0] || "");
  const [chartMode, setChartMode] = useState("month"); // "month" | "ytd"

  const reorderReserve = (fromCat, toCat) => {
    if (fromCat === toCat) return;
    update(h => {
      const arr = [...h.categories.reserve];
      const fromIdx = arr.indexOf(fromCat);
      const toIdx = arr.indexOf(toCat);
      if (fromIdx === -1 || toIdx === -1) return h;
      arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, fromCat);
      return { ...h, categories: { ...h.categories, reserve: arr } };
    });
  };
  const addTransaction = () => {
    if (!category || !amount) return;
    update(h => {
      const arr = [...(h.actual.reserve[category] || zeros())];
      arr[selectedMonth] += Number(amount);
      const tx = {
        id: Date.now(), month: selectedMonth, type: "reserve", category, amount: Number(amount), note, loggedBy: loggedBy || null,
        date: new Date().toISOString().slice(0, 10),
      };
      return {
        ...h,
        actual: { ...h.actual, reserve: { ...h.actual.reserve, [category]: arr } },
        transactions: [tx, ...h.transactions],
      };
    });
    setAmount(""); setNote("");
  };
  const deleteTransaction = (tx) => {
    update(h => {
      const arr = [...(h.actual.reserve[tx.category] || zeros())];
      arr[tx.month] = Math.max(0, arr[tx.month] - tx.amount);
      return {
        ...h,
        actual: { ...h.actual, reserve: { ...h.actual.reserve, [tx.category]: arr } },
        transactions: h.transactions.filter(t => t.id !== tx.id),
      };
    });
  };
  const updateTransactionDate = (txId, date) => {
    update(h => ({ ...h, transactions: h.transactions.map(t => t.id === txId ? { ...t, date } : t) }));
  };
  const setGoal = (cat, goal) => {
    update(h => ({ ...h, reserveGoals: { ...h.reserveGoals, [cat]: goal } }));
  };
  const setLinkedDebtMode = (debtId, mode) => {
    update(h => ({ ...h, debts: (h.debts || []).map(d => d.id === debtId ? { ...d, reserveSurplusMode: mode } : d) }));
  };
  const renameReserve = (oldName, newName) => {
    update(h => renameCategory(h, "reserve", oldName, newName));
  };
  const toggleRelease = (cat) => {
    update(h => ({
      ...h,
      releasedThrough: { ...h.releasedThrough, [cat]: h.releasedThrough[cat] == null ? selectedMonth : null },
      releasedAmount: { ...h.releasedAmount, [cat]: null },
    }));
  };
  const settleReserve = (cat, { paidAmount, leftoverAction, postAction }) => {
    update(h => {
      const arr = [...(h.actual.reserve[cat] || zeros())];
      const savedThroughSelected = arr.slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0);
      const drawnFromSavings = Math.min(paidAmount, savedThroughSelected);
      const shortfall = Math.max(0, paidAmount - savedThroughSelected);

      // Turn whatever's actually being paid into real expense entries, dated to the months
      // the money was originally saved in (oldest first) — so it leaves the bank balance for
      // real, and shows up as a log in the Expenses tab, instead of a hidden correction.
      let remaining = drawnFromSavings;
      const payouts = []; // [{ monthIdx, amount }]
      for (let i = 0; i <= selectedMonth && remaining > 0; i++) {
        const monthAmt = arr[i] || 0;
        if (monthAmt <= 0) continue;
        const take = Math.min(monthAmt, remaining);
        payouts.push({ monthIdx: i, amount: take });
        arr[i] = monthAmt - take;
        remaining -= take;
      }
      if (shortfall > 0) {
        payouts.push({ monthIdx: selectedMonth, amount: shortfall });
      }
      // Anything still left in `arr` is the leftover that wasn't paid out — free it up if
      // asked, otherwise it stays put as a head start on the next round.
      if (leftoverAction === "free") {
        for (let i = 0; i <= selectedMonth; i++) arr[i] = 0;
      }

      let expenseCategories = h.categories.expense;
      let expenseBudget = h.budget.expense;
      let expenseIcons = h.categoryIcons.expense;
      if (!expenseCategories.includes(cat)) {
        expenseCategories = [...expenseCategories, cat];
        expenseBudget = { ...expenseBudget, [cat]: zeros() };
        expenseIcons = { ...expenseIcons, [cat]: h.categoryIcons?.reserve?.[cat] || null };
      }
      const expenseArr = [...(h.actual.expense[cat] || zeros())];
      const newTransactions = [];
      payouts.forEach(({ monthIdx, amount }) => {
        expenseArr[monthIdx] = (expenseArr[monthIdx] || 0) + amount;
        newTransactions.unshift({
          id: `${Date.now()}-${cat}-${monthIdx}`,
          month: monthIdx,
          type: "expense",
          category: cat,
          amount,
          note: "Paid out from reserve",
          loggedBy: null,
        });
      });

      const reopening = postAction === "reopen";
      const archivedReserves = postAction === "archive"
        ? [...new Set([...(h.archivedReserves || []), cat])]
        : (h.archivedReserves || []).filter(c => c !== cat);

      // If this reserve is saving up for a debt payment, settling it means the real-world
      // payment just happened — knock it off the debt and advance the schedule.
      const debts = reopening ? h.debts : payDownLinkedDebt(h, "reserve", cat, paidAmount, selectedMonth);

      return {
        ...h,
        actual: {
          ...h.actual,
          reserve: { ...h.actual.reserve, [cat]: arr },
          expense: { ...h.actual.expense, [cat]: expenseArr },
        },
        categories: { ...h.categories, expense: expenseCategories },
        budget: { ...h.budget, expense: expenseBudget },
        categoryIcons: { ...h.categoryIcons, expense: expenseIcons },
        transactions: [...newTransactions, ...h.transactions],
        releasedThrough: { ...h.releasedThrough, [cat]: reopening ? null : selectedMonth },
        // The paid amount is now real expense transactions, so there's nothing left for the
        // accrual fallback in computeKpis to add on top of — keep it at 0/null either way.
        releasedAmount: { ...h.releasedAmount, [cat]: reopening ? null : 0 },
        archivedReserves,
        reserveGoals: reopening
          ? { ...h.reserveGoals, [cat]: { targetAmount: 0, targetDate: "" } }
          : h.reserveGoals,
        debts,
      };
    });
  };
  const restoreReserve = (cat) => {
    update(h => ({ ...h, archivedReserves: (h.archivedReserves || []).filter(c => c !== cat) }));
  };
  const deleteReserve = (cat) => {
    update(h => {
      const categories = { ...h.categories, reserve: h.categories.reserve.filter(c => c !== cat) };
      const budget = { ...h.budget.reserve }; delete budget[cat];
      const actual = { ...h.actual.reserve }; delete actual[cat];
      const icons = { ...h.categoryIcons.reserve }; delete icons[cat];
      const released = { ...h.releasedThrough }; delete released[cat];
      const releasedAmt = { ...h.releasedAmount }; delete releasedAmt[cat];
      const goals = { ...h.reserveGoals }; delete goals[cat];
      return {
        ...h,
        categories,
        budget: { ...h.budget, reserve: budget },
        actual: { ...h.actual, reserve: actual },
        categoryIcons: { ...h.categoryIcons, reserve: icons },
        releasedThrough: released,
        releasedAmount: releasedAmt,
        archivedReserves: (h.archivedReserves || []).filter(c => c !== cat),
        reserveGoals: goals,
        // Nothing else needs to change: since this category no longer exists,
        // it drops out of the "reserved" total automatically — any money
        // still sitting in this pot becomes free to spend right away.
      };
    });
  };

  const visibleReserve = visibleCategories(household, "reserve", selectedMonth)
    .filter(cat => !(household.archivedReserves || []).includes(cat));

  const reserveTx = household.transactions.filter(t => t.type === "reserve" && t.month === selectedMonth);
  const showInitials = household.preferences?.showPartnerInitials && household.partners?.length > 0;

  const monthReserveData = visibleReserve
    .map(c => ({ name: c, icon: household.categoryIcons?.reserve?.[c], value: (household.actual.reserve[c] || zeros())[selectedMonth] }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const monthReserveMax = Math.max(1, ...monthReserveData.map(d => d.value));
  const monthReserveTotal = monthReserveData.reduce((a, d) => a + d.value, 0);

  const reserveBreakdown = household.categories.reserve
    .map(c => ({ name: c, icon: household.categoryIcons?.reserve?.[c], value: (household.actual.reserve[c] || zeros()).slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const reserveYtd = reserveBreakdown.reduce((a, d) => a + d.value, 0);

  const chartData = chartMode === "ytd" ? reserveBreakdown : monthReserveData;
  const chartMax = chartMode === "ytd" ? Math.max(1, ...reserveBreakdown.map(d => d.value)) : monthReserveMax;
  const chartTotal = chartMode === "ytd" ? reserveYtd : monthReserveTotal;

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Reserves</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 8px", fontSize: 14, maxWidth: 680 }}>
        Set the total you want to save this year and when it's due — the app splits the rest across your remaining
        months. Save more one month and next month's suggestion drops automatically; save less and it rises. Change
        the goal any time, even mid-year — the months-remaining count just adjusts.
      </p>

      {(monthReserveData.length > 0 || reserveBreakdown.length > 0) && (
        <Card style={{ marginTop: 16, marginBottom: 20, maxWidth: 480 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
            <h3 style={{ ...fontDisplay, fontSize: 17, margin: 0, color: COLORS.ink }}>
              {chartMode === "ytd" ? "Year to date" : `${MONTHS[selectedMonth]}'s reserves`}
              <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {fmt(chartTotal, 2)}</span>
            </h3>
            <button
              onClick={() => setChartMode(m => m === "ytd" ? "month" : "ytd")}
              title={chartMode === "ytd" ? "Switch to this month" : "Switch to YTD view"}
              style={{
                ...fontBody, display: "flex", alignItems: "center", gap: 6, background: COLORS.lavender, color: COLORS.primary,
                border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap",
              }}
            >
              <RefreshCw size={13} />
              {chartMode === "ytd" ? MONTHS[selectedMonth] : "YTD View"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {chartData.map((d, i) => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ ...fontBody, fontSize: 12, color: COLORS.ink, display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    {d.icon && <span>{d.icon}</span>}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  </span>
                  <span style={{ ...fontBody, fontSize: 12, flexShrink: 0, paddingLeft: 8 }}>
                    <span style={{ fontWeight: 700, color: COLORS.ink }}>{fmt(d.value, 2)}</span>
                    <span style={{ color: COLORS.inkSoft }}> · {chartTotal > 0 ? Math.round((d.value / chartTotal) * 100) : 0}%</span>
                  </span>
                </div>
                <div style={{ height: 8, width: "100%", background: COLORS.lavender, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.value / chartMax) * 100}%`, background: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 14px", color: COLORS.ink }}>Log a contribution</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: household.partners?.length > 0 ? 10 : 0 }}>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, minWidth: 180 }}>
            <option value="">Select reserve…</option>
            {visibleReserve.map(c => (
              <option key={c} value={c}>{household.categoryIcons?.reserve?.[c] ? `${household.categoryIcons.reserve[c]} ${c}` : c}</option>
            ))}
          </select>
          <input type="number" onFocus={e => e.target.select()} onKeyDown={e => e.key === "Enter" && addTransaction()} placeholder={`Amount (${CURRENCY_SYMBOL})`} value={amount} onChange={e => setAmount(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, width: 130 }} />
          <input placeholder="Note (optional)" onKeyDown={e => e.key === "Enter" && addTransaction()} value={note} onChange={e => setNote(e.target.value)} style={{ ...fontBody, padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, flex: 1, minWidth: 160 }} />
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

      {reserveTx.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h3 style={{ ...fontDisplay, fontSize: 16, margin: "0 0 12px", color: COLORS.ink }}>{MONTHS[selectedMonth]} contributions</h3>
          <div>
            {reserveTx.slice(0, 15).map(tx => (
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
                    {household.categoryIcons?.reserve?.[tx.category] && <span style={{ marginRight: 4 }}>{household.categoryIcons.reserve[tx.category]}</span>}
                    <span style={{ fontWeight: 600 }}>{tx.category}</span>
                    {tx.note && <span style={{ color: COLORS.inkSoft }}> · {tx.note}</span>}
                    <div>
                      <input
                        type="date" value={tx.date || ""} onChange={e => updateTransactionDate(tx.id, e.target.value)}
                        style={{
                          ...fontBody, fontSize: 11, color: COLORS.inkSoft, background: "none", border: "none", padding: 0,
                          outline: "none", cursor: "pointer", marginTop: 2,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontWeight: 700, color: COLORS.primary }}>+{fmt(tx.amount, 2)}</span>
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
        </Card>
      )}

      {visibleReserve.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40, marginTop: 20 }}>
          <p style={{ ...fontBody, color: COLORS.inkSoft }}>No reserve goals yet — add one below.</p>
        </Card>
      ) : (
        <div style={{ marginTop: 20 }}>
          <div className="two-col-grid">
            {visibleReserve
              .map(cat => {
                const arr = household.actual.reserve[cat] || zeros();
                const savedYtd = arr.slice(0, selectedMonth + 1).reduce((a, b) => a + b, 0);
                return (
                  <div
                    key={cat}
                    draggable
                    onDragStart={() => setDraggedCat(cat)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (draggedCat) reorderReserve(draggedCat, cat); setDraggedCat(null); }}
                    onDragEnd={() => setDraggedCat(null)}
                    style={{ opacity: draggedCat === cat ? 0.5 : 1 }}
                  >
                    <ReserveGoalCard
                      cat={cat}
                      icon={household.categoryIcons?.reserve?.[cat]}
                      savedYtd={savedYtd}
                      arr={arr}
                      goal={household.reserveGoals?.[cat] || { targetAmount: 0, targetDate: "" }}
                      releasedIdx={household.releasedThrough[cat]}
                      monthly={arr[selectedMonth]}
                      selectedMonth={selectedMonth}
                      linkedDebt={(household.debts || []).find(d => d.linkedCategory?.type === "reserve" && d.linkedCategory?.name === cat) || null}
                      onGoalChange={(g) => setGoal(cat, g)}
                      onLinkedModeChange={(debtId, mode) => setLinkedDebtMode(debtId, mode)}
                      onRelease={() => toggleRelease(cat)}
                      onSettle={(payload) => settleReserve(cat, payload)}
                      onDelete={() => deleteReserve(cat)}
                      onRename={(newName) => renameReserve(cat, newName)}
                    />
                  </div>
                );
              })}
          </div>

          {(household.archivedReserves || []).length > 0 && (
            <Card style={{ marginTop: 8 }}>
              <h4 style={{ ...fontDisplay, fontSize: 15, margin: "0 0 10px", color: COLORS.inkSoft }}>Archived</h4>
              {household.archivedReserves.map(cat => (
                <div key={cat} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: `1px solid ${COLORS.border}` }}>
                  <span style={{ ...fontBody, fontSize: 13, color: COLORS.ink }}>
                    {household.categoryIcons?.reserve?.[cat] && <span>{household.categoryIcons.reserve[cat]} </span>}{cat}
                  </span>
                  <button
                    onClick={() => restoreReserve(cat)}
                    style={{ ...fontBody, background: "none", border: "none", color: COLORS.primary, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                  >
                    Restore
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      <ChangeCategoriesPanel type="reserve" suggestions={SUGGESTED.reserve} household={household} update={update} selectedMonth={selectedMonth} />
    </div>
  );
}

/* ============================================================
   DEBT VIEW
   ============================================================ */
// Builds a payoff schedule: each period, interest accrues on the remaining balance
// (annual rate ÷ payments per year) — interest is always computed, never something you
// set directly. If paymentIncludesInterest, the regular payment is fixed and interest
// comes out of it first (standard amortization) to get the principal; otherwise the
// regular payment IS the principal and interest is extra, added on top for display.
// `principalOverrides` lets specific payment numbers pay down a different amount of
// principal that period, without changing the regular payment going forward. Capped at
// 600 periods (50 years) so a too-small payment can't loop forever.
function buildDebtSchedule(currentAmount, interestRate, paymentFrequency, paymentAmount, paymentIncludesInterest, principalOverrides = {}, feeOverrides = {}) {
  const freq = DEBT_FREQUENCIES.find(f => f.key === paymentFrequency) || DEBT_FREQUENCIES[0];
  const periodRate = (Number(interestRate) || 0) / 100 / freq.perYear;
  let balance = Number(currentAmount) || 0;
  const basePayment = Number(paymentAmount) || 0;
  const rows = [];
  if (balance <= 0 || basePayment <= 0) return { rows, willNeverPayOff: false, freq };

  const firstInterest = balance * periodRate;
  const noOverrideAtStart = principalOverrides[1] == null;
  const willNeverPayOff = paymentIncludesInterest && basePayment <= firstInterest && periodRate > 0 && noOverrideAtStart;
  if (willNeverPayOff) return { rows, willNeverPayOff, freq };

  for (let period = 1; period <= 600 && balance > 0; period++) {
    const interest = balance * periodRate;
    const override = principalOverrides[period];
    let principal;
    if (override != null) {
      principal = Math.min(Math.max(0, Number(override)), balance);
    } else if (paymentIncludesInterest) {
      principal = Math.min(Math.max(0, basePayment - interest), balance);
    } else {
      principal = Math.min(basePayment, balance);
    }
    balance = Math.max(0, balance - principal);
    const fee = Number(feeOverrides[period]) || 0;
    rows.push({ period, payment: principal + interest + fee, interest, principal, fee, overridden: override != null, balance });
  }
  return { rows, willNeverPayOff: false, freq };
}

// The gross amount actually due for the next unpaid period — as opposed to
// `debt.paymentAmount`, which (in "exclusive of interest" mode) is only the principal
// slice. A reserve saving up for this debt needs to cover the whole thing, interest
// (and any known fee) included, not just the principal part.
function nextDebtPaymentTotal(debt) {
  const freq = DEBT_FREQUENCIES.find(f => f.key === debt.paymentFrequency) || DEBT_FREQUENCIES[0];
  const periodRate = (Number(debt.interestRate) || 0) / 100 / freq.perYear;
  const interest = (Number(debt.currentAmount) || 0) * periodRate;
  const basePayment = Number(debt.paymentAmount) || 0;
  const fee = Number((debt.feeOverrides || {})[1]) || 0;
  const paymentIncludesInterest = debt.paymentIncludesInterest ?? true;
  const total = (paymentIncludesInterest ? basePayment : basePayment + interest) + fee;
  return { total, interest, freq, monthsPerPeriod: 12 / freq.perYear };
}

// Where the current savings cycle sits, for "spread it out" mode: the cycle starts the
// month after the debt was last settled (or month 0 if it's never been settled), and
// runs `monthsPerPeriod` months. If selectedMonth has drifted past that (payment's
// overdue), roll forward whole cycles until it's caught up.
function debtCycleInfo(debt, selectedMonth) {
  const { monthsPerPeriod } = nextDebtPaymentTotal(debt);
  let cycleStartMonth = debt.lastSettledMonth != null ? debt.lastSettledMonth + 1 : 0;
  let dueMonth = cycleStartMonth + monthsPerPeriod - 1;
  while (dueMonth < selectedMonth) {
    cycleStartMonth += monthsPerPeriod;
    dueMonth += monthsPerPeriod;
  }
  return { cycleStartMonth, dueMonth, remainingMonths: Math.max(1, dueMonth - selectedMonth + 1) };
}

function addMonthsToDateStr(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

// Applies one real-world payment to whichever debt is linked to this category (if any),
// treating `paidAmount` as covering the next upcoming period. Knocks the principal portion
// off currentAmount, advances paidPeriods (so schedule dates keep counting forward instead
// of resetting to the first-payment date), and shifts any period-specific overrides down by
// one so they stay lined up with the period they were actually meant for.
function payDownLinkedDebt(h, catType, catName, paidAmount, selectedMonth) {
  const debts = h.debts || [];
  const idx = debts.findIndex(d => d.linkedCategory?.type === catType && d.linkedCategory?.name === catName);
  if (idx === -1) return debts;
  const debt = debts[idx];
  const paymentOverrides = debt.paymentOverrides || {};
  const feeOverrides = debt.feeOverrides || {};
  const balance = Number(debt.currentAmount) || 0;
  if (balance <= 0) return debts;

  // A real payment is the full amount that actually left the bank — interest and fee
  // included — regardless of whether "payment amount" is configured as inclusive or
  // exclusive of interest (that toggle only affects how the *planned* schedule is built).
  const { interest: nextInterest } = nextDebtPaymentTotal(debt);
  const nextFee = Number(feeOverrides[1]) || 0;
  const principal = Math.min(Math.max(0, paidAmount - nextInterest - nextFee), balance);

  const shiftDown = (map) => {
    const out = {};
    Object.entries(map).forEach(([k, v]) => {
      const period = Number(k);
      if (period > 1) out[period - 1] = v;
    });
    return out;
  };

  const updated = {
    ...debt,
    currentAmount: Math.max(0, balance - principal),
    paidPeriods: (debt.paidPeriods || 0) + 1,
    paymentOverrides: shiftDown(paymentOverrides),
    feeOverrides: shiftDown(feeOverrides),
    // Marks where the next savings cycle starts, for "spread it out" mode.
    lastSettledMonth: selectedMonth,
  };
  const next = [...debts];
  next[idx] = updated;
  return next;
}

function DebtCard({ debt, household, previewExtra = 0, onChange, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const paymentIncludesInterest = debt.paymentIncludesInterest ?? true;
  const paymentOverrides = debt.paymentOverrides || {};
  const feeOverrides = debt.feeOverrides || {};

  // When linked to a reserve, period 1's principal always follows the reserve — it's
  // never manually editable, and any stale override from before it was linked no longer
  // applies. Each month is checked against that month's own target (see previewExtra in
  // DebtView) — saving more than a given month needs shows up right away as extra
  // principal, it doesn't wait for the whole period's total to be reached.
  const isReserveLinked = debt.linkedCategory?.type === "reserve";
  let scheduleOverrides = paymentOverrides;
  if (isReserveLinked) {
    const rest = { ...paymentOverrides };
    delete rest[1];
    if (previewExtra > 0) {
      const { interest: firstPeriodInterest } = nextDebtPaymentTotal(debt);
      const regularPrincipal = paymentIncludesInterest
        ? Math.max(0, (Number(debt.paymentAmount) || 0) - firstPeriodInterest)
        : Math.max(0, Number(debt.paymentAmount) || 0);
      rest[1] = regularPrincipal + previewExtra;
    }
    scheduleOverrides = rest;
  }
  const isPreview = isReserveLinked && previewExtra > 0;

  const { rows, willNeverPayOff, freq } = buildDebtSchedule(debt.currentAmount, debt.interestRate, debt.paymentFrequency, debt.paymentAmount, paymentIncludesInterest, scheduleOverrides, feeOverrides);
  const monthsPerPeriod = 12 / freq.perYear;

  const setOverride = (period, value) => {
    onChange({ ...debt, paymentOverrides: { ...paymentOverrides, [period]: value } });
  };
  const setFee = (period, value) => {
    onChange({ ...debt, feeOverrides: { ...feeOverrides, [period]: value } });
  };

  const totalInterest = rows.reduce((a, r) => a + r.interest, 0);
  const totalFees = rows.reduce((a, r) => a + r.fee, 0);
  const years = rows.length > 0 ? Math.floor(rows.length / freq.perYear) : 0;
  const remainder = rows.length > 0 ? rows.length % freq.perYear : 0;

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(debt.name);
  const saveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed) onChange({ ...debt, name: trimmed });
    setEditingName(false);
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h4 style={{ ...fontDisplay, fontSize: 18, margin: 0, color: COLORS.ink, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {editingName ? (
            <>
              <input
                autoFocus value={nameDraft} onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                style={{ ...fontDisplay, fontSize: 16, padding: "3px 8px", borderRadius: 6, border: `1.5px solid ${COLORS.primary}`, outline: "none", width: 160, boxSizing: "border-box" }}
              />
              <button onClick={saveName} title="Save" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.success, display: "flex", flexShrink: 0 }}>
                <Check size={16} />
              </button>
              <button onClick={() => setEditingName(false)} title="Cancel" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex", flexShrink: 0 }}>
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              {debt.icon && <span>{debt.icon} </span>}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{debt.name}</span>
              <button
                onClick={() => { setNameDraft(debt.name); setEditingName(true); }}
                title="Rename this debt"
                style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex", flexShrink: 0 }}
              >
                <Pencil size={13} />
              </button>
            </>
          )}
        </h4>
        {confirmingDelete ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft }}>Remove this debt?</span>
            <button onClick={onDelete} style={{ ...fontBody, fontSize: 11, fontWeight: 700, color: "#fff", background: COLORS.alert, border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>Yes, remove</button>
            <button onClick={() => setConfirmingDelete(false)} style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} title="Remove this debt" style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, display: "flex" }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <button
            onClick={() => setDetailsOpen(o => !o)}
            style={{
              width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "space-between", padding: 0, gap: 8,
            }}
          >
            <span style={{ ...fontBody, fontSize: 13, fontWeight: 700, color: COLORS.ink, textAlign: "left" }}>
              {fmt(debt.currentAmount || 0)} owed
              <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {debt.interestRate || 0}%/yr · {fmt(debt.paymentAmount || 0)} {freq.label.toLowerCase()}</span>
            </span>
            {detailsOpen ? <ChevronLeft size={16} color={COLORS.inkSoft} style={{ transform: "rotate(90deg)", flexShrink: 0 }} /> : <ChevronLeft size={16} color={COLORS.inkSoft} style={{ transform: "rotate(-90deg)", flexShrink: 0 }} />}
          </button>

          {detailsOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              <div>
                <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                  Current amount owed
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: 9, ...fontBody, fontSize: 14, color: COLORS.inkSoft }}>{CURRENCY_SYMBOL}</span>
                  <input
                    type="number" onFocus={e => e.target.select()} value={debt.currentAmount || ""}
                    onChange={e => onChange({ ...debt, currentAmount: Number(e.target.value) })}
                    style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 26px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                  First payment date
                </label>
                <input
                  type="date" value={debt.firstPaymentDate || ""}
                  onChange={e => onChange({ ...debt, firstPaymentDate: e.target.value })}
                  style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                    Interest rate (% per year)
                  </label>
                  <input
                    type="number" onFocus={e => e.target.select()} value={debt.interestRate || ""}
                    onChange={e => onChange({ ...debt, interestRate: Number(e.target.value) })}
                    placeholder="e.g. 5.5"
                    style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                    Payment amount
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 12, top: 9, ...fontBody, fontSize: 14, color: COLORS.inkSoft }}>{CURRENCY_SYMBOL}</span>
                    <input
                      type="number" onFocus={e => e.target.select()} value={debt.paymentAmount || ""}
                      onChange={e => onChange({ ...debt, paymentAmount: Number(e.target.value) })}
                      style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px 8px 26px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 14, outline: "none" }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                  This payment amount is
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <Chip active={paymentIncludesInterest} onClick={() => onChange({ ...debt, paymentIncludesInterest: true })}>
                    Inclusive of interest
                  </Chip>
                  <Chip active={!paymentIncludesInterest} onClick={() => onChange({ ...debt, paymentIncludesInterest: false })}>
                    Exclusive — interest is extra
                  </Chip>
                </div>
              </div>

              <div>
                <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                  How often you pay
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DEBT_FREQUENCIES.map(f => (
                    <Chip key={f.key} active={(debt.paymentFrequency || "monthly") === f.key} onClick={() => onChange({ ...debt, paymentFrequency: f.key })}>
                      {f.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft, display: "block", marginBottom: 4 }}>
                  Link to a category (optional)
                </label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: debt.linkedCategory ? 8 : 0 }}>
                  <Chip active={!debt.linkedCategory} onClick={() => onChange({ ...debt, linkedCategory: null })}>None</Chip>
                  <Chip
                    active={debt.linkedCategory?.type === "reserve"}
                    onClick={() => onChange({ ...debt, linkedCategory: { type: "reserve", name: household?.categories?.reserve?.[0] || "" } })}
                  >
                    Reserve — save up first
                  </Chip>
                  <Chip
                    active={debt.linkedCategory?.type === "expense"}
                    onClick={() => onChange({ ...debt, linkedCategory: { type: "expense", name: household?.categories?.expense?.[0] || "" } })}
                  >
                    Expense — pay directly
                  </Chip>
                </div>
                {debt.linkedCategory && (
                  <>
                    <select
                      value={debt.linkedCategory.name}
                      onChange={e => onChange({ ...debt, linkedCategory: { ...debt.linkedCategory, name: e.target.value } })}
                      style={{ ...fontBody, width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none", marginBottom: 6 }}
                    >
                      <option value="">Select category…</option>
                      {((debt.linkedCategory.type === "reserve" ? household?.categories?.reserve : household?.categories?.expense) || []).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: 0 }}>
                      {debt.linkedCategory.type === "reserve"
                        ? `The suggested monthly amount for that reserve becomes a fixed ${fmt(nextDebtPaymentTotal(debt).total / monthsPerPeriod, 2)}/month (covers principal + interest) — settling it pays down ${debt.name} automatically.`
                        : `Logging an expense in "${debt.linkedCategory.name || "…"}" pays down ${debt.name} automatically, as that period's payment.`}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: COLORS.lavender, borderRadius: 10, padding: "10px 12px" }}>
          {willNeverPayOff ? (
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.alert, fontWeight: 700, margin: 0 }}>
              ⚠ This payment doesn't cover the interest — the balance will keep growing. Raise the payment amount.
            </p>
          ) : rows.length === 0 ? (
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: 0 }}>
              Fill in the amount, rate, and payment to see a payoff schedule.
            </p>
          ) : (
            <>
              <p style={{ ...fontBody, fontSize: 12, color: COLORS.primary, fontWeight: 700, margin: "0 0 2px" }}>
                Paid off in {rows.length} {freq.label.toLowerCase()} payments
                {years > 0 && ` (${years}y${remainder > 0 ? ` ${remainder}${freq.key === "monthly" ? "mo" : ""}` : ""})`}
              </p>
              <p style={{ ...fontBody, fontSize: 11, color: COLORS.inkSoft, margin: 0 }}>
                Total interest paid: {fmt(totalInterest)}
                {totalFees > 0 && ` · Total bank fees: ${fmt(totalFees)}`}
              </p>
            </>
          )}
        </div>

        {rows.length > 0 && (
          <div>
            <button
              onClick={() => setScheduleOpen(o => !o)}
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "space-between", padding: 0,
              }}
            >
              <span style={{ ...fontBody, fontSize: 12, fontWeight: 700, color: COLORS.inkSoft }}>Payoff schedule — edit any payment to see the plan change</span>
              {scheduleOpen ? <ChevronLeft size={16} color={COLORS.inkSoft} style={{ transform: "rotate(90deg)", flexShrink: 0 }} /> : <ChevronLeft size={16} color={COLORS.inkSoft} style={{ transform: "rotate(-90deg)", flexShrink: 0 }} />}
            </button>
            {scheduleOpen && (
              <div style={{ marginTop: 8 }}>
                {isReserveLinked && (
                  <p style={{ ...fontBody, fontSize: 11, color: COLORS.primary, margin: "0 0 6px", fontStyle: "italic" }}>
                    {isPreview
                      ? `You've saved ${fmt(previewExtra, 2)} more than a regular month needs — the first row shows that extra paying down principal early. Settle the reserve to lock it in.`
                      : (debt.reserveSurplusMode === "net"
                        ? "The first row's principal isn't editable here — it follows the linked reserve. Extra savings are spread into future months instead of paying this down early (change that on the Reserves page)."
                        : "The first row's principal isn't editable here — it follows the linked reserve, and only changes once a month saves more than its own target.")}
                  </p>
                )}
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", ...fontBody, fontSize: 11 }}>
                  <thead>
                    <tr>
                      {debt.firstPaymentDate && <th style={{ textAlign: "left", padding: "4px 6px", color: COLORS.inkSoft, fontWeight: 600, position: "sticky", top: 0, background: COLORS.card }}>Date</th>}
                      <th style={{ textAlign: "right", padding: "4px 6px", color: COLORS.inkSoft, fontWeight: 600, position: "sticky", top: 0, background: COLORS.card }}>Payment</th>
                      <th style={{ textAlign: "right", padding: "4px 6px", color: COLORS.inkSoft, fontWeight: 600, position: "sticky", top: 0, background: COLORS.card }}>Interest</th>
                      <th style={{ textAlign: "right", padding: "4px 6px", color: COLORS.inkSoft, fontWeight: 600, position: "sticky", top: 0, background: COLORS.card }}>Principal</th>
                      <th style={{ textAlign: "right", padding: "4px 6px", color: COLORS.inkSoft, fontWeight: 600, position: "sticky", top: 0, background: COLORS.card }}>Bank fee</th>
                      <th style={{ textAlign: "right", padding: "4px 6px", color: COLORS.inkSoft, fontWeight: 600, position: "sticky", top: 0, background: COLORS.card }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => {
                      const dateStr = debt.firstPaymentDate ? addMonthsToDateStr(debt.firstPaymentDate, ((debt.paidPeriods || 0) + r.period - 1) * monthsPerPeriod) : null;
                      const readOnlyRow = isReserveLinked;
                      const previewRow = isPreview && r.period === 1;
                      return (
                        <tr
                          key={r.period}
                          style={{
                            borderTop: previewRow ? `1px dashed ${COLORS.gold}` : `1px solid ${COLORS.border}`,
                            background: previewRow ? "#FFF8EA" : (r.overridden ? COLORS.lavender : "transparent"),
                          }}
                        >
                          {debt.firstPaymentDate && <td style={{ padding: "4px 6px", whiteSpace: "nowrap" }}>{formatDate(dateStr)}</td>}
                          <td style={{ padding: "4px 6px", textAlign: "right" }}>{fmt(r.payment)}</td>
                          <td style={{ padding: "4px 6px", textAlign: "right", color: COLORS.alert }}>{fmt(r.interest)}</td>
                          <td style={{ padding: "4px 6px", textAlign: "right" }}>
                            {readOnlyRow ? (
                              <span style={{ ...fontBody, fontSize: 11, fontWeight: 700, color: COLORS.success }} title="Follows the linked reserve — not editable">
                                {fmt(r.principal, 2)}
                              </span>
                            ) : (
                              <input
                                type="number" onFocus={e => e.target.select()}
                                value={Math.round(r.principal * 100) / 100}
                                onChange={e => setOverride(r.period, Number(e.target.value))}
                                style={{
                                  ...fontBody, width: 66, textAlign: "right", padding: "3px 5px", borderRadius: 5, fontSize: 11, outline: "none",
                                  border: `1.5px solid ${r.overridden ? COLORS.primary : COLORS.border}`, background: "#fff", color: COLORS.success,
                                }}
                              />
                            )}
                          </td>
                          <td style={{ padding: "4px 6px", textAlign: "right" }}>
                            <input
                              type="number" onFocus={e => e.target.select()}
                              value={r.fee || ""}
                              placeholder="0"
                              onChange={e => setFee(r.period, Number(e.target.value))}
                              style={{
                                ...fontBody, width: 56, textAlign: "right", padding: "3px 5px", borderRadius: 5, fontSize: 11, outline: "none",
                                border: `1.5px solid ${r.fee > 0 ? COLORS.primary : COLORS.border}`, background: "#fff", color: COLORS.ink,
                              }}
                            />
                          </td>
                          <td style={{ padding: "4px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(r.balance)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function DebtView({ household, update, selectedMonth }) {
  const [val, setVal] = useState("");
  const [icon, setIcon] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const debts = household.debts || [];

  const addDebt = (name, ic) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    update(h => ({
      ...h,
      debts: [...(h.debts || []), {
        id: `${Date.now()}-${trimmed}`, name: trimmed, icon: ic || null,
        currentAmount: 0, interestRate: 0, paymentFrequency: "monthly", paymentAmount: 0, paymentIncludesInterest: true,
        firstPaymentDate: "", paymentOverrides: {}, feeOverrides: {}, linkedCategory: null, paidPeriods: 0,
        reserveSurplusMode: "add", lastSettledMonth: null,
      }],
    }));
  };
  const updateDebt = (id, next) => {
    update(h => ({ ...h, debts: (h.debts || []).map(d => d.id === id ? next : d) }));
  };
  const deleteDebt = (id) => {
    update(h => ({ ...h, debts: (h.debts || []).filter(d => d.id !== id) }));
  };

  const totalDebt = debts.reduce((a, d) => a + (Number(d.currentAmount) || 0), 0);
  const debtBreakdown = debts
    .map(d => ({ name: d.name, icon: d.icon, value: Number(d.currentAmount) || 0 }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const debtMax = Math.max(1, ...debtBreakdown.map(d => d.value));

  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Debt</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 8px", fontSize: 14, maxWidth: 680 }}>
        Track what you owe and see a payoff schedule. Interest rates are entered as an annual rate
        (the usual way loans, mortgages, and credit cards quote them) — pick how often you actually pay below.
      </p>

      {debtBreakdown.length > 0 && (
        <Card style={{ marginTop: 16, marginBottom: 20, maxWidth: 480 }}>
          <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 14px", color: COLORS.ink }}>
            Total debt
            <span style={{ color: COLORS.inkSoft, fontWeight: 400 }}> · {fmt(totalDebt)}</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {debtBreakdown.map((d, i) => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                  <span style={{ ...fontBody, fontSize: 12, color: COLORS.ink, display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
                    {d.icon && <span>{d.icon}</span>}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                  </span>
                  <span style={{ ...fontBody, fontSize: 12, flexShrink: 0, paddingLeft: 8 }}>
                    <span style={{ fontWeight: 700, color: COLORS.ink }}>{fmt(d.value)}</span>
                    <span style={{ color: COLORS.inkSoft }}> · {totalDebt > 0 ? Math.round((d.value / totalDebt) * 100) : 0}%</span>
                  </span>
                </div>
                <div style={{ height: 8, width: "100%", background: COLORS.lavender, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(d.value / debtMax) * 100}%`, background: PALETTE[i % PALETTE.length], borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {debts.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 40, marginTop: 20 }}>
          <p style={{ ...fontBody, color: COLORS.inkSoft }}>No debts added yet — add one below.</p>
        </Card>
      ) : (
        <div className="debt-grid" style={{ marginTop: 20 }}>
          {debts.map(d => {
            const linkedArr = d.linkedCategory?.type === "reserve"
              ? (household.actual.reserve[d.linkedCategory.name] || zeros())
              : null;
            // Each month is checked against that month's own fixed target — saving more
            // than a given month needs counts as extra right away, it doesn't wait for
            // the whole period's total to be reached. Shortfall months don't cancel out
            // surplus months; they just don't add to it.
            let previewExtra = 0;
            if (linkedArr && (d.reserveSurplusMode || "add") === "add") {
              const regularMonthly = nextDebtPaymentTotal(d).total / (12 / (DEBT_FREQUENCIES.find(f => f.key === d.paymentFrequency) || DEBT_FREQUENCIES[0]).perYear);
              for (let m = 0; m <= selectedMonth; m++) {
                previewExtra += Math.max(0, (linkedArr[m] || 0) - regularMonthly);
              }
            }
            return (
            <DebtCard
              key={d.id}
              debt={d}
              household={household}
              previewExtra={previewExtra}
              onChange={(next) => updateDebt(d.id, next)}
              onDelete={() => deleteDebt(d.id)}
            />
            );
          })}
        </div>
      )}

      <Card style={{ marginTop: 20 }}>
        <button
          onClick={() => setAddOpen(o => !o)}
          style={{
            width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "space-between", padding: 0, marginBottom: addOpen ? 12 : 0,
          }}
        >
          <h3 style={{ ...fontDisplay, fontSize: 17, margin: 0, color: COLORS.ink }}>Add a debt</h3>
          {addOpen ? <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(90deg)" }} /> : <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(-90deg)" }} />}
        </button>
        {addOpen && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {SUGGESTED.debt.filter(s => !debts.some(d => d.name === s)).map(s => (
                <Chip key={s} onClick={() => addDebt(s, SUGGESTED_ICONS.debt?.[s])}>
                  {SUGGESTED_ICONS.debt?.[s] ? `${SUGGESTED_ICONS.debt[s]} ` : "+ "}{s}
                </Chip>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <IconPicker icon={icon} setIcon={setIcon} />
              <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && (addDebt(val, icon), setVal(""), setIcon(null))}
                placeholder="Add your own debt…"
                style={{ ...fontBody, flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none" }} />
              <button onClick={() => { addDebt(val, icon); setVal(""); setIcon(null); }} style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontWeight: 700, cursor: "pointer" }}>Add</button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/* ============================================================
   CATEGORIES VIEW
   ============================================================ */
const ICON_CHOICES = ["💰","💵","🏠","🚗","🍔","🛒","🎬","✈️","💊","🎁","⚡","📱","🏥","🎓","❤️","🐶","👶","☕","🧾","💼","📈","🛡️","🔧","🎉"];

function IconPicker({ icon, setIcon }) {
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
}

function CategoryChip({ cat, icon, onIconChange, onRemove }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div style={{
      ...fontBody, display: "flex", alignItems: "center", gap: 6, background: COLORS.lavender,
      color: COLORS.primary, padding: "6px 10px", borderRadius: 20, fontSize: 13, fontWeight: 600,
      position: "relative",
    }}>
      <button
        type="button"
        onClick={() => setPickerOpen(o => !o)}
        title="Change icon"
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 0, fontSize: 14, opacity: icon ? 1 : 0.5 }}
      >
        {icon || "🏷️"}
      </button>
      {cat}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.primary, display: "flex" }}>
        <X size={13} />
      </button>
      {pickerOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, background: "#fff", border: `1px solid ${COLORS.border}`,
          borderRadius: 10, padding: 8, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4,
          boxShadow: "0 6px 20px rgba(0,0,0,0.12)", width: 210,
        }}>
          {ICON_CHOICES.map(ic => (
            <button key={ic} type="button" onClick={() => { onIconChange(ic); setPickerOpen(false); }}
              style={{ fontSize: 17, background: "none", border: "none", cursor: "pointer", borderRadius: 6, padding: 4 }}>
              {ic}
            </button>
          ))}
          <button type="button" onClick={() => { onIconChange(null); setPickerOpen(false); }}
            style={{ fontSize: 11, gridColumn: "span 6", color: COLORS.inkSoft, background: "none", border: "none", cursor: "pointer", ...fontBody }}>
            No icon
          </button>
        </div>
      )}
    </div>
  );
}

function ChangeCategoriesPanel({ type, suggestions, household, update, selectedMonth }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const [icon, setIcon] = useState(null);

  const visible = visibleCategories(household, type, selectedMonth);

  const addCat = (name, ic) => {
    const trimmed = (name || "").trim();
    if (!trimmed) return;
    update(h => {
      const exists = h.categories[type].includes(trimmed);
      if (exists) {
        if (isCategoryVisible(h, type, trimmed, selectedMonth)) return h; // already active, nothing to do
        // Previously removed — bring it back from this month on rather than creating a duplicate.
        return {
          ...h,
          categoryRemovedMonth: { ...h.categoryRemovedMonth, [type]: { ...h.categoryRemovedMonth[type], [trimmed]: null } },
        };
      }
      return {
        ...h,
        categories: { ...h.categories, [type]: [...h.categories[type], trimmed] },
        budget: { ...h.budget, [type]: { ...h.budget[type], [trimmed]: zeros() } },
        actual: { ...h.actual, [type]: { ...h.actual[type], [trimmed]: zeros() } },
        categoryIcons: { ...h.categoryIcons, [type]: { ...h.categoryIcons[type], [trimmed]: ic || null } },
        categoryAddedMonth: { ...h.categoryAddedMonth, [type]: { ...h.categoryAddedMonth[type], [trimmed]: selectedMonth } },
        ...(type === "reserve" ? {
          releasedThrough: { ...h.releasedThrough, [trimmed]: null },
          releasedAmount: { ...h.releasedAmount, [trimmed]: null },
          reserveGoals: { ...h.reserveGoals, [trimmed]: { targetAmount: 0, targetDate: "" } },
        } : {}),
        ...(type === "income" ? {
          sameEveryMonth: { ...h.sameEveryMonth, income: { ...h.sameEveryMonth.income, [trimmed]: false } },
          copyActualFromExpected: { ...h.copyActualFromExpected, income: { ...h.copyActualFromExpected.income, [trimmed]: Array(12).fill(false) } },
        } : {}),
        ...(type === "expense" ? {
          sameEveryMonth: { ...h.sameEveryMonth, expense: { ...h.sameEveryMonth.expense, [trimmed]: false } },
        } : {}),
      };
    });
  };

  const removeCat = (name) => {
    update(h => ({
      ...h,
      categoryRemovedMonth: { ...h.categoryRemovedMonth, [type]: { ...h.categoryRemovedMonth[type], [name]: selectedMonth } },
    }));
  };

  const setCatIcon = (name, ic) => {
    update(h => ({ ...h, categoryIcons: { ...h.categoryIcons, [type]: { ...h.categoryIcons[type], [name]: ic } } }));
  };

  return (
    <Card style={{ marginTop: 20 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: 0, marginBottom: open ? 14 : 0,
        }}
      >
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: 0, color: COLORS.ink }}>Change Categories</h3>
        {open ? <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(90deg)" }} /> : <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(-90deg)" }} />}
      </button>
      {open && (
        <>
          <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: "0 0 12px" }}>
            Removing a category hides it from {MONTHS[selectedMonth]} onward — earlier months keep showing it. A new category only appears from {MONTHS[selectedMonth]} on.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {visible.map(c => (
              <CategoryChip
                key={c}
                cat={c}
                icon={household.categoryIcons?.[type]?.[c]}
                onIconChange={(ic) => setCatIcon(c, ic)}
                onRemove={() => removeCat(c)}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {suggestions.filter(s => !visible.includes(s)).map(s => (
              <Chip key={s} onClick={() => addCat(s, SUGGESTED_ICONS[type]?.[s])}>
                {SUGGESTED_ICONS[type]?.[s] ? `${SUGGESTED_ICONS[type][s]} ` : "+ "}{s}
              </Chip>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <IconPicker icon={icon} setIcon={setIcon} />
            <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && (addCat(val, icon), setVal(""), setIcon(null))}
              placeholder="Add your own category…"
              style={{ ...fontBody, flex: 1, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${COLORS.border}`, fontSize: 13, outline: "none" }} />
            <button onClick={() => { addCat(val, icon); setVal(""); setIcon(null); }} style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "0 14px", fontWeight: 700, cursor: "pointer" }}>Add</button>
          </div>
        </>
      )}
    </Card>
  );
}

function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true
    );
    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isStandalone || installed) return null;

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <Card style={{ marginBottom: 20 }}>
      <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 4px", color: COLORS.ink, display: "flex", alignItems: "center", gap: 8 }}>
        <Download size={18} color={COLORS.primary} /> Get the app
      </h3>
      <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, margin: "0 0 12px" }}>
        Install Twogether on your phone for a proper app icon and a full-screen view, no browser bar.
      </p>

      {isIOS ? (
        <>
          <button
            onClick={() => setShowIosHelp(o => !o)}
            style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Download size={16} /> Download the app
          </button>
          {showIosHelp && (
            <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: "10px 0 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              Tap <Share size={13} style={{ verticalAlign: "middle" }} /> <strong>Share</strong> in Safari's toolbar, then choose <strong>"Add to Home Screen."</strong>
            </p>
          )}
        </>
      ) : deferredPrompt ? (
        <button
          onClick={install}
          style={{ ...fontBody, background: COLORS.primary, color: "#fff", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Download size={16} /> Download the app
        </button>
      ) : (
        <p style={{ ...fontBody, fontSize: 12, color: COLORS.inkSoft, margin: 0 }}>
          Open your browser's menu and look for "Install app" or "Add to Home Screen."
        </p>
      )}
    </Card>
  );
}

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
  return (
    <div className="page-content" style={{ flex: 1 }}>
      <h1 style={{ ...fontDisplay, fontSize: 30, color: COLORS.ink, margin: "0 0 4px" }}>Settings</h1>
      <p style={{ ...fontBody, color: COLORS.inkSoft, margin: "0 0 24px", fontSize: 14 }}>Account, balance, and appearance. Categories are managed from the Income, Expenses, and Reserves pages themselves.</p>
      <InstallAppCard />
      <AccountPanel household={household} sessionPassword={sessionPassword} onRename={onRename} />
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 4px", color: COLORS.ink }}>Starting balance</h3>
        <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, margin: "0 0 12px" }}>
          Your account balance on the day you started tracking — everything else builds from here. Adjust it if it was off, or your situation changed.
        </p>
        <div style={{ position: "relative", maxWidth: 220 }}>
          <span style={{ position: "absolute", left: 14, top: 12, ...fontBody, fontSize: 15, color: COLORS.inkSoft }}>{CURRENCY_SYMBOL}</span>
          <input
            type="number" onFocus={e => e.target.select()}
            value={household.startingBalance ?? 0}
            onChange={e => update(h => ({ ...h, startingBalance: Number(e.target.value) || 0 }))}
            placeholder="0"
            style={{ ...fontBody, width: "100%", padding: "10px 14px 10px 30px", borderRadius: 10, border: `1.5px solid ${COLORS.border}`, fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </Card>
      <Card style={{ marginBottom: 20 }}>
        <h3 style={{ ...fontDisplay, fontSize: 17, margin: "0 0 4px", color: COLORS.ink }}>Appearance</h3>
        <p style={{ ...fontBody, fontSize: 13, color: COLORS.inkSoft, margin: "0 0 4px" }}>Change the app's colors whenever you like.</p>
        <ThemePicker
          theme={household.theme || THEMES[0]}
          setTheme={(t) => { applyTheme(t); PALETTE = paletteFor(t); update(h => ({ ...h, theme: t })); }}
        />
        <CurrencyPicker
          currency={household.currency || CURRENCIES[0]}
          setCurrency={(c) => { CURRENCY_SYMBOL = c.symbol; update(h => ({ ...h, currency: c })); }}
        />
      </Card>
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
        {open ? <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(90deg)" }} /> : <ChevronLeft size={18} color={COLORS.inkSoft} style={{ transform: "rotate(-90deg)" }} />}
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

// Backfills fields that didn't exist yet when older household records were saved,
// so loading them doesn't crash on `undefined` (e.g. .categoryAddedMonth[type]).
function normalizeHousehold(h) {
  if (!h) return h;
  const empty = emptyHousehold();
  return {
    ...empty,
    ...h,
    categories: { ...empty.categories, ...(h.categories || {}) },
    budget: { ...empty.budget, ...(h.budget || {}) },
    actual: { ...empty.actual, ...(h.actual || {}) },
    categoryIcons: { ...empty.categoryIcons, ...(h.categoryIcons || {}) },
    categoryAddedMonth: { ...empty.categoryAddedMonth, ...(h.categoryAddedMonth || {}) },
    categoryRemovedMonth: { ...empty.categoryRemovedMonth, ...(h.categoryRemovedMonth || {}) },
    releasedThrough: h.releasedThrough || {},
    releasedAmount: h.releasedAmount || {},
    archivedReserves: h.archivedReserves || [],
    reserveGoals: h.reserveGoals || {},
    debts: (h.debts || []).map(d => ({
      paymentOverrides: {}, feeOverrides: {}, linkedCategory: null, paidPeriods: 0,
      reserveSurplusMode: "add", lastSettledMonth: null,
      ...d,
    })),
    sameEveryMonth: { ...empty.sameEveryMonth, ...(h.sameEveryMonth || {}) },
    copyActualFromExpected: { ...empty.copyActualFromExpected, ...(h.copyActualFromExpected || {}) },
    preferences: { ...empty.preferences, ...(h.preferences || {}) },
    transactions: h.transactions || [],
  };
}

async function loadHouseholdRecord(id, plainPassword) {
  try {
    const { household } = await apiCall("/api/household/login", { id, password: plainPassword });
    return normalizeHousehold(household);
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
    <div style={{ minHeight: "100dvh", background: `radial-gradient(circle at 20% 10%, ${COLORS.lavender}, ${COLORS.bg} 60%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
        <div style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 10, background: COLORS.bg, ...fontBody, color: COLORS.inkSoft,
        }}>
          <div style={{ position: "relative", width: 280, height: 280 }}>
            <span style={{ position: "absolute", inset: 0, fontSize: 210, display: "flex", alignItems: "center", justifyContent: "center", animation: "sway 2.4s ease-in-out infinite", transformOrigin: "bottom center" }}>🌳</span>
            <span style={{ position: "absolute", left: "18%", top: "20%", fontSize: 34, animation: "bob 2.2s ease-in-out infinite .1s" }}>💵</span>
            <span style={{ position: "absolute", right: "14%", top: "14%", fontSize: 32, animation: "bob 2.2s ease-in-out infinite .5s" }}>💵</span>
            <span style={{ position: "absolute", left: "8%", top: "44%", fontSize: 30, animation: "bob 2.2s ease-in-out infinite .9s" }}>💵</span>
            <span style={{ position: "absolute", right: "6%", top: "42%", fontSize: 34, animation: "bob 2.2s ease-in-out infinite .3s" }}>💵</span>
            <span style={{ position: "absolute", left: "38%", top: "8%", fontSize: 30, animation: "bob 2.2s ease-in-out infinite .7s" }}>💵</span>
            <span style={{ position: "absolute", left: "44%", top: "40%", fontSize: 30, animation: "bob 2.2s ease-in-out infinite 1.1s" }}>💵</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Growing your budget…</span>
          <style>{`
            @keyframes sway { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
            @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          `}</style>
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
            setHousehold(normalizeHousehold(h));
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
        <div style={{ minHeight: "100dvh", background: `radial-gradient(circle at 20% 10%, ${COLORS.lavender}, ${COLORS.bg} 60%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
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
            {view === "debt" && <DebtView household={household} update={update} selectedMonth={selectedMonth} />}
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
      .app-shell { display: flex; min-height: 100vh; min-height: 100dvh; }
      .sidebar { width: 220px; }
      .sidebar-nav-item { width: 100%; }
      .top-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 16px 32px; }
      .page-content { padding: 32px; }
      .kpi-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
      .kpi-card { flex: 1; min-width: 180px; }
      .two-col-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; align-items: start; }
      .debt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 16px; align-items: start; }

      @media (max-width: 760px) {
        .app-shell { flex-direction: column; }
        .sidebar {
          width: 100%; min-height: auto !important; position: sticky; top: 0; z-index: 20;
          padding: 8px 6px !important; padding-top: max(8px, env(safe-area-inset-top)) !important; order: -1;
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

        .page-content { padding: 16px !important; padding-bottom: max(16px, env(safe-area-inset-bottom)) !important; }
        h1 { font-size: 22px !important; }

        .kpi-row { gap: 10px; }
        .kpi-card { min-width: 47% !important; flex: 1 1 47% !important; }
        .kpi-card .kpi-value { font-size: 15px !important; }

        table { font-size: 11px !important; }
        .two-col-grid { grid-template-columns: 1fr !important; }
        .debt-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  );
}
