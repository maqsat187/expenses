"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearCurrentUser } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";

export function AppHeader() {
  const router = useRouter();
  const user = useCurrentUser();

  function handleLogout() {
    clearCurrentUser();
    router.replace("/login");
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-semibold">
          Expenses
        </Link>
        <div className="flex items-center gap-5 text-sm">
          {/* Public page, not behind useAuthGuard — this link stays visible
              regardless of login state so it's reachable without one. */}
          <Link
            href="/gold"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Gold Coin
          </Link>
          {user && (
            <>
              <Link
                href="/"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Расходы
              </Link>
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Дашборды
              </Link>
              <span className="text-slate-400 dark:text-slate-500">{user}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-600 hover:underline dark:text-slate-400"
              >
                Выйти
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
