import * as React from "react";
import { cn } from "@utils";

/** Text input for the auth forms. Hub/admin forms use `inputClass` from ./field. */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-11 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-base text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 can-hover:hover:border-line-strong",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
