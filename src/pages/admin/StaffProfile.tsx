import { useEffect, useState } from "react";
import { useParams } from "@tanstack/react-router";
import { DateTime } from "luxon";
import { Loader2, Star, ArrowLeft, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface StaffProfile {
  id: string;
  full_name: string;
  email: string;
  avg_rating: number | null;
  review_count: number;
}

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  service_name: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(
            "h-4 w-4",
            s <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}

export default function StaffProfile() {
  const { id } = useParams({ strict: false }) as { id: string };
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: p } = await supabase
        .from("profiles")
        .select("id, full_name, email, avg_rating, review_count")
        .eq("id", id)
        .single();

      setProfile(p ?? null);

      const { data: fb } = await supabase
        .from("feedback")
        .select(`id, rating, comment, created_at, services ( name )`)
        .eq("agent_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      setFeedbackList(
        (fb ?? []).map((f: any) => ({
          ...f,
          service_name: f.services?.name ?? "Unknown service",
        }))
      );

      setLoading(false);
    };

    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Staff member not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Back */}
      <Link to="/admin/users">
        <Button variant="ghost" size="sm" className="gap-1 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Button>
      </Link>

      {/* Profile Header */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{profile.full_name ?? "Unnamed"}</h1>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        {/* Rating Summary */}
        {profile.avg_rating != null ? (
          <div className="flex items-center gap-3 pt-2">
            <StarDisplay rating={profile.avg_rating} />
            <span className="text-2xl font-bold">{profile.avg_rating.toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">
              / 5 — based on {profile.review_count} review{profile.review_count !== 1 ? "s" : ""}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground pt-2">No reviews yet.</p>
        )}
      </div>

      {/* Feedback List */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Recent Feedback</h2>
        {feedbackList.length === 0 ? (
          <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No feedback received yet.
          </div>
        ) : (
          <div className="space-y-3">
            {feedbackList.map((fb) => (
              <div key={fb.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <StarDisplay rating={fb.rating} />
                  <span className="text-xs text-muted-foreground">
                    {DateTime.fromISO(fb.created_at).toFormat("MMM d, yyyy")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{fb.service_name}</p>
                {fb.comment && (
                  <p className="text-sm text-foreground">"{fb.comment}"</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}