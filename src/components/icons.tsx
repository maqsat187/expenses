export function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.4 3.6a1.5 1.5 0 0 1 2.1 0l0.9 0.9a1.5 1.5 0 0 1 0 2.1L7 16l-3.5 1 1-3.5 8.9-8.9Z" />
      <path d="M11.8 5.2 14.8 8.2" />
    </svg>
  );
}

export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6h12" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6" />
      <path d="M5.5 6v9A1.5 1.5 0 0 0 7 16.5h6a1.5 1.5 0 0 0 1.5-1.5V6" />
      <path d="M8.5 9v4" />
      <path d="M11.5 9v4" />
    </svg>
  );
}
