/**
 * Minimal Cloudflare runtime types for `tsc --noEmit`.
 * (โปรเจกต์ไม่ได้ติดตั้ง @cloudflare/workers-types — ประกาศเฉพาะส่วนที่โค้ดใช้)
 */

interface D1Result {
  success?: boolean;
  meta?: { changes?: number; last_row_id?: number; duration?: number };
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  first<T = Record<string, unknown>>(column?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result & { results: T[] }>;
  raw<T = unknown[]>(): Promise<T[]>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<unknown>;
  dump(): Promise<ArrayBuffer>;
}

interface Fetcher {
  fetch(input: Request | string | URL, init?: RequestInit): Promise<Response>;
}

declare module "cloudflare:workers" {
  export const env: { DB?: D1Database; OXYLABS_USERNAME?: string; OXYLABS_PASSWORD?: string; GOOGLE_TRANSLATE_API_KEY?: string; MYMEMORY_EMAIL?: string } & Record<string, unknown>;
}
