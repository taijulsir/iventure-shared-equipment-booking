import { useId, type SelectHTMLAttributes } from "react";

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
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground tracking-[-0.01em]" htmlFor={selectId}>
            {label}
          </label>
        </div>
      )}

      <div className="relative flex items-center w-full">
        <select
          id={selectId}
          className={[
            "w-full border border-border rounded-[var(--radius-md)] px-3.5 py-2.5 text-[0.9375rem] leading-[1.35rem] bg-surface text-foreground shadow-xs transition-all duration-150 hover:not-disabled:border-border-hover focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary-focus disabled:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-70",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
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
