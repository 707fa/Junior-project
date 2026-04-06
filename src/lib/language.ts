export type SupportedLang = "ru" | "uz" | "en";

export function getLanguage(): SupportedLang {
  if (typeof window === "undefined") return "ru";
  return (localStorage.getItem("app_lang") as SupportedLang) || "ru";
}

export function setLanguage(lang: SupportedLang) {
  if (typeof window !== "undefined") {
    localStorage.setItem("app_lang", lang);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}
