import {
  Payable,
  PayableInstallment,
  PayableType,
  PayableStatus,
  InstallmentStatus,
  PaymentMethod,
} from "@/types/database";
import { INITIAL_ASSETS } from "@/lib/data/initial-data";
import { getServiceSupabaseClient, isValidUuid } from "@/lib/supabase/db";
import { getEnvStatus } from "@/lib/env";
import Decimal from "decimal.js";

// Baseline Anycubic Kobra X Shopee PayLater 3-month Installment
const ANYCUBIC_ASSET = INITIAL_ASSETS.find((a) => a.name.includes("Anycubic")) || INITIAL_ASSETS[1];

export const INITIAL_PAYABLES: Payable[] = [
  {
    id: "pay-anycubic-01",
    title: "Cicilan Anycubic Kobra X (Shopee PayLater)",
    payable_type: "ASSET_INSTALLMENT",
    creditor_name: "Shopee PayLater / PT Commerce Finance",
    related_asset_id: ANYCUBIC_ASSET.id,
    total_amount: 5872800, // Rp 1.957.600 x 3 bulan
    remaining_amount: 5872800, // Status awal: belum ada yang dibayar
    monthly_installment: 1957600,
    term_months: 3,
    start_date: "2026-11-01",
    status: "UNPAID",
    notes: "Pembelian mesin cetak Anycubic Kobra X via Shopee PayLater tenor 3 bulan (@ Rp 1.957.600). Jatuh tempo setiap tanggal 1.",
    created_at: "2026-10-15T00:00:00Z",
    updated_at: "2026-10-15T00:00:00Z",
    related_asset: ANYCUBIC_ASSET,
    installments: [
      {
        id: "inst-01",
        payable_id: "pay-anycubic-01",
        installment_number: 1,
        due_date: "2026-11-01",
        amount: 1957600,
        paid_amount: 0,
        status: "UNPAID",
        payment_date: null,
        payment_method: null,
        reference_number: null,
        notes: "Angsuran Bulan ke-1",
        created_at: "2026-10-15T00:00:00Z",
      },
      {
        id: "inst-02",
        payable_id: "pay-anycubic-01",
        installment_number: 2,
        due_date: "2026-12-01",
        amount: 1957600,
        paid_amount: 0,
        status: "UNPAID",
        payment_date: null,
        payment_method: null,
        reference_number: null,
        notes: "Angsuran Bulan ke-2",
        created_at: "2026-10-15T00:00:00Z",
      },
      {
        id: "inst-03",
        payable_id: "pay-anycubic-01",
        installment_number: 3,
        due_date: "2027-01-01",
        amount: 1957600,
        paid_amount: 0,
        status: "UNPAID",
        payment_date: null,
        payment_method: null,
        reference_number: null,
        notes: "Angsuran Bulan ke-3 (Pelunasan Akhir)",
        created_at: "2026-10-15T00:00:00Z",
      },
    ],
  },
];

const memoryPayables: Payable[] = JSON.parse(JSON.stringify(INITIAL_PAYABLES));

export interface CreatePayablePayload {
  title: string;
  payable_type?: PayableType;
  creditor_name: string;
  related_asset_id?: string;
  total_amount: number;
  monthly_installment?: number;
  term_months?: number;
  start_date: string;
  notes?: string;
}

export interface RecordInstallmentPaymentPayload {
  installment_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
}

export interface PayablesSummary {
  totalObligations: number;
  totalRemaining: number;
  totalPaid: number;
  countActive: number;
  dueThisMonthAmount: number;
  overdueCount: number;
}

/**
 * Helper to compute status based on current date and payment status
 */
export function computeInstallmentStatus(
  inst: PayableInstallment,
  currentDate = new Date().toISOString().slice(0, 10)
): InstallmentStatus {
  if (inst.paid_amount >= inst.amount) {
    return "PAID";
  }
  if (inst.due_date < currentDate) {
    return "OVERDUE";
  }
  return "UNPAID";
}

/**
 * Fetch all payables with dynamic status calculation
 */
