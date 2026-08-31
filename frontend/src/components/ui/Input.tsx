import { useId, type InputHTMLAttributes } from "react";
import { IconAlertCircle } from "./Icons";
import styles from "./Input.module.css";

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

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
        {helperText && !error && (
          <span id={helperId} className={styles.helperText}>
            {helperText}
          </span>
        )}
      </div>

      <div className={styles.inputWrapper}>
        <input
          id={inputId}
          className={[styles.input, error ? styles.inputError : "", className].filter(Boolean).join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...rest}
        />
      </div>

      {error && (
        <div id={errorId} className={styles.errorRow}>
          <IconAlertCircle size={14} style={{ color: "var(--color-danger)", flexShrink: 0 }} />
          <span className={styles.errorText}>{error}</span>
        </div>
      )}
    </div>
  );
}
