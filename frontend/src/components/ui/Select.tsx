import { useId, type SelectHTMLAttributes } from "react";
// Deliberately reuses Input's own CSS module rather than introducing a new
// visual style for form controls — a <select> styled any differently from
// <input> would look like a second, competing design system.
import inputStyles from "./Input.module.css";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function Select({ label, options, id, className, ...rest }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={inputStyles.field}>
      {label && (
        <div className={inputStyles.labelRow}>
          <label className={inputStyles.label} htmlFor={selectId}>
            {label}
          </label>
        </div>
      )}

      <div className={inputStyles.inputWrapper}>
        <select
          id={selectId}
          className={[inputStyles.input, className].filter(Boolean).join(" ")}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
