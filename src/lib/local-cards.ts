import { Card, Transaction } from "@/types";
import { api } from "@/lib/api";

const CARDS_KEY = "bound_cards";
const TX_KEY = "local_transactions";

function detectCardType(cardNumber: string): string {
  const bin = cardNumber.replace(/\s/g, "").slice(0, 4);
  if (bin === "8600" || bin === "5614") return "Uzcard";
  if (bin === "9860") return "Humo";
  return "Visa";
}

export function removeCard(cardNumber: string) {
  if (typeof window === "undefined") return;
  const cards = getLocalCards();
  const filtered = cards.filter(c => c.number.replace(/\s/g, "") !== cardNumber.replace(/\s/g, ""));
  localStorage.setItem(CARDS_KEY, JSON.stringify(filtered));
}

export function updateCardStatus(cardNumber: string, status: "active" | "blocked" | "deleted") {
  if (typeof window === "undefined") return;
  const cards = getLocalCards();
  const normalized = cardNumber.replace(/\s/g, "");
  const cardToUpdate = cards.find(c => c.number.replace(/\s/g, "") === normalized);
  if (cardToUpdate) {
    cardToUpdate.status = status;
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }
}

export function saveCard(cardNumber: string, phone: string | null, balance: string = "—", expire?: string | null, owner?: string | null): void {
  const stored = getLocalCards();
  const normalized = cardNumber.replace(/\s/g, "");
  const formatted = normalized.replace(/(\d{4})(?=\d)/g, "$1 ");

  // Check if card exists
  const existingIndex = stored.findIndex(
    (c) => c.number.replace(/\s/g, "") === normalized
  );

  if (existingIndex !== -1) {
    // Update existing card
    stored[existingIndex].balance = balance;
    if (phone) stored[existingIndex].phone = phone;
    if (expire) stored[existingIndex].expire = expire;
    if (owner) stored[existingIndex].owner = owner;
  } else {
    const newCard: Card = {
      number: formatted,
      balance,
      cardName: "Bank karta",
      type: detectCardType(normalized),
      phone: phone || "",
      expire: expire || undefined,
      owner: owner || undefined,
    };
    stored.push(newCard);
  }

  localStorage.setItem(CARDS_KEY, JSON.stringify(stored));
}

export function getLocalCards(): Card[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CARDS_KEY);
    return raw ? (JSON.parse(raw) as Card[]) : [];
  } catch {
    return [];
  }
}

export async function updateLocalBalances(): Promise<void> {
  const stored = getLocalCards();
  if (stored.length === 0) return;

  const cardsToRemove: string[] = [];

  const updatePromises = stored.map(async (card) => {
    try {
      const normalizedNumber = card.number.replace(/\s/g, "");
      const res = await api.cardInfo({
        card_number: normalizedNumber,
      });

      card.balance = `${res.balance.toLocaleString('ru-RU')} UZS`;
      card.type = res.card_type;
      card.owner = res.owner_name;
      card.status = res.status as "active" | "blocked" | "deleted";
      card.expire = res.expiry_date;
    } catch (err: any) {
      console.error(`Failed to update info for card ${card.number}`, err);

      const errorMessage = err?.message || "";
      if (err?.code === 32701 ||
        err?.code === 32766 ||
        errorMessage.includes("allaqachon o'chirigan") ||
        errorMessage.includes("Карта неактивна")) {
        cardsToRemove.push(card.number.replace(/\s/g, ""));
        return;
      }

      if (err?.code === 32704) {
        card.status = "blocked";
      }
      card.balance = "—";
    }
  });

  await Promise.allSettled(updatePromises);

  if (cardsToRemove.length > 0) {
    const finalStored = stored.filter(card =>
      !cardsToRemove.includes(card.number.replace(/\s/g, ""))
    );
    localStorage.setItem(CARDS_KEY, JSON.stringify(finalStored));
  } else {
    localStorage.setItem(CARDS_KEY, JSON.stringify(stored));
  }
}


export function saveLocalTransaction(tx: Transaction) {
  if (typeof window === "undefined") return;
  const existing = getLocalTransactions();
  // Avoid duplicates by checking ext_id if available
  if (tx.ext_id && existing.some(t => t.ext_id === tx.ext_id)) return;

  const updated = [tx, ...existing].slice(0, 20);
  localStorage.setItem(TX_KEY, JSON.stringify(updated));
}

export function getLocalTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeLocalTransaction(ext_id: string) {
  if (typeof window === "undefined") return;
  const existing = getLocalTransactions();
  const filtered = existing.filter(t => t.ext_id !== ext_id);
  localStorage.setItem(TX_KEY, JSON.stringify(filtered));
}

export function removeLocalTransactionById(id: number) {
  if (typeof window === "undefined") return;
  const existing = getLocalTransactions();
  const filtered = existing.filter(t => t.id !== id);
  localStorage.setItem(TX_KEY, JSON.stringify(filtered));
}

export function updateLocalTransactionStatus(ext_id: string, status: string, newTitle?: string) {
  if (typeof window === "undefined") return;
  const existing = getLocalTransactions();
  const updated = existing.map(t =>
    t.ext_id === ext_id
      ? { ...t, status, title: newTitle || t.title }
      : t
  );
  localStorage.setItem(TX_KEY, JSON.stringify(updated));
}
