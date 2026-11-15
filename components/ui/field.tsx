import { useId, type ReactNode } from "react";

/** Text inputs, selects and textareas in hub/admin forms. */
export const inputClass =
  "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-base text-foreground transition-colors placeholder:text-muted-foreground focus:border-gold disabled:opacity-60 can-hover:hover:border-line-strong";

/** Label + control + hint/error, wired up for screen readers. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-1.5">{children(id)}</div>
      {error && (
        <p role="alert" className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
