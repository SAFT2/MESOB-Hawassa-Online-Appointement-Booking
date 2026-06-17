import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, LayoutDashboard, User as UserIcon, Sun, Moon, Languages, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function BrandHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const isStaff = user?.role === "admin" || user?.role === "agent";

  return (
    <header className="bg-brand-gradient text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 backdrop-blur text-white font-bold ring-1 ring-white/25">
            M
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight">{t("app_name")}</p>
            <p className="text-[11px] text-white/80">{t("app_tagline")}</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1.5">
          <Link to="/" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">{t("nav_home")}</Link>
          <Link to="/book" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">{t("nav_book")}</Link>
          <Link to="/lookup" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">{t("nav_lookup")}</Link>
          {user && !isStaff && (
            <Link to="/history" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">{t("nav_history")}</Link>
          )}

          {/* Language toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleLang}
            title={lang === "en" ? "Switch to Amharic" : "Switch to English"}
            className="text-white/90 hover:text-white hover:bg-white/15"
          >
            <Languages className="h-4 w-4" />
            <span className="ml-1 text-xs font-semibold">{lang === "en" ? "AM" : "EN"}</span>
          </Button>

          {/* Theme toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="text-white/90 hover:text-white hover:bg-white/15"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {!user && (
            <Link to="/login">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <LogIn className="mr-1.5 h-4 w-4" /> {t("nav_sign_in")}
              </Button>
            </Link>
          )}
          {user && (
            <div className="flex items-center gap-2">
              {isStaff && (
                <Link to="/admin/dashboard">
                  <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25 border-white/20">
                    <LayoutDashboard className="mr-1.5 h-4 w-4" /> {user.role === "admin" ? t("nav_admin") : t("nav_staff")}
                  </Button>
                </Link>
              )}
              {!isStaff && (
                <Link to="/history" className="sm:hidden">
                  <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25 border-white/20">
                    <History className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <span className="hidden items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white sm:inline-flex">
                <UserIcon className="h-3.5 w-3.5" />
                {user.full_name || user.email}
              </span>
              <Button
                size="sm"
                onClick={() => logout()}
                className="bg-white/15 text-white hover:bg-white/25 border border-white/20"
              >
                <LogOut className="mr-1.5 h-4 w-4" /> {t("nav_sign_out")}
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
