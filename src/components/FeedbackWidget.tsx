import { useState } from "react";
import { Star, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  appointmentId: string;
  institutionId: string;
  serviceId: string;
  serviceName: string;
  onDone: () => void;
}

const LABELS: Record<number, { en: string; am: string }> = {
  1: { en: "Very poor",  am: "በጣም መጥፎ" },
  2: { en: "Poor",       am: "መጥፎ" },
  3: { en: "Average",    am: "መካከለኛ" },
  4: { en: "Good",       am: "ጥሩ" },
  5: { en: "Excellent",  am: "በጣም ጥሩ" },
};

export default function FeedbackWidget({ appointmentId, institutionId, serviceId, serviceName, onDone }: Props) {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const [hovered, setHovered] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const t = (en: string, am: string) => lang === "am" ? am : en;

  const submit = async () => {
    if (!rating) return;
    setSaving(true);
    const { error } = await supabase.from("feedback").insert({
      appointment_id: appointmentId,
      user_id: user?.id,
      institution_id: institutionId,
      service_id: serviceId,
      rating,
      comment: comment.trim() || null,
    });
    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        toast.info(t("You have already submitted feedback for this appointment.", "ለዚህ ቀጠሮ አስተያየት አስገብተዋል።"));
        setDone(true);
      } else {
        toast.error(error.message);
      }
      return;
    }
    setDone(true);
    toast.success(t("Thank you for your feedback!", "አስተያየትዎን አመሰግናለን!"));
    setTimeout(onDone, 1200);
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
        <CheckCircle className="h-4 w-4" />
        {t("Feedback submitted — thank you!", "አስተያየት ተቀብለናል — አመሰግናለን!")}
      </div>
    );
  }

  const active = hovered || rating;

  return (
    <div className="mt-3 rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">
        {t(`How was the ${serviceName}?`, `${serviceName} አገልግሎቱ እንዴት ነበር?`)}
      </p>

      {/* Stars */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                n <= active
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground"
              }`}
            />
          </button>
        ))}
        {active > 0 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {LABELS[active][lang]}
          </span>
        )}
      </div>

      {/* Comment */}
      <Textarea
        placeholder={t("Optional comment…", "አስተያየት (አማራጭ)…")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        className="text-sm resize-none"
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone}>
          {t("Skip", "ዝለል")}
        </Button>
        <Button size="sm" disabled={!rating || saving} onClick={submit}>
          {saving ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : null}
          {t("Submit", "አስገባ")}
        </Button>
      </div>
    </div>
  );
}
