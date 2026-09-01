import { useId, type InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

export function Checkbox({ label, helperText, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className={styles.field}>
      <div className={styles.row}>
        <input
          id={checkboxId}
          type="checkbox"
          className={[styles.checkbox, className].filter(Boolean).join(" ")}
          {...rest}
        />
        <label htmlFor={checkboxId} className={styles.label}>
          {label}
        </label>
      </div>
      {helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
