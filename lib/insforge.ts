import { createClient } from "@insforge/sdk";

function requireEnv(name: "INSFORGE_BASE_URL" | "INSFORGE_ANON_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function createInsforgeServerClient(accessToken?: string) {
  return createClient({
    baseUrl: requireEnv("INSFORGE_BASE_URL"),
    anonKey: requireEnv("INSFORGE_ANON_KEY"),
    edgeFunctionToken: accessToken,
    isServerMode: true,
    fetch,
  });
}

