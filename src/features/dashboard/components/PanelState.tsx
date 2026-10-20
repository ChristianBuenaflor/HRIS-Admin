import { AlertCircle, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { hasRouteAccess } from "@/utils/role";

interface PanelStateProps {
  message: string;
  onRetry?: () => void;
}

export function PanelError({ message, onRetry }: PanelStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 py-6">
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertCircle className="h-4 w-4" />
        This panel could not load
      </div>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function PanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <Inbox className="h-5 w-5 text-muted-foreground" />
      <p className="max-w-xs text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ViewAllLink({ to, label = "View all" }: { to: string; label?: string }) {
  const navigate = useNavigate();

  if (!hasRouteAccess(to)) return null;

  return (
    <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navigate(to)}>
      {label}
    </Button>
  );
}
