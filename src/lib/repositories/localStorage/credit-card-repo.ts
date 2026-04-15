import { DEFAULT_CURRENCY_CODE } from "@/lib/currency";
import type { CreditCard, CurrencyCode, PaymentScheduleMode } from "@/lib/models";
import type { ICreditCardRepository } from "@/lib/repositories/interfaces";

const STORAGE_KEY = "cgapp_credit_cards_v1";

type StoredCreditCard = Omit<CreditCard, "currencyCode" | "paymentScheduleMode"> & {
  currencyCode?: CurrencyCode;
  paymentScheduleMode?: PaymentScheduleMode;
};

function normalizeCard(card: StoredCreditCard): CreditCard {
  return {
    ...card,
    currencyCode: card.currencyCode ?? DEFAULT_CURRENCY_CODE,
    paymentScheduleMode: card.paymentScheduleMode ?? "manual",
    // Campos opcionales de modo automático — se preservan tal cual si existen
    autoPayFromAccountId: card.autoPayFromAccountId,
    autoPayAmountMode: card.autoPayAmountMode,
    autoPayFixedAmount: card.autoPayFixedAmount,
    autoPayScheduleDay: card.autoPayScheduleDay,
    autoPayReminderEnabled: card.autoPayReminderEnabled,
    autoPayReminderHour: card.autoPayReminderHour,
    autoPayReminderMinute: card.autoPayReminderMinute,
    autoPayCashbackCountsAsPayment: card.autoPayCashbackCountsAsPayment,
  };
}

function readAll(): CreditCard[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as StoredCreditCard[]).map(normalizeCard);
  } catch {
    return [];
  }
}

function writeAll(cards: CreditCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export class LocalStorageCreditCardRepository implements ICreditCardRepository {
  async getAll(): Promise<CreditCard[]> {
    return readAll();
  }

  async getById(id: string): Promise<CreditCard | null> {
    return readAll().find((c) => c.id === id) ?? null;
  }

  async create(data: Omit<CreditCard, "id" | "createdAt">): Promise<CreditCard> {
    const cards = readAll();
    const card: CreditCard = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    writeAll([...cards, card]);
    return card;
  }

  async update(
    id: string,
    data: Partial<Omit<CreditCard, "id" | "createdAt">>,
  ): Promise<CreditCard> {
    const cards = readAll();
    const index = cards.findIndex((c) => c.id === id);
    if (index === -1) throw new Error(`CreditCard ${id} not found`);
    const updated: CreditCard = { ...cards[index], ...data };
    cards[index] = updated;
    writeAll(cards);
    return updated;
  }

  async delete(id: string): Promise<void> {
    writeAll(readAll().filter((c) => c.id !== id));
  }
}
