import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Language = "en" | "am";

interface LanguageContextValue {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    app_name: "MESOB Hawassa",
    app_tagline: "Government Service Appointments",
    nav_home: "Home",
    nav_book: "Book",
    nav_lookup: "Lookup",
    nav_history: "My Appointments",
    nav_sign_in: "Sign in",
    nav_sign_out: "Sign out",
    nav_admin: "Admin",
    nav_staff: "Staff",
  },
  am: {
    app_name: "ሜሶብ ሐዋሳ",
    app_tagline: "የመንግስት አገልግሎት ቀጠሮ",
    nav_home: "ዋና",
    nav_book: "ቀጠሮ",
    nav_lookup: "ፈልግ",
    nav_history: "የኔ ቀጠሮዎች",
    nav_sign_in: "ግባ",
    nav_sign_out: "ውጣ",
    nav_admin: "አስተዳደር",
    nav_staff: "ሠራተኛ",
  },
};

const LANGUAGE_STORAGE_KEY = "mesob-lang";

function getInitialLang(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  return saved === "am" ? "am" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(getInitialLang);

  const toggleLang = () => {
    setLang((current) => {
      const next = current === "en" ? "am" : "en";
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      return next;
    });
  };

  const t = (key: string) => {
    return TRANSLATIONS[lang][key] ?? key;
  };

  const value = useMemo(
    () => ({ lang, toggleLang, t }),
    [lang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
