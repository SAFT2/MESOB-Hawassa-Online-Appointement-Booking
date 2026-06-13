import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Loader2, CalendarCheck, Clock, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import BrandHeader from "@/components/BrandHeader";
import FeedbackForm from "@/components/FeedbackForm";

type Status = "pending" | "served" | "no_show" | "cancelled";

interface Appointment {
  id: string;
  reference: string;
  appointment_date: string;
  slot_window: "AM" | "PM";
  queue_number: number;
  status: Status;
  service_id: string;
  served_by: string | null;
  has_feedback: boolean;
  service_name: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: any }> = {
  pending:   { label: "Waiting",   color: "bg-amber-100 text-amber-700",   icon: Clock },
  served:    { label: "Served",    color: "bg-emerald-100 text-emerald-700", icon: CalendarCheck },
  no_show:   { label: "No-show",   color: "bg-slate-100 text-slate-600",   icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-rose-100 text-rose-700",     icon: XCircle },
};

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  const load = async () => {
    if (!user) return;
    setLoading(true);

    // Load appointments with service name
    const { data: appts, error } = await supabase
      .from("appointments")
      .select(`
        id, reference, appointment_date, slot_window,
        queue_number, status, service_id, served_by,
        services ( name )
      `)
      .eq("user_id", user.id)
      .order("appointment_date", { ascending: false });

    if (error) { setLoading(false); return; }

    // Check which appointments already have feedback
    const ids = (appts ?? []).map((a: any) => a.id);
    const { data: feedbackData } = await supabase
      .from("feedback")
      .select("appointment_id")
      .in("appointment_id", ids.length > 0 ? ids : ["none"]);

    const feedbackSet = new Set(
      (feedbackData ?? []).map((f: any) => f.appointment_id)
    );

    setAppointments(
      (appts ?? []).map((a: any) => ({
        ...a,
        service_name: a.services?.name ?? "Unknown service",
        has_feedback: feedbackSet.has(a.id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleFeedbackSubmitted = (appointmentId: string) => {
    setFeedbackGiven((prev) => new Set([...prev, appointmentId]));
  };

  const pendingFeedback = appointments.filter(
    (a) => a.status === "served" && !a.has_feedback && !feedbackGiven.has(a.id)
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <BrandHeader />

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View your booking history and leave feedback after being served.
          </p>
        </div>

        {/* Pending Feedback Banner */}
        {pendingFeedback.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              ⭐ You have {pendingFeedback.length} appointment{pendingFeedback.length > 1 ? "s" : ""} waiting for your feedback
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Scroll down to rate your experience.
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium text-foreground">No appointments yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your booking history will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => {
              const config = STATUS_CONFIG[appt.status];
              const StatusIcon = config.icon;
              const canFeedback =
                appt.status === "served" &&
                appt.served_by &&
                !appt.has_feedback &&
                !feedbackGiven.has(appt.id);
              const alreadyRated =
                appt.has_feedback || feedbackGiven.has(appt.id);

              return (
                <div key={appt.id} className="rounded-xl border bg-card p-4 space-y-4">
                  {/* Appointment Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        {appt.service_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {DateTime.fromISO(appt.appointment_date).toFormat("DDDD")}
                        {" · "}
                        {appt.slot_window === "AM" ? "☀ Morning" : "🌙 Afternoon"}
                        {" · "}
                        Queue #{appt.queue_number}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        Ref: {appt.reference}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium flex items-center gap-1 shrink-0 ${config.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>

                  {/* Feedback Form — only shown if served and no feedback yet */}
                  {canFeedback && user && (
                    <FeedbackForm
                      appointmentId={appt.id}
                      agentId={appt.served_by!}
                      serviceId={appt.service_id}
                      citizenId={user.id}
                      serviceName={appt.service_name}
                      onSubmitted={() => handleFeedbackSubmitted(appt.id)}
                    />
                  )}

                  {/* Already rated message */}
                  {appt.status === "served" && alreadyRated && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-700 font-medium">
                      ✓ You have rated this appointment — thank you!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}