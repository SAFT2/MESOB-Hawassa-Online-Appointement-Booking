import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
  appointmentId: string;
  agentId: string;
  serviceId: string;
  citizenId: string;
  serviceName: string;
  onSubmitted: () => void;
}

export default function FeedbackForm({
  appointmentId,
  agentId,
  serviceId,
  citizenId,
  serviceName,
  onSubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hovered, setHovered] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a star rating.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      appointment_id: appointmentId,
      citizen_id: citizenId,
      agent_id: agentId,
      service_id: serviceId,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit feedback: " + error.message);
      return;
    }
    toast.success("Thank you for your feedback!");
    onSubmitted();
  };

  return (
    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          How was your experience with{" "}
          <span className="text-primary">{serviceName}</span>?
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your feedback helps improve the service.
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                (hovered || rating) >= star
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 self-center text-xs text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Optional: share more about your experience..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="resize-none text-sm"
      />

      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
      >
        {submitting ? (
          <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Submitting...</>
        ) : (
          "Submit Feedback"
        )}
      </Button>
    </div>
  );
}