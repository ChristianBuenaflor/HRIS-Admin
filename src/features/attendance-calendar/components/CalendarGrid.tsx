import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getDayStateLabel, getHolidayTypeName } from "../calendarUtils";
import type { CalendarDay } from "../types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const stateStyles: Record<CalendarDay["state"], string> = {
  recorded: "bg-emerald-50/80 hover:bg-emerald-50",
  partial: "bg-amber-50/80 hover:bg-amber-50",
  "all-absent": "bg-rose-50/80 hover:bg-rose-50",
  none: "bg-slate-50/40",
  weekend: "bg-slate-100/80",
  holiday: "bg-sky-50/80 hover:bg-sky-50",
  leave: "bg-violet-50/80 hover:bg-violet-50",
};

function CountLine({
  color,
  value,
  label,
}: {
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", color)} />
      <span className="font-semibold text-slate-700">{value}</span>
      <span>{label}</span>
    </div>
  );
}

function DayCell({
  day,
  onSelect,
}: {
  day: CalendarDay;
  onSelect: (day: CalendarDay) => void;
}) {
  const isClickable = day.state !== "none" && day.state !== "weekend";
  const label = `${format(new Date(`${day.date}T00:00:00`), "PPPP")} — ${getDayStateLabel(day)}`;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={() => onSelect(day)}
      aria-label={label}
      className={cn(
        "relative flex min-h-[124px] flex-col p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500",
        stateStyles[day.state],
        !isClickable && "cursor-default",
        day.isToday && "ring-2 ring-inset ring-indigo-500",
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "text-sm font-semibold",
            day.isToday ? "text-indigo-700" : "text-slate-700",
          )}
        >
          {day.dayNumber}
        </span>
        <div className="flex items-center gap-1">
          {day.holiday && day.state !== "holiday" && (
            <span
              className="h-1.5 w-1.5 rounded-full bg-sky-500"
              title={day.holiday.holiday_name}
            />
          )}
          {day.isToday && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
              Today
            </span>
          )}
        </div>
      </div>

      <div className="mt-2 flex-1 text-[11px] leading-4 text-slate-600">
        {day.state === "recorded" && (
          <div className="space-y-1">
            {day.counts.present > 0 && (
              <CountLine
                color="bg-emerald-500"
                value={day.counts.present}
                label="present"
              />
            )}
            {day.counts.late > 0 && (
              <CountLine
                color="bg-amber-500"
                value={day.counts.late}
                label="late"
              />
            )}
            {day.counts.missed > 0 && (
              <CountLine
                color="bg-slate-400"
                value={day.counts.missed}
                label="missed"
              />
            )}
            {day.counts.leave > 0 && (
              <CountLine
                color="bg-violet-500"
                value={day.counts.leave}
                label="leave"
              />
            )}
            {day.counts.absent > 0 && (
              <CountLine
                color="bg-rose-500"
                value={day.counts.absent}
                label="absent"
              />
            )}
          </div>
        )}

        {day.state === "partial" && (
          <div>
            <p className="font-medium text-amber-700">{getDayStateLabel(day)}</p>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
              {day.counts.present > 0 && (
                <span>{day.counts.present} present</span>
              )}
              {day.counts.late > 0 && <span>{day.counts.late} late</span>}
              {day.counts.leave > 0 && <span>{day.counts.leave} leave</span>}
            </div>
          </div>
        )}

        {day.state === "all-absent" && (
          <p className="font-medium text-rose-700">
            All absent ({day.counts.total})
          </p>
        )}

        {day.state === "none" && <p className="text-slate-400">No record</p>}

        {day.state === "weekend" && <p className="text-slate-400">Weekend</p>}

        {day.state === "holiday" && (
          <div>
            <p className="line-clamp-2 font-medium text-sky-700">
              {day.holiday?.holiday_name || "Holiday"}
            </p>
            {day.holiday && (
              <p className="mt-0.5 text-[10px] text-sky-600">
                {getHolidayTypeName(day.holiday)}
              </p>
            )}
          </div>
        )}

        {day.state === "leave" && (
          <p className="font-medium text-violet-700">
            {day.counts.leave} on leave
          </p>
        )}

        {day.holiday && day.state !== "holiday" && (
          <p className="mt-1 line-clamp-1 text-[10px] text-sky-600">
            {day.holiday.holiday_name}
          </p>
        )}
      </div>
    </button>
  );
}

export function CalendarGrid({
  days,
  onSelectDay,
}: {
  days: CalendarDay[];
  onSelectDay: (day: CalendarDay) => void;
}) {
  const firstWeekday = days.length
    ? new Date(`${days[0].date}T00:00:00`).getDay()
    : 0;
  const trailing = days.length
    ? (7 - ((firstWeekday + days.length) % 7)) % 7
    : 0;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[780px] overflow-hidden rounded-lg border bg-border">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground"
            >
              {weekday}
            </div>
          ))}

          {Array.from({ length: firstWeekday }, (_, index) => (
            <div
              key={`leading-${index}`}
              aria-hidden="true"
              className="min-h-[124px] bg-slate-50/40"
            />
          ))}

          {days.map((day) => (
            <DayCell key={day.date} day={day} onSelect={onSelectDay} />
          ))}

          {Array.from({ length: trailing }, (_, index) => (
            <div
              key={`trailing-${index}`}
              aria-hidden="true"
              className="min-h-[124px] bg-slate-50/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
