export const ERROR_MESSAGES: Record<number, string> = {
  // Common / Card Bind
  32717: "Karta muvaffaqiyatli bog'landi (SMS ulandi).",
  32718: "Karta topilmadi yoki raqam formati noto'g'ri.",

  // Transfer Create
  32707: "Faqat ruxsat etilgan valyutalar (UZS, USD) bilan ishlash mumkin.",
  32704: "Karta amal qilish muddati noto'g'ri kiritilgan.",
  32720: "Karta amal qilish muddati tugagan.",
  32705: "Karta faol holatda emas.",
  32722: "Ushbu kartaga telefon raqami biriktirilmagan.",
  32703: "SMS xizmati ulanmagan.",
  32716: "Karta vaqtincha bloklangan. Iltimos, keyinroq urinib ko'ring.",
  32702: "Hisobda mablag' yetarli emas.",
  32723: "Xavfsizlik choralari sababli 60 soniya ichida qayta o'tkazma amalga oshirib bo'lmaydi.",

  // Transfer Confirm
  32712: "Tasdiqlash kodi noto'g'ri.",
  32710: "OTP kodning amal qilish muddati tugagan.",
  32711: "Xato urinishlar soni tugadi. Karta 2 daqiqaga bloklandi.",

  // Resend OTP
  32706: "Tranzaksiya allaqachon yakunlangan yoki yopilgan.",

  // Transfer Cancel
  32715: "O'tkazma muvaffaqiyatli bekor qilindi va mablag' qaytarildi.",
  32713: "Bekor qilish muddati (60 soniya) o'tib ketgan.",
  32719: "Mablag' qabul qiluvchi tomonidan ishlatib yuborilgan, bekor qilib bo'lmaydi.",
};

export const getErrorMessage = (code: number, serverMessage?: string) => {
  const defaultFallback = "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.";
  if (serverMessage && serverMessage !== defaultFallback) {
    return serverMessage;
  }
  return ERROR_MESSAGES[code] || serverMessage || defaultFallback;
};
