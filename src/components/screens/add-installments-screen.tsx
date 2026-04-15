"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlignJustify, CreditCard, Info, Layers, Navigation, SquarePen } from "lucide-react";

import { useCreditCards } from "@/lib/hooks/use-credit-cards";
import { useCategories } from "@/lib/hooks/use-categories";
import { useTransactions } from "@/lib/hooks/use-transactions";
import { parseNumericInput, sanitizeNumericInput, normalizeNumericBlurValue, getNumericInputWidth } from "@/lib/numeric-input";
import { KIND_META } from "@/lib/transaction-defaults";

import {
  AmountSection,
  FieldLabel,
  FieldRow,
  FormDateField,
  FormPickerField,
  FormScrollBody,
  FormTextField,
  FormToggleRow,
  SaveButton,
  TransactionFormHeader,
  TransactionFormLayout,
  todayISO,
} from "@/components/screens/transaction-form-base";
import {
  CategoryPickerSheet,
  CreditCardPickerSheet,
} from "@/components/screens/picker-sheets";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
] as const;

function fmtDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/**
 * Given a reference date (ISO string) and a statement closing day,
 * returns {statementDate, firstPaymentDate} as formatted strings.
 *
 * Logic:
 *   - nextStatement: next occurrence of statementDay >= refDate
 *   - firstPayment:  paymentDay of the month after statementDate
 */
