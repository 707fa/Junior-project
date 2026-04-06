import { useState, useEffect } from "react";
import { getLanguage, SupportedLang } from "./language";

export const dictionary: Record<SupportedLang, Record<string, string>> = {
  ru: {
    cards_and_wallet: "Карты и кошелек",
    search_placeholder: "Поиск по номеру или телефону",
    no_cards_found: "Карты не найдены",
    add_card: "Добавить карту",
    transfer: "Перевод",
    latest_tx: "Последние операции",
    no_tx: "Операций пока нет",
    logout: "Выйти",
    cancel_tx: "Отменить перевод?",
    cancel_tx_desc: "Вы уверены, что хотите отменить перевод на сумму {amount}? Деньги будут возвращены на баланс.",
    no: "Нет",
    yes_cancel: "Да, отменить",
    card_blocked: "КАРТА ЗАБЛОКИРОВАНА",
    qr_pay: "QR-оплата",

    // Login
    login_title: "Вход",
    login_desc: "Пожалуйста, введите ваши данные для входа",
    first_name: "Имя *",
    last_name: "Фамилия *",
    phone_number: "Номер телефона *",
    login_btn: "Войти",

    // Forms generic
    loading: "Загрузка...",
    back: "Назад",
    confirm: "Подтвердить",
    cancel: "Отмена",
    code_from_sms: "Код из SMS",

    // Bind Card
    bind_card_title: "Привязка карты",
    card_number: "Номер карты",
    card_expire: "Срок действия",
    add_card_btn: "Добавить карту",
    invalid_bin: "Неверный формат",

    // Transfer
    transfer_title: "Перевод между картами",
    transfer_from: "ОТКУДА",
    transfer_to: "КУДА",
    transfer_amount: "Сумма",
    transfer_btn: "Перевести",
    receiver_card: "Номер карты получателя",
    transfer_my_card: "Моя карта",
    transfer_other_card: "Другая карта",
    transfer_no_other_cards: "Нет других привязанных карт",
    transfer_invalid_card: "Неверный номер карты.",
    transfer_same_card: "Нельзя перевести на ту же карту.",
    transfer_no_cards: "Нет привязанных карт. Пожалуйста, сначала добавьте карту.",
    transfer_success: "Перевод успешен!",
    transfer_to_home: "На главную",
    transfer_confirm_title: "Подтверждение перевода",
    transfer_sent_desc: "Мы отправили 6-значный код на ваш номер телефона.",
    transfer_cancel: "Отменить перевод",
    transfer_time_exp: "Время на отмену перевода истекло.",
    transfer_cancel_chance: "У вас есть возможность отменить перевод в течение {time} секунд.",
    transfer_resend: "Отправить код повторно",
    transfer_resend_in: "Отправить код повторно через: {time} сек",
  },
  uz: {
    cards_and_wallet: "Kartalar va hamyon",
    search_placeholder: "Raqam yoki telefon orqali qidirish",
    no_cards_found: "Kartalar topilmadi",
    add_card: "Karta qo'shish",
    transfer: "O'tkazma",
    latest_tx: "So'nggi operatsiyalar",
    no_tx: "Hozircha operatsiyalar yo'q",
    logout: "Chiqish",
    cancel_tx: "O'tkazmani bekor qilish?",
    cancel_tx_desc: "Haqiqatan ham {amount} miqdoridagi o'tkazmani bekor qilmoqchimisiz? Mablag'lar balansga qaytariladi.",
    no: "Yo'q",
    yes_cancel: "Ha, bekor qilish",
    card_blocked: "KARTA BLOKLANGAN",
    qr_pay: "QR-to'lov",

    login_title: "Kirish",
    login_desc: "Iltimos, kirish uchun ma'lumotlaringizni kiriting",
    first_name: "Ism *",
    last_name: "Familiya *",
    phone_number: "Telefon raqami *",
    login_btn: "Kirish",

    loading: "Yuklanmoqda...",
    back: "Orqaga",
    confirm: "Tasdiqlash",
    cancel: "Bekor qilish",
    code_from_sms: "SMS kod",

    bind_card_title: "Karta qo'shish",
    card_number: "Karta raqami",
    card_expire: "Amal qilish muddati",
    add_card_btn: "Kartani qo'shish",
    invalid_bin: "Noto'g'ri format",

    transfer_title: "Kartalararo o'tkazma",
    transfer_from: "QAYERDAN",
    transfer_to: "QAYERGA",
    transfer_amount: "Summa",
    transfer_btn: "O'tkazish",
    receiver_card: "Qabul qiluvchi karta raqami",
    transfer_my_card: "Mening kartam",
    transfer_other_card: "Boshqa karta",
    transfer_no_other_cards: "Boshqa bog'langan kartalar yo'q",
    transfer_invalid_card: "Noto'g'ri karta raqami.",
    transfer_same_card: "Bir xil kartaga o'tkazib bo'lmaydi.",
    transfer_no_cards: "Bog'langan kartalar yo'q. Iltimos, avval karta qo'shing.",
    transfer_success: "O'tkazma muvaffaqiyatli yakunlandi!",
    transfer_to_home: "Bosh sahifaga",
    transfer_confirm_title: "O'tkazmani tasdiqlash",
    transfer_sent_desc: "Telefon raqamingizga 6 xonali kod yubordik.",
    transfer_cancel: "O'tkazmani bekor qilish",
    transfer_time_exp: "O'tkazmani bekor qilish vaqti tugadi.",
    transfer_cancel_chance: "Sizda o'tkazmani bekor qilish uchun {time} soniya vaqt bor.",
    transfer_resend: "Kodni qayta yuborish",
    transfer_resend_in: "Kodni qayta yuborish: {time} soniya",
  },
  en: {
    cards_and_wallet: "Cards & Wallet",
    search_placeholder: "Search by number or phone",
    no_cards_found: "No cards found",
    add_card: "Add Card",
    transfer: "Transfer",
    latest_tx: "Latest Transactions",
    no_tx: "No transactions yet",
    logout: "Log out",
    cancel_tx: "Cancel transfer?",
    cancel_tx_desc: "Are you sure you want to cancel the transfer of {amount}? The money will be returned to the balance.",
    no: "No",
    yes_cancel: "Yes, cancel",
    card_blocked: "BLOCKED",
    qr_pay: "QR Payment",

    login_title: "Login",
    login_desc: "Please enter your details to login",
    first_name: "First Name *",
    last_name: "Last Name *",
    phone_number: "Phone Number *",
    login_btn: "Log in",

    loading: "Loading...",
    back: "Back",
    confirm: "Confirm",
    cancel: "Cancel",
    code_from_sms: "SMS Code",

    bind_card_title: "Bind Card",
    card_number: "Card Number",
    card_expire: "Expiry Date",
    add_card_btn: "Add Card",
    invalid_bin: "Invalid format",

    transfer_title: "Card Transfer",
    transfer_from: "FROM",
    transfer_to: "TO",
    transfer_amount: "Amount",
    transfer_btn: "Send",
    receiver_card: "Receiver Card Number",
    transfer_my_card: "My Card",
    transfer_other_card: "Other Card",
    transfer_no_other_cards: "No other linked cards",
    transfer_invalid_card: "Invalid card number.",
    transfer_same_card: "Cannot transfer to the same card.",
    transfer_no_cards: "No linked cards. Please add a card first.",
    transfer_success: "Transfer Successful!",
    transfer_to_home: "Home",
    transfer_confirm_title: "Confirm Transfer",
    transfer_sent_desc: "We have sent a 6-digit code to your phone number.",
    transfer_cancel: "Cancel Transfer",
    transfer_time_exp: "Transfer cancellation time has expired.",
    transfer_cancel_chance: "You can cancel the transfer within {time} seconds.",
    transfer_resend: "Resend Code",
    transfer_resend_in: "Resend code in: {time} sec",
  }
};

export function useTranslation() {
  const [lang, setLang] = useState<SupportedLang>("ru");

  useEffect(() => {
    setLang(getLanguage());
  }, []);

  return (key: keyof typeof dictionary["ru"], params?: Record<string, string>) => {
    let text = dictionary[lang]?.[key] || dictionary["ru"][key] || key;

    if (params) {
      Object.keys(params).forEach(pKey => {
        text = text.replace(`{${pKey}}`, params[pKey]);
      });
    }

    return text;
  };
}
