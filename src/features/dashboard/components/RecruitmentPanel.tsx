import { BriefcaseBusiness, CalendarClock, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecruitmentSummary } from "../dashboardData";
import { PanelError, ViewAllLink } from "./PanelState";

interface RecruitmentPanelProps {
  summary: RecruitmentSummary;
  error?: string;
  onRetry: () => void;
  className?: string;
}

const stageLabel = (stage: string) =>
  stage
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatInterviewDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return { month: "", day: "" };
  return {
    month: date.toLocaleDateString(undefined, { month: "short" }),
    day: date.toLocaleDateString(undefined, { day: "numeric" }),
  };
};

export function RecruitmentPanel({
  summary,
  error,
  onRetry,
  className,
}: RecruitmentPanelProps) {
  const maxStageCount = Math.max(...summary.stages.map((stage) => stage.count), 1);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Recruitment</CardTitle>
          <CardDescription>Pipeline and scheduled interviews</CardDescription>
        </div>
        <ViewAllLink to="/recruitment-onboarding" label="Open recruitment" />
      </CardHeader>
      <CardContent>
        {error ? (
          <PanelError message={error} onRetry={onRetry} />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  Open roles
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">{summary.openPostings}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  Applicants
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {summary.totalApplicants}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserRound className="h-3.5 w-3.5" />
                  New
                </div>
                <p className="mt-1 text-xl font-semibold tabular-nums">{summary.newApplicants}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium">Candidates by stage</p>
              {summary.stages.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No applicants in the pipeline yet.
                </p>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {summary.stages.slice(0, 4).map((stage) => (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{stageLabel(stage.stage)}</span>
                        <span className="font-medium tabular-nums">{stage.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${(stage.count / maxStageCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                Upcoming interviews
              </p>
              {summary.upcomingInterviews.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No interviews scheduled.</p>
              ) : (
                <div className="mt-2 divide-y">
                  {summary.upcomingInterviews.slice(0, 3).map((interview) => {
                    const date = formatInterviewDate(interview.date);
                    return (
                      <div key={interview.id} className="flex items-center gap-3 py-2.5">
                        <div className="w-12 shrink-0 rounded-md bg-muted px-2 py-1.5 text-center">
                          <p className="text-[11px] text-muted-foreground">{date.month}</p>
                          <p className="text-lg font-semibold leading-none tabular-nums">
                            {date.day}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {interview.candidateName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {interview.position}
                            {interview.time ? `, ${interview.time}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
