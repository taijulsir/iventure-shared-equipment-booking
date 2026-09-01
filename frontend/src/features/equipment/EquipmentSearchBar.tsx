"use client";

import { useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconSearch } from "@/components/ui/Icons";
import styles from "./EquipmentSearchBar.module.css";

/**
 * Drives GET /equipment's real `search` query param via the URL (not
 * client-side filtering of an already-fetched page) — submitting re-renders
 * the server component with the new searchParams, which re-fetches from the
 * backend. A new search always resets back to page 1.
 */
export function EquipmentSearchBar({ initialSearch }: { initialSearch: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) {
      params.set("search", trimmed);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} role="search">
      <div className={styles.inputWrapper}>
        <Input
          label="Search equipment"
          placeholder="Search by name or description…"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <Button type="submit" variant="secondary">
        <IconSearch size={16} />
        <span>Search</span>
      </Button>
    </form>
  );
}
