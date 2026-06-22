export function escapeHtml(value: string | number | boolean | null | undefined): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttribute(value: string | number | boolean | null | undefined): string {
  return escapeHtml(value);
}

export function encodePathSegment(value: string | number | boolean | null | undefined): string {
  return encodeURIComponent(String(value ?? ""));
}
