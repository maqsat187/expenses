"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkPin, setCurrentUser, USERS, type UserName } from "@/lib/auth";
import { NumberPad } from "@/components/NumberPad";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<UserName | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function selectUser(user: UserName) {
    setSelectedUser(user);
    setPin("");
    setError(false);
  }

  function backToProfiles() {
    setSelectedUser(null);
    setPin("");
    setError(false);
  }

  function addDigit(digit: string) {
    if (!selectedUser || pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError(false);

    if (next.length === 4) {
      if (checkPin(selectedUser, next)) {
        setCurrentUser(selectedUser);
        router.replace("/");
      } else {
        setError(true);
        setTimeout(() => setPin(""), 400);
      }
    }
  }

  function removeDigit() {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12">
      {!selectedUser ? (
        <>
          <h1 className="text-xl font-semibold">Кто пользуется?</h1>
          <div className="flex gap-6">
            {USERS.map((user) => (
              <button
                key={user}
                type="button"
                onClick={() => selectUser(user)}
                className="flex flex-col items-center gap-3"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 text-2xl font-semibold text-white dark:bg-white dark:text-slate-900">
                  {user.slice(0, 1)}
                </span>
                <span className="text-sm font-medium">{user}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-semibold">{selectedUser}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Введите код
            </p>
          </div>

          <div
            className={`flex gap-4 ${error ? "animate-pulse" : ""}`}
            aria-live="polite"
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-3.5 w-3.5 rounded-full border-2 ${
                  error
                    ? "border-red-500 bg-red-500"
                    : i < pin.length
                      ? "border-slate-900 bg-slate-900 dark:border-white dark:bg-white"
                      : "border-slate-300 dark:border-slate-700"
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="-mt-4 text-sm text-red-600 dark:text-red-400">
              Неверный код
            </p>
          )}

          <NumberPad onDigit={addDigit} onBackspace={removeDigit} />

          <button
            type="button"
            onClick={backToProfiles}
            className="text-sm text-slate-500 hover:underline dark:text-slate-400"
          >
            Назад
          </button>
        </>
      )}
    </div>
  );
}