export async function getPayables(): Promise<Payable[]> {
  const currentDate = new Date().toISOString().slice(0, 10);
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
      const { data, error } = await supabase
        .from("payables")
        .select(`
          *,
          installments:payable_installments(*),
          related_asset:assets(*)
        `)
        .order("start_date", { ascending: false });

      if (!error && data && data.length > 0) {
        return (data as Payable[]).map((pay) => {
          const insts = (pay.installments || []).map((inst) => ({
            ...inst,
            status: computeInstallmentStatus(inst, currentDate),
          }));
          return {
            ...pay,
            installments: insts,
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  // Update memory store dynamic status
  return memoryPayables.map((pay) => {
    const insts = (pay.installments || []).map((inst) => ({
      ...inst,
      status: computeInstallmentStatus(inst, currentDate),
    }));

    const allPaid = insts.every((i) => i.status === "PAID");
    const anyPaid = insts.some((i) => i.paid_amount > 0);
    const anyOverdue = insts.some((i) => i.status === "OVERDUE");

    let status: PayableStatus = "UNPAID";
    if (allPaid) status = "PAID";
    else if (anyOverdue) status = "OVERDUE";
    else if (anyPaid) status = "PARTIALLY_PAID";

    return {
      ...pay,
      status,
      installments: insts,
    };
  });
}

/**
 * Get payable by ID
 */
export async function getPayableById(id: string): Promise<Payable | undefined> {
  const payables = await getPayables();
  return payables.find((p) => p.id === id);
}

/**
 * Get summary stats of payables
 */
export async function getPayablesSummary(): Promise<PayablesSummary> {
  const payables = await getPayables();
  const now = new Date();
  const currentMonthYear = now.toISOString().slice(0, 7); // YYYY-MM

  let totalObligations = new Decimal(0);
  let totalRemaining = new Decimal(0);
  let totalPaid = new Decimal(0);
  let dueThisMonth = new Decimal(0);
  let overdueCount = 0;
  let countActive = 0;

  for (const pay of payables) {
    totalObligations = totalObligations.plus(pay.total_amount);
    totalRemaining = totalRemaining.plus(pay.remaining_amount);
    totalPaid = totalPaid.plus(new Decimal(pay.total_amount).minus(pay.remaining_amount));

    if (pay.status !== "PAID") {
      countActive++;
    }

    if (pay.installments) {
      for (const inst of pay.installments) {
        if (inst.status === "OVERDUE") {
          overdueCount++;
        }
        if (inst.status !== "PAID" && inst.due_date.startsWith(currentMonthYear)) {
          dueThisMonth = dueThisMonth.plus(new Decimal(inst.amount).minus(inst.paid_amount));
        }
      }
    }
  }

  return {
    totalObligations: totalObligations.toNumber(),
    totalRemaining: totalRemaining.toNumber(),
    totalPaid: totalPaid.toNumber(),
    countActive,
    dueThisMonthAmount: dueThisMonth.toNumber(),
    overdueCount,
  };
}

/**
 * Record payment for an installment
 */
export async function recordInstallmentPayment(
  payload: RecordInstallmentPaymentPayload
): Promise<{ payable: Payable; installment: PayableInstallment }> {
  const payAmountDec = new Decimal(payload.amount);
  if (payAmountDec.lessThanOrEqualTo(0)) {
    throw new Error("Nominal pembayaran harus lebih besar dari Rp 0.");
  }

  const { isConfigured } = getEnvStatus();
  if (isConfigured && isValidUuid(payload.installment_id)) {
    const supabase = await getServiceSupabaseClient();
    const { data: instRow, error: instFetchError } = await supabase
      .from("payable_installments")
      .select("*")
      .eq("id", payload.installment_id)
      .single();

    if (instFetchError || !instRow) {
      throw new Error(`Jadwal angsuran ID "${payload.installment_id}" tidak ditemukan di database.`);
    }

    const { data: payRow, error: payFetchError } = await supabase
      .from("payables")
      .select(`*, installments:payable_installments(*)`)
      .eq("id", instRow.payable_id)
      .single();

    if (payFetchError || !payRow) {
      throw new Error(`Data utang induk tidak ditemukan di database.`);
    }

    const updatedPaidAmount = Number(instRow.paid_amount || 0) + payAmountDec.toNumber();
    const updatedInstStatus: PayableInstallment["status"] =
      updatedPaidAmount >= Number(instRow.amount) ? "PAID" : "UNPAID";

    const { data: updatedInst, error: instUpdateError } = await supabase
      .from("payable_installments")
      .update({
        paid_amount: updatedPaidAmount,
        status: updatedInstStatus,
        payment_date: payload.payment_date,
        payment_method: payload.payment_method,
        reference_number: payload.reference_number || null,
        notes: payload.notes || instRow.notes,
      })
      .eq("id", instRow.id)
      .select()
      .single();

    if (instUpdateError) {
      throw new Error(`Gagal memperbarui angsuran di database: ${instUpdateError.message}`);
    }

    const newRemaining = Math.max(
      0,
      new Decimal(payRow.remaining_amount).minus(payAmountDec).toNumber()
    );
    const otherInsts = (payRow.installments || []).map((i: PayableInstallment) =>
      i.id === instRow.id ? { ...i, status: updatedInstStatus } : i
    );
    const allInstPaid = otherInsts.every((i: PayableInstallment) => i.status === "PAID");
    const newPayStatus: PayableStatus = allInstPaid ? "PAID" : "PARTIALLY_PAID";
    const nowIso = new Date().toISOString();

    const { data: updatedPay, error: payUpdateError } = await supabase
      .from("payables")
      .update({
        remaining_amount: newRemaining,
        status: newPayStatus,
        updated_at: nowIso,
      })
      .eq("id", payRow.id)
      .select(`*, installments:payable_installments(*), related_asset:assets(*)`)
      .single();

    if (payUpdateError) {
      throw new Error(`Gagal memperbarui saldo utang di database: ${payUpdateError.message}`);
    }

    return {
      payable: updatedPay as Payable,
      installment: updatedInst as PayableInstallment,
    };
  }

  let targetPayable: Payable | undefined;
  let targetInstallment: PayableInstallment | undefined;

  for (const pay of memoryPayables) {
    if (pay.installments) {
      const found = pay.installments.find((i) => i.id === payload.installment_id);
      if (found) {
        targetPayable = pay;
        targetInstallment = found;
        break;
      }
    }
  }

  if (!targetPayable || !targetInstallment) {
    throw new Error(`Jadwal angsuran ID "${payload.installment_id}" tidak ditemukan.`);
  }

  // Update installment
  targetInstallment.paid_amount = targetInstallment.paid_amount + payAmountDec.toNumber();
  targetInstallment.payment_date = payload.payment_date;
  targetInstallment.payment_method = payload.payment_method;
  targetInstallment.reference_number = payload.reference_number || null;
  targetInstallment.notes = payload.notes || targetInstallment.notes;
  targetInstallment.status = targetInstallment.paid_amount >= targetInstallment.amount ? "PAID" : "UNPAID";

  // Update parent payable remaining amount
  const newRemaining = Math.max(
    0,
    new Decimal(targetPayable.remaining_amount).minus(payAmountDec).toNumber()
  );
  targetPayable.remaining_amount = newRemaining;
  targetPayable.updated_at = new Date().toISOString();

  const allInstPaid = targetPayable.installments?.every((i) => i.status === "PAID");
  targetPayable.status = allInstPaid ? "PAID" : "PARTIALLY_PAID";

  return { payable: targetPayable, installment: targetInstallment };
}

/**
 * Create a new payable obligation
 */
export async function createPayable(payload: CreatePayablePayload): Promise<Payable> {
  if (!payload.title || !payload.title.trim()) {
    throw new Error("Nama kewajiban utang wajib diisi.");
  }
  if (!payload.creditor_name || !payload.creditor_name.trim()) {
    throw new Error("Nama kreditur / pihak pembiayaan wajib diisi.");
  }

  const totalDec = new Decimal(payload.total_amount);
  if (totalDec.lessThanOrEqualTo(0)) {
    throw new Error("Total kewajiban utang harus lebih besar dari Rp 0.");
  }

  const termMonths = payload.term_months || 1;
  const monthly = payload.monthly_installment || Math.ceil(totalDec.dividedBy(termMonths).toNumber());

  const nowIso = new Date().toISOString();
  const payId = crypto.randomUUID();

  // Generate installments
  const installments: PayableInstallment[] = [];
  const startDate = new Date(payload.start_date || nowIso.slice(0, 10));

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    installments.push({
      id: crypto.randomUUID(),
      payable_id: payId,
      installment_number: i,
      due_date: dueDate.toISOString().slice(0, 10),
      amount: monthly,
      paid_amount: 0,
      status: "UNPAID",
      payment_date: null,
      payment_method: null,
      reference_number: null,
      notes: `Angsuran Bulan ke-${i}`,
      created_at: nowIso,
    });
  }

  const newPayable: Payable = {
    id: payId,
    title: payload.title.trim(),
    payable_type: payload.payable_type || "OTHER",
    creditor_name: payload.creditor_name.trim(),
    related_asset_id: payload.related_asset_id || null,
    total_amount: totalDec.toNumber(),
    remaining_amount: totalDec.toNumber(),
    monthly_installment: monthly,
    term_months: termMonths,
    start_date: payload.start_date || nowIso.slice(0, 10),
    status: "UNPAID",
    notes: payload.notes || null,
    created_at: nowIso,
    updated_at: nowIso,
    installments,
  };

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { error: payError } = await supabase.from("payables").insert({
      id: newPayable.id,
      title: newPayable.title,
      payable_type: newPayable.payable_type,
      creditor_name: newPayable.creditor_name,
      related_asset_id: isValidUuid(newPayable.related_asset_id) ? newPayable.related_asset_id : null,
      total_amount: newPayable.total_amount,
      remaining_amount: newPayable.remaining_amount,
      monthly_installment: newPayable.monthly_installment,
      term_months: newPayable.term_months,
      start_date: newPayable.start_date,
      status: newPayable.status,
      notes: newPayable.notes,
    });

    if (payError) {
      throw new Error(`Gagal menyimpan kewajiban utang ke database: ${payError.message}`);
    }

    const { error: instError } = await supabase.from("payable_installments").insert(installments);
    if (instError) {
      throw new Error(`Gagal menyimpan jadwal angsuran ke database: ${instError.message}`);
    }

    return newPayable;
  }

  memoryPayables.unshift(newPayable);
  return newPayable;
}

/**
 * Delete a payable obligation
 */
export async function deletePayable(id: string): Promise<boolean> {
  const { isConfigured } = getEnvStatus();
  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("payables").delete().eq("id", id);
    if (error) {
      throw new Error(`Gagal menghapus kewajiban utang di database: ${error.message}`);
    }
    return true;
  }

  const index = memoryPayables.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Utang dengan ID "${id}" tidak ditemukan.`);
  }

  memoryPayables.splice(index, 1);
  return true;
}
