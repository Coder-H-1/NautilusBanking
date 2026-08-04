/**
 * Input sanitization to prevent code injection and XSS on the client side.
 */

export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>?/gm, "") // Remove HTML tags
    .replace(/[;`'"\\]/g, "") // Remove dangerous script/SQL characters
    .trim();
}

export function sanitizeNumber(input: string | number): number {
  if (typeof input === "number") return Math.max(0, Math.floor(input));
  const clean = input.replace(/[^0-9]/g, "");
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}
