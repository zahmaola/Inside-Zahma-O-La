import { connection } from "next/server";

/** Opt out of static prerender when demo data uses `new Date()`. */
export async function ensureRequestRuntime() {
  await connection();
}