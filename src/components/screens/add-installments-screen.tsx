"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlignJustify, CreditCard, Layers, Navigation, SquarePen } from "lucide-react";

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
  FormScrollBody,
  FormSelectField,
  FormTextField,
  FormToggleRow,
  SaveButton,
  TransactionFormHeader,
  TransactionFormLayout,
  todayISO,
} from "@/components/screens/transaction-form-base";

export function AddInstallmentsScreen() {
  const router = useRouter();
  const { cards, update: updateCard } = useCreditCards();
  const { categories } = useCategories();
  const { create: createTransaction } = useTransactions();

  const [amount, setAmount] = useState("0");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [payments, setPayments] = useState("12");
  const [purchaseDate, setPurchaseDate] = useState(todayISO);
  const [buyNowPayLater, setBuyNowPayLater] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const cardOptions = (cards ?? []).map((c) => ({ value: c.id, label: c.name }));
  const categoryOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.name }));

  const numericAmount = parseNumericInput(amount);
  const paymentCount = Math.max(1, parseInt(payments || "1", 10));
  const monthlyPayment = useMemo(
    () => (numericAmount ? Math.ceil(numericAmount / paymentCount) : 0),
    [numericAmount, paymentCount],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericAmount) { setError("Ingresa un monto mayor a $0."); return; }
    if (!cardId) { setError("Selecciona una tarjeta de crédito."); return; }
    if (isSaving) return;

    setError("");
    setIsSaving(true);
    try {
      const card = (cards ?? []).find((c) => c.id === cardId);
      const categoryName = (categories ?? []).find((c) => c.id === categoryId)?.name ?? "";
      const meta = KIND_META.installments;

      await createTransaction({
        // Usamos cardId como accountId (la transacción pertenece a la tarjeta)
        accountId: cardId,
        amount: numericAmount,
        description: description.trim() || "Compra a meses",
        category: categoryName,
        date: purchaseDate,
        paymentDate: purchaseDate,
        kind: "installments",
        iconKind: meta.iconKind,
        iconBackground: meta.iconBackground,
        iconColor: meta.iconColor,
        note: [
          `${paymentCount} pagos de $${monthlyPayment.toLocaleString("es-CL")}`,
          buyNowPayLater ? "Compra ahora, paga después" : "",
        ].filter(Boolean).join(" · "),
        statusLabel: meta.statusLabel,
      });

      // Incrementar el balance (deuda) de la tarjeta
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
          <AmountSection value={amount} onChange={(v) => { setAmount(v); setError(""); }} />

          <section className="mt-8">
            <FormTextField
              id="description"
              label="Descripción"
              icon={<SquarePen size={16} />}
              value={description}
              onChange={setDescription}
            />
            <FormSelectField
              id="category"
              label="Categoría"
              icon={<Layers size={16} />}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Selecciona categoría"
              options={categoryOptions}
            />
            <FormSelectField
              id="card"
              label="Tarjeta de crédito"
              icon={<CreditCard size={16} />}
              value={cardId}
              onChange={(v) => { setCardId(v); setError(""); }}
              placeholder="Selecciona cuenta"
              options={cardOptions}
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
                      onChange={(e) => setPayments(sanitizeNumericInput(e.target.value, "integer"))}
                      onBlur={() => setPayments((v) => normalizeNumericBlurValue(v, "integer") || "1")}
                      style={{ width: getNumericInputWidth(payments, 2) }}
                      className="type-body min-w-[2ch] border-0 bg-transparent p-0 font-medium text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Mensualidad</FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-white/55"><AlignJustify size={16} /></span>
                    <span className="type-body font-medium text-[var(--text-primary)]">
                      ${monthlyPayment.toLocaleString("es-CL")}
                    </span>
                  </div>
                </div>
              </div>
            </FieldRow>

            <FormDateField id="purchase-date" label="Fecha de compra" value={purchaseDate} onChange={setPurchaseDate} />

            <FormToggleRow
              label="Compra ahora y paga después"
              description="Asigna una fecha para comenzar a pagar"
              checked={buyNowPayLater}
              onChange={setBuyNowPayLater}
            />
          </section>

          {error ? (
            <p className="mt-3 text-center text-[0.8rem] text-[#f55a3d]">{error}</p>
          ) : null}
        </FormScrollBody>

        <SaveButton isSaving={isSaving} />
      </form>
    </TransactionFormLayout>
  );
}
