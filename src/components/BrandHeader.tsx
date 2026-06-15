import { Link } from "@tanstack/react-router";
import { LogIn, LogOut, LayoutDashboard, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import CitizenChatWidget from "@/components/CitizenChatWidget";

export default function BrandHeader() {
  const { user, logout } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "agent";

  return (
    <header className="bg-brand-gradient text-white shadow">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/15 backdrop-blur text-white font-bold ring-1 ring-white/25">
            M
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight">MESOB Hawassa</p>
            <p className="text-[11px] text-white/80">Government Service Appointments</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">Home</Link>
          <Link to="/book" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">Book</Link>
         <Link to="/lookup" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">Lookup</Link>
          {user && !isStaff && (
            <Link to="/my-appointments" className="hidden sm:inline-block px-3 py-1.5 text-sm font-semibold text-white/90 hover:text-white">My Appointments</Link>
          )}

          {!user && (
            <Link to="/login">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <LogIn className="mr-1.5 h-4 w-4" /> Sign in
              </Button>
            </Link>
          )}
          {user && (
            <div className="flex items-center gap-2">
              {isStaff && (
                <Link to="/admin/dashboard">
                  <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25 border-white/20">
                    <LayoutDashboard className="mr-1.5 h-4 w-4" /> {user.role === "admin" ? "Admin" : "Staff"}
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
                <LogOut className="mr-1.5 h-4 w-4" /> Sign out
              </Button>
            </div>
          )}
        </nav>
      </div>
      <CitizenChatWidget />
    </header>
  );
}
