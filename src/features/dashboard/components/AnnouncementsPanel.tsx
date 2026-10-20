import { Megaphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnnouncementItem } from "../dashboardData";
import { PanelEmpty, PanelError, ViewAllLink } from "./PanelState";

interface AnnouncementsPanelProps {
  announcements: AnnouncementItem[];
  error?: string;
  onRetry: () => void;
  className?: string;
}

const formatAnnouncementDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export function AnnouncementsPanel({
  announcements,
  error,
  onRetry,
  className,
}: AnnouncementsPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Latest announcements</CardTitle>
          <CardDescription>Updates shared with the team</CardDescription>
        </div>
        <ViewAllLink to="/announcement" label="Open announcements" />
      </CardHeader>
      <CardContent>
        {error ? (
          <PanelError message={error} onRetry={onRetry} />
        ) : announcements.length === 0 ? (
          <PanelEmpty message="No active announcements right now." />
        ) : (
          <div className="divide-y">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{announcement.title}</h3>
                    {announcement.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {announcement.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {announcement.author ? `${announcement.author}, ` : ""}
                      {formatAnnouncementDate(announcement.createdAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
