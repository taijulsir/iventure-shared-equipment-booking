"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import styles from "./AppShell.module.css";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className={styles.layoutWrapper}>
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className={styles.contentWrapper}>
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
