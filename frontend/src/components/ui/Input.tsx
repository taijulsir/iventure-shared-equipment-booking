import { useId, type InputHTMLAttributes } from "react";
import { IconAlertCircle } from "./Icons";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, id, className, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const inputClasses = [
    "w-full border rounded-[var(--radius-md)] px-3.5 py-2.5 text-[0.9375rem] leading-[1.35rem] bg-surface text-foreground shadow-xs placeholder:text-foreground-muted placeholder:opacity-80 transition-all duration-150 disabled:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70",
    error
      ? "border-danger focus:outline-none focus:border-danger focus:ring-3 focus:ring-danger/20"
      : "border-border hover:not-disabled:not-focus:border-border-hover focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary-focus",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground tracking-[-0.01em]" htmlFor={inputId}>
          {label}
        </label>
        {helperText && !error && (
          <span id={helperId} className="text-[0.8125rem] text-foreground-muted">
            {helperText}
          </span>
        )}
      </div>

      <div className="relative flex items-center w-full">
        <input
          id={inputId}
          className={inputClasses}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...rest}
        />
      </div>

      {error && (
        <div id={errorId} className="flex items-center gap-1.5 mt-0.5">
          <IconAlertCircle size={14} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
          <span className="text-[0.8125rem] font-medium text-danger">{error}</span>
        </div>
      )}
    </div>
  );
}
