import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getServerSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6 max-w-[1200px] w-full mx-auto">
        <Link href="/" className="flex items-center no-underline">
          <BrandLogo height={36} priority />
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:pb-12">
        <div className="w-full max-w-[440px]">
          <div className="bg-surface border border-border rounded-[var(--radius-lg)] sm:rounded-[var(--radius-xl)] p-5 sm:p-8 shadow-md">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
