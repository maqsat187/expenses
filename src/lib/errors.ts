// Supabase/PostgREST errors carry a human-readable .message (e.g. "new row
// violates row-level security policy", "null value in column ... violates
// not-null constraint"). Surfacing it turns a generic "something broke" into
// something a non-technical user can actually relay back for diagnosis.
export function describeError(err: unknown): string {
  const message =
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
      ? (err as { message: string }).message
      : null;
  return message ? ` (${message})` : "";
}
