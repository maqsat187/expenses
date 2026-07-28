"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

type Option = { value: string; label: string };

export function MultiSelectFilter({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  function close() {
    setOpen(false);
    setSearch("");
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggle(value: string) {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase()),
  );

  const summary =
    selected.size === 0
      ? placeholder
      : selected.size === 1
        ? (options.find((o) => selected.has(o.value))?.label ?? placeholder)
        : `${label}: ${selected.size}`;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm ${
          selected.size > 0
            ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
            : "border-slate-300 dark:border-slate-700 dark:bg-slate-900"
        }`}
      >
        {summary}
        <ChevronDownIcon className="h-4 w-4 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1 w-60 max-w-[80vw] rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-2 dark:border-slate-800">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск…"
              className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-950"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-1.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <button
              type="button"
              onClick={() =>
                onChange(new Set(filteredOptions.map((o) => o.value)))
              }
              className="hover:underline"
            >
              Выбрать все
            </button>
            <button
              type="button"
              onClick={() => onChange(new Set())}
              className="hover:underline"
            >
              Сбросить
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <input
                  type="checkbox"
                  checked={selected.has(option.value)}
                  onChange={() => toggle(option.value)}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600"
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate-400">
                Ничего не найдено
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
