import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import {
  ALL_CAPITAL_PURCHASES,
  ALL_EXPENSES,
  INITIAL_ASSETS,
} from "@/lib/data/initial-data";

function parseCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let val = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    const next = raw[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        val += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        val += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(val);
        val = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(val);
        rows.push(row);
        row = [];
        val = "";
        i++;
      } else if (ch === "\n") {
        row.push(val);
        rows.push(row);
        row = [];
        val = "";
      } else {
        val += ch;
      }
    }
  }
  if (val.length > 0 || row.length > 0) {
    row.push(val);
    rows.push(row);
  }
  return rows;
}

describe("Moral Lab CSV Reconciliation (data/moral_lab_expenses.csv)", () => {
  it("reconciles ALL_CAPITAL_PURCHASES + ALL_EXPENSES to exact Rp 16.022.911 from CSV", () => {
    const csvPath = path.resolve(process.cwd(), "data/moral_lab_expenses.csv");
    const raw = fs.readFileSync(csvPath, "utf8");
    const rows = parseCsvRows(raw).slice(1);
    const moralLabRows = rows.filter((r) => (r[2] || "").trim() === "Moral Lab");

    expect(moralLabRows).toHaveLength(49);

    const csvTotal = moralLabRows.reduce((sum, r) => sum + Number(r[5] || 0), 0);
    expect(csvTotal).toBe(16022911);

    const capitalTotal = ALL_CAPITAL_PURCHASES.reduce((sum, item) => sum + item.totalCost, 0);
    const expensesTotal = ALL_EXPENSES.reduce((sum, item) => sum + item.amount, 0);

    expect(capitalTotal).toBe(14811820);
    expect(expensesTotal).toBe(1211091);
    expect(capitalTotal + expensesTotal).toBe(csvTotal);
  });

  it("uses exact CSV dates (2026-09-23 to 2026-11-20) on all capital purchases, assets, and expenses", () => {
    for (const item of ALL_CAPITAL_PURCHASES) {
      expect(item.purchaseDate).toMatch(/^2026-(09|10|11)-\d{2}$/);
    }
    for (const exp of ALL_EXPENSES) {
      expect(exp.expense_date).toMatch(/^2026-(10|11)-\d{2}$/);
    }
    const a1 = INITIAL_ASSETS.find((a) => a.id === "asset-01");
    const anycubic = INITIAL_ASSETS.find((a) => a.id === "asset-02");
    expect(a1?.purchase_date).toBe("2026-09-23");
    expect(a1?.purchase_price).toBe(3589221);
    expect(anycubic?.purchase_date).toBe("2026-10-14");
    expect(anycubic?.purchase_price).toBe(5870800);
  });
});
