"use client";

export function FieldErrorText({ error }: { error: string | null | undefined }) {
  if (!error) return null;
  return (
    <p className="mt-1 text-sm text-danger" role="alert">
      {error}
    </p>
  );
}

export function GlobalErrors({
  errors,
  localError,
}: {
  errors: { message: string }[] | null | undefined;
  localError?: string | null;
}) {
  const messages = [
    ...(localError ? [localError] : []),
    ...(errors ?? []).map((e) => e.message),
  ];
  if (messages.length === 0) return null;
  return (
    <div
      className="mb-4 rounded-lg border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-red-300"
      role="alert"
    >
      {messages.map((m, i) => (
        <p key={i}>{m}</p>
      ))}
    </div>
  );
}
