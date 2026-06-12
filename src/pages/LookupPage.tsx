import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { Loader2, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BrandHeader from "@/components/BrandHeader";
import { supabase } from "@/integrations/supabase/client";

type Status = "pending" | "served" | "cancelled" | "no_show";

const STATUS_STYLES: Record<Status, string> = {
  pending:   "bg-amber-100 text-amber-800 border-amber-200",
  served:    "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  no_show:   "bg-slate-100 text-slate-700 border-slate-200",
};

export default function LookupPage() {
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [appt, setAppt] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ref.trim()) return;
    setLoading(true); setError(null); setAppt(null);
    const { data, error } = await supabase.rpc("lookup_appointment", { _ref: ref.trim() });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data || data.length === 0) { setError("No appointment found with that reference."); return; }
    setAppt(data[0]);
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <BrandHeader />

      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Look up your appointment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your reference number exactly as it appears on your confirmation.
        </p>

        <form onSubmit={lookup} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="ref">Reference number</Label>
            <Input
              id="ref"
              value={ref}
              onChange={(e) => setRef(e.target.value.toUpperCase().trim())}
              placeholder="HWS-YYYYMMDD-AM-…"
              className="mt-1 font-mono"
            />
          </div>
          <Button type="submit" disabled={loading || !ref.trim()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Look up
          </Button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {appt && (
          <div className="mt-8 rounded-xl border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Reference</p>
                <p className="font-mono text-lg font-bold text-foreground break-all">{appt.reference}</p>
              </div>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                STATUS_STYLES[appt.status as Status] ?? STATUS_STYLES.pending
              }`}>
                {String(appt.status).replace("_", " ")}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground">Citizen</p>
                <p className="font-medium text-foreground">{appt.full_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Queue number</p>
                <p className="font-medium text-foreground">#{appt.queue_number} ({appt.slot_window})</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">
                  {DateTime.fromISO(appt.appointment_date).toFormat("DDDD")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Institution</p>
                <p className="font-medium text-foreground">{appt.institution_name}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Service</p>
                <p className="font-medium text-foreground">{appt.service_name}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
