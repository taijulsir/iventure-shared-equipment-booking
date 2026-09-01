"use client";

import { useEffect, type ReactNode } from "react";
import { IconX } from "./Icons";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

const maxWidthClasses = {
  sm: "max-w-[400px]",
  md: "max-w-[500px]",
  lg: "max-w-[620px]",
  xl: "max-w-[760px]",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "md",
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className={[
          "w-full bg-surface border border-border rounded-[var(--radius-lg)] shadow-lg flex flex-col overflow-hidden max-h-[90vh] relative",
          maxWidthClasses[maxWidth],
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-border gap-4 shrink-0">
            <div className="flex flex-col gap-1 pr-2">
              {title && (
                <h2 className="text-lg font-bold text-foreground tracking-[-0.01em] leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-surface-muted cursor-pointer transition-colors duration-150 shrink-0"
                onClick={onClose}
                aria-label="Close modal"
              >
                <IconX size={18} />
              </button>
            )}
          </div>
        )}

        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
