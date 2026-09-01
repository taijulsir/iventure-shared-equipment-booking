import type { ReactNode } from "react";
import { IconAlertCircle, IconCheck, IconInfo } from "./Icons";

export type AlertVariant = "error" | "success" | "warning" | "info";

const variantClasses: Record<AlertVariant, { container: string; icon: string }> = {
  error: {
    container: "bg-danger-bg border-danger-border text-danger-text",
    icon: "text-danger",
  },
  success: {
    container: "bg-success-bg border-success-border text-success-text",
    icon: "text-success",
  },
  warning: {
    container: "bg-warning-bg border-warning-border text-warning-text",
    icon: "text-warning",
  },
  info: {
    container: "bg-info-bg border-info-border text-info-text",
    icon: "text-info",
  },
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const getIcon = () => {
    switch (variant) {
      case "error":
      case "warning":
        return <IconAlertCircle size={18} />;
      case "success":
        return <IconCheck size={18} />;
      case "info":
      default:
        return <IconInfo size={18} />;
    }
  };

  const currentVariant = variantClasses[variant];

  return (
    <div
      className={[
        "flex items-start gap-3 border rounded-[var(--radius-md)] px-4 py-3 text-sm leading-[1.35rem]",
        currentVariant.container,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className={["shrink-0 mt-px", currentVariant.icon].join(" ")} aria-hidden="true">
        {getIcon()}
      </span>
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
