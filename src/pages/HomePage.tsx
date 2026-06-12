import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import BrandHeader from "@/components/BrandHeader";
import { CalendarPlus, Search, Clock, Building2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Institution {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export default function HomePage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    supabase
      .from("institutions")
      .select("id, code, name, description")
      .eq("active", true)
      .order("name")
      .then(({ data }) => setInstitutions(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <BrandHeader />

      <main>
        {/* Hero */}
        <section
          className="relative h-[78vh] min-h-[520px] w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.55)), url('https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=2000&q=70')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5" /> Official MESOB Hawassa portal
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">
              Skip the queue.
              <br />
              <span className="text-accent">Book your visit in minutes.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base sm:text-lg text-white/90">
              Reserve appointments across multiple government bureaus in Hawassa — pick a
              date and a window, get a reference number, show up and be served.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/book">
                <Button size="lg" className="h-12 px-6 text-base bg-accent text-accent-foreground hover:bg-accent/90">
                  <CalendarPlus className="mr-2 h-5 w-5" /> Book an Appointment
                </Button>
              </Link>
              <Link to="/lookup">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-6 text-base border-white/70 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                >
                  <Search className="mr-2 h-5 w-5" /> Look up Reference
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y bg-card">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3">
            {[
              { icon: Clock, title: "Pick a date & window", desc: "Choose any day and AM/PM. We assign your queue number automatically." },
              { icon: Building2, title: "Multiple bureaus", desc: "Bundle services across several offices in one trip." },
              { icon: ShieldCheck, title: "Secure & official", desc: "Backed by MESOB Hawassa with verified citizen accounts." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-background p-5 transition-shadow hover:shadow-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Institutions */}
        <section className="bg-brand-gradient text-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-accent">Participating Institutions</h2>
              <p className="mt-3 text-white/85">
                These bureaus offer their services through MESOB Hawassa.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {institutions.map((i) => (
                <div key={i.id} className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent">{i.code}</p>
                  <h3 className="mt-1 text-lg font-bold">{i.name}</h3>
                  {i.description && <p className="mt-2 text-sm text-white/85">{i.description}</p>}
                </div>
              ))}
              {institutions.length === 0 && (
                <p className="col-span-full text-center text-white/75">No institutions yet.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-white/80">
          © {new Date().getFullYear()} MESOB Hawassa — Government Service Booking
        </div>
      </footer>
    </div>
  );
}
