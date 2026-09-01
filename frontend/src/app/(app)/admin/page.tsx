import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconEquipment,
  IconCalendar,
  IconShield,
  IconCheck,
} from "@/components/ui/Icons";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Admin Console"
        subtitle="Manage equipment inventory, oversee reservation approvals, and configure asset policies."
        badge={
          <Badge tone="warning" showDot={false}>
            Administrator Portal
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/admin/equipment"
          className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col gap-4 shadow-xs no-underline transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
              <IconEquipment size={20} />
            </div>
            <h2 className="text-[1.0625rem] font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
              Equipment Inventory Management
            </h2>
          </div>

          <p className="text-sm text-foreground-secondary leading-[1.5]">
            Full lifecycle control over company equipment assets, specifications, and approval rules.
          </p>

          <div className="flex flex-col gap-2 p-3 bg-surface-muted rounded-[var(--radius-md)] mt-auto">
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
              <IconCheck size={14} className="text-primary shrink-0" />
              <span>Add, edit, and decommission hardware equipment</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
              <IconCheck size={14} className="text-primary shrink-0" />
              <span>Configure approval requirements for high-demand assets</span>
            </div>
          </div>
        </Link>

        <Link
          href="/reservations"
          className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col gap-4 shadow-xs no-underline transition-all duration-150 hover:border-border-hover hover:shadow-md hover:-translate-y-0.5 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
              <IconCalendar size={20} />
            </div>
            <h2 className="text-[1.0625rem] font-semibold text-foreground group-hover:text-primary transition-colors duration-150">
              Reservation Governance & Approvals
            </h2>
          </div>

          <p className="text-sm text-foreground-secondary leading-[1.5]">
            Review employee booking requests and manage reservation state transitions.
          </p>

          <div className="flex flex-col gap-2 p-3 bg-surface-muted rounded-[var(--radius-md)] mt-auto">
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
              <IconCheck size={14} className="text-primary shrink-0" />
              <span>Approve or reject pending equipment requests</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
              <IconCheck size={14} className="text-primary shrink-0" />
              <span>Cross-employee booking timeline visibility</span>
            </div>
          </div>
        </Link>

        <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 flex flex-col gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
              <IconShield size={20} />
            </div>
            <h2 className="text-[1.0625rem] font-semibold text-foreground">Access Control & System Policies</h2>
          </div>

          <p className="text-sm text-foreground-secondary leading-[1.5]">
            Enterprise role enforcement ensuring secure boundaries between employee and administrator privileges.
          </p>

          <div className="flex flex-col gap-2 p-3 bg-surface-muted rounded-[var(--radius-md)] mt-auto">
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
              <IconCheck size={14} className="text-primary shrink-0" />
              <span>Automated session verification and cookie security</span>
            </div>
            <div className="flex items-center gap-2 text-[0.8125rem] text-foreground-secondary">
              <IconCheck size={14} className="text-primary shrink-0" />
              <span>Backend authoritative role boundary enforcement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
