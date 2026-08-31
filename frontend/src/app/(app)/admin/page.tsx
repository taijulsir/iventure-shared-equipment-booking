import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconEquipment,
  IconCalendar,
  IconShield,
  IconCheck,
} from "@/components/ui/Icons";
import styles from "./page.module.css";

export default function AdminPage() {
  return (
    <div className={styles.page}>
      <PageHeader
        title="Admin Console"
        subtitle="Manage equipment inventory, oversee reservation approvals, and configure asset policies."
        badge={
          <Badge tone="warning" showDot={false}>
            Administrator Portal
          </Badge>
        }
      />

      <div className={styles.grid}>
        <div className={styles.adminCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox}>
              <IconEquipment size={20} />
            </div>
            <h2 className={styles.cardTitle}>Equipment Inventory Management</h2>
          </div>

          <p className={styles.cardDescription}>
            Full lifecycle control over company equipment assets, specifications, and approval rules.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <IconCheck size={14} className={styles.featureIcon} />
              <span>Add, edit, and decommission hardware equipment</span>
            </div>
            <div className={styles.featureItem}>
              <IconCheck size={14} className={styles.featureIcon} />
              <span>Configure approval requirements for high-demand assets</span>
            </div>
          </div>
        </div>

        <div className={styles.adminCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox}>
              <IconCalendar size={20} />
            </div>
            <h2 className={styles.cardTitle}>Reservation Governance & Approvals</h2>
          </div>

          <p className={styles.cardDescription}>
            Review employee booking requests and manage reservation state transitions.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <IconCheck size={14} className={styles.featureIcon} />
              <span>Approve or reject pending equipment requests</span>
            </div>
            <div className={styles.featureItem}>
              <IconCheck size={14} className={styles.featureIcon} />
              <span>Cross-employee booking timeline visibility</span>
            </div>
          </div>
        </div>

        <div className={styles.adminCard}>
          <div className={styles.cardHeader}>
            <div className={styles.iconBox}>
              <IconShield size={20} />
            </div>
            <h2 className={styles.cardTitle}>Access Control & System Policies</h2>
          </div>

          <p className={styles.cardDescription}>
            Enterprise role enforcement ensuring secure boundaries between employee and administrator privileges.
          </p>

          <div className={styles.featureList}>
            <div className={styles.featureItem}>
              <IconCheck size={14} className={styles.featureIcon} />
              <span>Automated session verification and cookie security</span>
            </div>
            <div className={styles.featureItem}>
              <IconCheck size={14} className={styles.featureIcon} />
              <span>Backend authoritative role boundary enforcement</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
