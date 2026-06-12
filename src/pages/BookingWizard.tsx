import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Printer, RotateCcw, ArrowLeft, ArrowRight,
  Calendar, Loader2, Sun, Moon, LogIn, CheckCircle2, Circle,
} from "lucide-react";
import StepIndicator from "@/components/StepIndicator";
import BrandHeader from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const STEPS = ["Services", "Date & Window", "Your Info", "Confirmation"];

interface Institution { id: string; code: string; name: string; }
interface Service {
  id: string; institution_id: string; name: string;
  description: string | null; estimated_duration_min: number;
  am_capacity: number; pm_capacity: number;
}
interface BookingResult {
  reference: string;
  queue_number: number;
  slot_window: "AM" | "PM";
  appointment_date: string;
  service_name: string;
  full_name: string;
}

type Win = "AM" | "PM";

export default function BookingWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [instId, setInstId] = useState<string>("");
  // Multi-select: a Set of selected service IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [date, setDate] = useState("");
  const [win, setWin] = useState<Win | "">("");

  const [form, setForm] = useState({ full_name: "", phone: "", national_id: "" });
  const [submitting, setSubmitting] = useState(false);
  // One result per service booked
  const [confirmations, setConfirmations] = useState<BookingResult[]>([]);

  useEffect(() => {
    supabase.from("institutions").select("id, code, name").eq("active", true).order("name")
      .then(({ data }) => setInstitutions(data ?? []));
    supabase.from("services").select("*").eq("active", true)
      .then(({ data }) => setServices((data ?? []) as Service[]));
  }, []);

  useEffect(() => {
    if (user) {
      setForm((f) => ({
        full_name: f.full_name || user.full_name || "",
        phone: f.phone,
        national_id: f.national_id,
      }));
    }
  }, [user]);

  const minDate = DateTime.now().setZone("Africa/Addis_Ababa").toISODate()!;
  const maxDate = DateTime.now().setZone("Africa/Addis_Ababa").plus({ days: 14 }).toISODate()!;

  const instServices = useMemo(
    () => services.filter((s) => s.institution_id === instId),
    [services, instId]
  );

  const selectedServices = useMemo(
    () => instServices.filter((s) => selectedIds.has(s.id)),
    [instServices, selectedIds]
  );

  const toggleService = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const changeInstitution = (id: string) => {
    setInstId(id);
    setSelectedIds(new Set()); // clear selections when institution changes
  };

  const canNext = () => {
    if (step === 0) return !!instId && selectedIds.size > 0;
    if (step === 1) return !!date && !!win;
    if (step === 2)
      return (
        form.full_name.trim().length >= 2 &&
        /^\+?\d[\d\s-]{7,}$/.test(form.phone.trim()) &&
        form.national_id.trim().length >= 4
      );
    return true;
  };

  const submit = async () => {
    if (!user) {
      toast.error("Please sign in to confirm your booking.");
      return;
    }
    setSubmitting(true);

    const results: BookingResult[] = [];
    const failures: string[] = [];

    for (const svc of selectedServices) {
      try {
        const { data, error } = await supabase.rpc("book_appointment", {
          _institution_id: instId,
          _service_id: svc.id,
          _full_name: form.full_name.trim(),
          _phone: form.phone.trim(),
          _national_id: form.national_id.trim(),
          _date: date,
          _window: win as Win,
        });
        if (error) throw error;
        results.push({
          reference: data.reference,
          queue_number: data.queue_number,
          slot_window: data.slot_window,
          appointment_date: data.appointment_date,
          service_name: svc.name,
          full_name: data.full_name,
        });
      } catch (err: any) {
        failures.push(`${svc.name}: ${err?.message || "booking failed"}`);
      }
    }

    setSubmitting(false);

    if (results.length > 0) {
      setConfirmations(results);
      setStep(3);
      if (failures.length > 0) {
        // Some succeeded, some failed — show partial warning
        toast.warning(
          `${results.length} service(s) booked. ${failures.length} could not be booked: ${failures.join("; ")}`
        );
      }
    } else {
      // All failed
      toast.error(failures.join("; "));
    }
  };

  const reset = () => {
    setStep(0);
    setInstId("");
    setSelectedIds(new Set());
    setDate("");
    setWin("");
    setForm({ full_name: user?.full_name || "", phone: "", national_id: "" });
    setConfirmations([]);
  };

  // Total estimated time across selected services
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.estimated_duration_min, 0),
    [selectedServices]
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <BrandHeader />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Book an appointment
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select one or more services — you'll get a separate queue number for each.
          </p>
        </div>

        <div className="mb-8 rounded-xl border bg-card p-4 sm:p-6">
          <StepIndicator steps={STEPS} current={step} />
        </div>

        <div className="rounded-xl border bg-card p-4 sm:p-6">

          {/* ── Step 0: Institution + multi-service select ── */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Choose institution & services
                </h2>
                <p className="text-sm text-muted-foreground">
                  Pick a bureau, then select all the services you need today.
                </p>
              </div>

              {/* Institution picker */}
              <div className="max-w-sm">
                <Label>Institution</Label>
                <Select value={instId} onValueChange={changeInstitution}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select an institution…" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Service checkboxes */}
              {instId && (
                <div className="space-y-2">
                  <Label>
                    Services available
                    {selectedIds.size > 0 && (
                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {selectedIds.size} selected
                      </span>
                    )}
                  </Label>

                  {instServices.length === 0 && (
                    <p className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
                      No active services at this institution.
                    </p>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {instServices.map((svc) => {
                      const checked = selectedIds.has(svc.id);
                      return (
                        <button
                          key={svc.id}
                          type="button"
                          onClick={() => toggleService(svc.id)}
                          className={cn(
                            "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                            checked
                              ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                              : "border-border hover:border-primary/40 hover:bg-muted/30"
                          )}
                        >
                          {checked
                            ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            : <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/40" />
                          }
                          <div className="min-w-0">
                            <p className={cn(
                              "font-medium leading-snug",
                              checked ? "text-primary" : "text-foreground"
                            )}>
                              {svc.name}
                            </p>
                            {svc.description && (
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {svc.description}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              ~{svc.estimated_duration_min} min
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summary of selected */}
              {selectedIds.size > 0 && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="font-medium text-foreground">
                    {selectedIds.size} service{selectedIds.size > 1 ? "s" : ""} selected
                    · ~{totalDuration} min total
                  </p>
                  <ul className="mt-1.5 space-y-0.5">
                    {selectedServices.map((s) => (
                      <li key={s.id} className="text-muted-foreground flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-primary inline-block" />
                        {s.name}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    You'll receive a separate queue number for each service.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Date + window ── */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Pick a date and window
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose any day in the next 14 days. You'll be assigned a queue
                  number per service — no exact time needed.
                </p>
              </div>
              <div className="max-w-sm">
                <Label htmlFor="date">Appointment date</Label>
                <div className="relative mt-1">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="date" type="date" min={minDate} max={maxDate}
                    value={date} onChange={(e) => setDate(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <Label>Window</Label>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {[
                    { v: "AM" as Win, label: "Morning", time: "9:00 – 12:00", Icon: Sun },
                    { v: "PM" as Win, label: "Afternoon", time: "1:00 – 5:00", Icon: Moon },
                  ].map(({ v, label, time, Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setWin(v)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                        win === v
                          ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Icon className={cn("h-6 w-6", win === v ? "text-primary" : "text-muted-foreground")} />
                      <div>
                        <p className="font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{time}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Personal details ── */}
          {step === 2 && (
            <div className="max-w-lg space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Your details</h2>
                <p className="text-sm text-muted-foreground">
                  We use these to identify you at the office.
                </p>
              </div>
              {!user && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-accent bg-accent/10 p-3 text-sm">
                  <span className="text-accent-foreground">
                    You need an account to confirm your booking.
                  </span>
                  <Link to="/login">
                    <Button size="sm">
                      <LogIn className="mr-1.5 h-4 w-4" /> Sign in
                    </Button>
                  </Link>
                </div>
              )}
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name" value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="e.g. Abebe Bekele"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+251 9XX XXX XXX"
                  />
                </div>
                <div>
                  <Label htmlFor="nid">National ID</Label>
                  <Input
                    id="nid" value={form.national_id}
                    onChange={(e) => setForm({ ...form, national_id: e.target.value })}
                    placeholder="FAN / National ID number"
                  />
                </div>
              </div>

              {/* Booking summary before confirming */}
              <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
                <p className="font-medium text-foreground">Booking summary</p>
                <p className="text-muted-foreground">
                  {DateTime.fromISO(date).toFormat("DDDD")} · {win === "AM" ? "Morning (9–12)" : "Afternoon (1–5)"}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {selectedServices.map((s) => (
                    <li key={s.id} className="text-muted-foreground flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-primary inline-block" />
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 3 && confirmations.length > 0 && (
            <div className="space-y-6 print:space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center">
                <p className="text-sm font-medium text-primary">
                  {confirmations.length} appointment{confirmations.length > 1 ? "s" : ""} confirmed
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Save these reference numbers — you'll need them at the office.
                </p>
              </div>

              {/* One card per booked service */}
              <div className="grid gap-4 sm:grid-cols-2">
                {confirmations.map((c, i) => (
                  <div
                    key={c.reference}
                    className="rounded-xl border bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground leading-snug">
                        {c.service_name}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 shrink-0">
                        Confirmed
                      </span>
                    </div>

                    <div className="rounded-lg bg-muted/50 px-3 py-2 text-center">
                      <p className="text-xs text-muted-foreground">Reference</p>
                      <p className="mt-0.5 font-mono text-lg font-bold tracking-tight text-foreground">
                        {c.reference}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        Queue #{c.queue_number} · {c.slot_window}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      {DateTime.fromISO(c.appointment_date).toFormat("DDDD")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Citizen info */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Citizen</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {confirmations[0].full_name}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {DateTime.fromISO(confirmations[0].appointment_date).toFormat("DDDD")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 print:hidden">
                <Button onClick={() => window.print()} variant="outline">
                  <Printer className="mr-2 h-4 w-4" /> Print this page
                </Button>
                <Button onClick={reset}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Book another appointment
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 2 && (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={submit}
                disabled={!canNext() || submitting || !user}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking {selectedIds.size} service{selectedIds.size > 1 ? "s" : ""}…
                  </>
                ) : (
                  <>
                    Confirm {selectedIds.size} booking{selectedIds.size > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
