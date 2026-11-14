"use client";

interface FieldErrorLike {
  message: string;
  longMessage?: string;
}

interface GlobalErrorLike {
  message: string;
}

export function FieldErrorText({ error }: { error: FieldErrorLike | null | undefined }) {
  if (!error) return null;
  return (
    <p className="text-sm text-red-400 mt-1" role="alert">
      {error.longMessage ?? error.message}
    </p>
  );
}

export function GlobalErrors({
  errors,
  localError,
}: {
  errors: GlobalErrorLike[] | null | undefined;
  localError?: string | null;
}) {
  const messages = [
    ...(localError ? [localError] : []),
    ...(errors ?? []).map((e) => e.message),
  ];
  if (messages.length === 0) return null;
  return (
    <div
      className="bg-red-950/40 border border-red-500/60 text-red-300 px-4 py-3 rounded mb-4 text-sm"
      role="alert"
    >
      {messages.map((m, i) => (
        <p key={i}>{m}</p>
      ))}
    </div>
  );
}
