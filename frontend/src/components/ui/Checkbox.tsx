import { useId, type InputHTMLAttributes } from "react";

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
}

export function Checkbox({ label, helperText, id, className, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          id={checkboxId}
          type="checkbox"
          className={["w-4 h-4 accent-primary cursor-pointer rounded", className].filter(Boolean).join(" ")}
          {...rest}
        />
        <label htmlFor={checkboxId} className="text-sm font-medium text-foreground cursor-pointer">
          {label}
        </label>
      </div>
      {helperText && <span className="text-[0.8125rem] text-foreground-muted ml-6">{helperText}</span>}
    </div>
  );
}
