import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HolidayItem } from "../dashboardData";
import { PanelEmpty, PanelError, ViewAllLink } from "./PanelState";

interface HolidaysPanelProps {
  holidays: HolidayItem[];
  error?: string;
  onRetry: () => void;
  className?: string;
}

const formatHolidayDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "", day: "", weekday: "" };
  return {
    month: date.toLocaleDateString(undefined, { month: "short" }),
    day: date.toLocaleDateString(undefined, { day: "numeric" }),
    weekday: date.toLocaleDateString(undefined, { weekday: "short" }),
  };
};

export function HolidaysPanel({ holidays, error, onRetry, className }: HolidaysPanelProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Upcoming holidays</CardTitle>
          <CardDescription>Dates coming up on the company calendar</CardDescription>
        </div>
        <ViewAllLink to="/setup/holidays" label="Open calendar" />
      </CardHeader>
      <CardContent>
        {error ? (
          <PanelError message={error} onRetry={onRetry} />
        ) : holidays.length === 0 ? (
          <PanelEmpty message="No upcoming holidays. Add them in Setup Manager." />
        ) : (
          <div className="space-y-3">
            {holidays.map((holiday) => {
              const date = formatHolidayDate(holiday.date);
              return (
                <div key={holiday.id} className="flex items-center gap-3">
                  <div className="w-12 shrink-0 rounded-md bg-muted px-2 py-1.5 text-center">
                    <p className="text-[11px] text-muted-foreground">{date.month}</p>
                    <p className="text-lg font-semibold leading-none tabular-nums">{date.day}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{holiday.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {holiday.type}
                    </p>
                  </div>
                  <Badge variant="outline">{date.weekday}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
