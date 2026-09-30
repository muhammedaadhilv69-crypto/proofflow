export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
      role="status"
    >
      {label}...
    </div>
  );
}

export function ErrorBlock({
  message = "Something went wrong",
}: {
  message?: string;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
