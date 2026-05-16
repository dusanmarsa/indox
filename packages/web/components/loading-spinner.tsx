export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <div className="size-6 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
