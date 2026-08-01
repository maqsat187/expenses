"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearCurrentUser } from "@/lib/auth";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { isAdmin } from "@/lib/goldAuth";
import { useGoldCurrentUser } from "@/lib/useGoldCurrentUser";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useCurrentUser();
  const goldUser = useGoldCurrentUser();

  // On Gold Coin pages, links back to the expense tracker are hidden from
  // everyone except Жайсанбаев Максат — elsewhere in the app they behave
  // as before.
  const onGoldRoute = pathname?.startsWith("/gold") ?? false;
  const canSeeExpensesLinks = !onGoldRoute || isAdmin(goldUser);

  function handleLogout() {
    clearCurrentUser();
    router.replace("/login");
  }

  return (
    <header className="border-b border-slate-200 dark:border-slate-800">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        {canSeeExpensesLinks ? (
          <Link href="/" className="text-base font-semibold">
            Expenses
          </Link>
        ) : (
          <span className="text-base font-semibold">Expenses</span>
        )}
        <div className="flex items-center gap-5 text-sm">
          {/* Visible regardless of the main app's login state — Gold Coin
              has its own separate login (Фамилия/Имя/пароль), unrelated to
              the Мика/Макс PIN gate below. */}
          <Link
            href="/gold"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            Gold Coin
          </Link>
          {user && canSeeExpensesLinks && (
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
