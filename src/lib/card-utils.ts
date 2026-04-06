export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);
}

export function isValidLuhn(cardNumber: string): boolean {
  if (!cardNumber || cardNumber.length < 16) return false;

  let sum = 0;
  let isEven = false;

  // Luhn proverka
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}