function calcBillingInfo(
  refDateISO: string,
  statementDay: number,
  paymentDay: number,
): { statementDate: string; firstPaymentDate: string } {
  const ref = new Date(refDateISO + "T12:00:00");
  const refDay = ref.getDate();
  const refMonth = ref.getMonth();
  const refYear = ref.getFullYear();

  let stMonth = refMonth;
  let stYear = refYear;
  // Si el día de corte ya pasó este mes, va al próximo
  if (statementDay < refDay) {
    stMonth += 1;
    if (stMonth > 11) { stMonth = 0; stYear += 1; }
  }
  const statementDate = new Date(stYear, stMonth, statementDay);

  // Primer pago: paymentDay del mes siguiente al corte
  let pmMonth = stMonth + 1;
  let pmYear = stYear;
  if (pmMonth > 11) { pmMonth = 0; pmYear += 1; }
  const firstPaymentDate = new Date(pmYear, pmMonth, paymentDay);

  return {
    statementDate: fmtDate(statementDate),
    firstPaymentDate: fmtDate(firstPaymentDate),
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AddInstallmentsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCardId = searchParams.get("cardId") ?? "";

  const { cards, update: updateCard } = useCreditCards();
  const { categories } = useCategories();
  const { create: createTransaction } = useTransactions();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState(preselectedCardId);
  const [payments, setPayments] = useState("12");
  const [monthlyStr, setMonthlyStr] = useState("0");
  const [purchaseDate, setPurchaseDate] = useState(todayISO);
  const [buyNowPayLater, setBuyNowPayLater] = useState(false);
  const [payLaterDate, setPayLaterDate] = useState(todayISO);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);

  // Reopen the correct picker when returning from create flows
  useEffect(() => {
    const pending = sessionStorage.getItem("__returnPicker");
    if (!pending) return;
    sessionStorage.removeItem("__returnPicker");
    if (pending === "category") setShowCategoryPicker(true);
    if (pending === "credit-card") setShowCardPicker(true);
  }, []);

  const categoryName =
    (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";
  const card = (cards ?? []).find((c) => c.id === cardId) ?? null;
  const cardName = card?.name ?? "";

  const numericAmount = parseNumericInput(amount);
  const paymentCount = Math.max(1, parseInt(payments || "1", 10));

  // Cuando amount o payments cambian desde afuera, sincroniza monthlyStr
  const syncMonthlyFromAmount = (rawAmount: string, rawPayments: string) => {
    const n = parseNumericInput(rawAmount);
    const p = Math.max(1, parseInt(rawPayments || "1", 10));
    setMonthlyStr(n ? String(Math.ceil(n / p)) : "0");
  };

  const handleAmountChange = (v: string) => {
    setAmount(v);
    setError("");
    syncMonthlyFromAmount(v, payments);
  };

  const handlePaymentsChange = (v: string) => {
    const sanitized = sanitizeNumericInput(v, "integer");
    setPayments(sanitized);
    syncMonthlyFromAmount(amount, sanitized);
  };

  const handlePaymentsBlur = () => {
    const norm = normalizeNumericBlurValue(payments, "integer") || "1";
    setPayments(norm);
    syncMonthlyFromAmount(amount, norm);
  };

  const handleMonthlyChange = (v: string) => {
    const sanitized = sanitizeNumericInput(v, "integer");
    setMonthlyStr(sanitized);
    // Recalcula el monto total: monthly × pagos
    const m = parseNumericInput(sanitized);
    setAmount(m ? String(m * paymentCount) : "0");
  };

  const handleMonthlyBlur = () => {
    const norm = normalizeNumericBlurValue(monthlyStr, "integer");
    setMonthlyStr(norm);
    const m = parseNumericInput(norm);
    setAmount(m ? String(m * paymentCount) : "0");
  };

  const numericMonthly = parseNumericInput(monthlyStr);

  // Info de facturación calculada dinámicamente
  const billingInfo = useMemo(() => {
    if (!card) return null;
    const refDate = buyNowPayLater ? payLaterDate : purchaseDate;
    return calcBillingInfo(refDate, card.statementDay, card.paymentDay);
  }, [card, buyNowPayLater, payLaterDate, purchaseDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!cardId) { setError("Selecciona una tarjeta de crédito."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const meta = KIND_META.installments;

      await createTransaction({
        accountId: cardId,
        amount: numericAmount,
        description: description.trim() || "Compra a meses",
        category: categoryName,
        date: purchaseDate,
        paymentDate: buyNowPayLater ? payLaterDate : purchaseDate,
        kind: "installments",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: [
          `${paymentCount} pagos de $${numericMonthly.toLocaleString("es-CL")}`,
          buyNowPayLater ? "Compra ahora, paga después" : "",
        ].filter(Boolean).join(" · "),
        statusLabel: meta.statusLabel,
      });

      if (card) {
        await updateCard(cardId, { balance: card.balance + numericAmount });
      }

      router.back();
    } catch {
      setError("Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TransactionFormLayout>
      <TransactionFormHeader title="Agregar Compra a Meses" />

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <FormScrollBody>
          <AmountSection value={amount} onChange={handleAmountChange} />

          <section className="mt-8">
            <FormTextField
              id="description"
              label="Descripción"
              icon={<SquarePen size={16} />}
              value={description}
              onChange={setDescription}
            />
            <FormPickerField
              label="Categoría"
              icon={<Layers size={16} />}
              value={categoryName}
              placeholder="Selecciona categoría"
              onClick={() => setShowCategoryPicker(true)}
            />
            <FormPickerField
              label="Tarjeta de crédito"
              icon={<CreditCard size={16} />}
              value={cardName}
              placeholder="Selecciona cuenta"
              onClick={() => setShowCardPicker(true)}
            />

            {/* Número de Pagos + Mensualidad */}
            <FieldRow>
              <div className="grid grid-cols-2 gap-x-6">
                <div>
                  <FieldLabel htmlFor="payments">Número de Pagos</FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-white/55"><Navigation size={16} /></span>
                     <input
                      id="payments"
                      name="payments"
                      type="text"
                      inputMode="numeric"
                      value={payments}
                      onChange={(e) => handlePaymentsChange(e.target.value)}
                      onBlur={handlePaymentsBlur}
                      style={{ width: getNumericInputWidth(payments, 2) }}
                      className="type-body min-w-[2ch] border-0 bg-transparent p-0 font-medium text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel htmlFor="monthly">Mensualidad</FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-white/55"><AlignJustify size={16} /></span>
                    <span className="type-body font-medium text-[var(--text-primary)]">$</span>
                    <input
                      id="monthly"
                      name="monthly"
                      type="text"
                      inputMode="numeric"
                      value={monthlyStr === "0" ? "" : monthlyStr}
                      placeholder="0"
                      onChange={(e) => handleMonthlyChange(e.target.value)}
                      onBlur={handleMonthlyBlur}
                      style={{ width: getNumericInputWidth(monthlyStr, 2) }}
                      className="type-body min-w-[2ch] border-0 bg-transparent p-0 font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                    />
                  </div>
                </div>
              </div>
            </FieldRow>

            <FormDateField
              id="purchase-date"
              label="Fecha de compra"
              value={purchaseDate}
              onChange={setPurchaseDate}
            />

            {/* Toggle: Compra ahora y paga después */}
            <FormToggleRow
              label="Compra ahora y paga después"
              description="Asigna una fecha para comenzar a pagar"
              checked={buyNowPayLater}
              onChange={setBuyNowPayLater}
            />

            {/* Date picker extra — solo cuando toggle está ON */}
            {buyNowPayLater && (
              <FormDateField
                id="pay-later-date"
                label="Fecha de inicio de pago"
                value={payLaterDate}
                onChange={setPayLaterDate}
              />
            )}

            {/* Info de facturación — siempre visible cuando hay tarjeta */}
            {billingInfo && (
              <div className="mt-2 flex items-start gap-3 py-3">
                <span className="mt-[1px] shrink-0 text-[var(--text-tertiary)]">
                  <Info size={16} />
                </span>
                <p className="type-label leading-snug text-[var(--text-secondary)]">
                  Tu compra será incluida en el estado de cuenta del{" "}
                  <span className="font-medium text-[var(--text-primary)]">{billingInfo.statementDate}</span>
                  , y tu primer pago vence en{" "}
                  <span className="font-medium text-[var(--text-primary)]">{billingInfo.firstPaymentDate}</span>
                  .
                </p>
              </div>
            )}
          </section>

          {error ? (
            <p className="mt-3 text-center text-[0.8rem] text-[#f55a3d]">{error}</p>
          ) : null}
        </FormScrollBody>

        <SaveButton isSaving={isSaving} />
      </form>

      {showCategoryPicker && (
        <CategoryPickerSheet
          type="expense"
          selected={categoryId}
          onSelect={setCategoryId}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}

      {showCardPicker && (
        <CreditCardPickerSheet
          selected={cardId}
          onSelect={(id) => { setCardId(id); setError(""); }}
          onClose={() => setShowCardPicker(false)}
        />
      )}
    </TransactionFormLayout>
  );
}
