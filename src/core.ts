export type DemoItem = {
  slug: string;
  title: string;
  url: string;
  tags: string[];
};

export type CoreOptions = {
  baseUrl: string;
  cacheKeyPrefix?: string; // DEFAULT_CACHE_KEY_PREFIX
  maxAgeMs?: number; // DEFAULT_MAX_AGE: 7 days
  registryPath?: string; // DEFAULT_REGISTRY_PATH
};

export type ParsedRegistry = { version: string; items: DemoItem[] };

const DEFAULT_MAX_AGE = __DRW_MAX_AGE_MS__;

const DEFAULT_CACHE_KEY_PREFIX = __DRW_CACHE_KEY_PREFIX__;
const DEFAULT_REGISTRY_PATH = __DRW_REGISTRY_PATH__;

function normalizeBaseUrl(u: string): string {
  return u.replace(/\/+$/, "");
}

export function parseRegistryTSV(text: string): ParsedRegistry {
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = t.match(/^#v=([^\n]+)/m);
  const version = (m?.[1] || "").trim();

  const lines = t.split("\n");
  let i = 0;

  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (line[0] !== "#") break;
  }
  for (; i < lines.length && !lines[i].trim(); i++) {}

  if (i >= lines.length) return { version, items: [] };

  const header = lines[i].split("\t").map((x) => x.trim());
  const hasHeader =
    header[0] === "slug" && header[1] === "title" && header[2] === "url";

  const items: DemoItem[] = [];
  const startAt = hasHeader ? i + 1 : i;
  for (i = startAt; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim() || line[0] === "#") continue;

    const cols = line.split("\t");
    const slug = (cols[0] || "").trim();
    const title = (cols[1] || slug).trim();
    const url = (cols[2] || "").trim();
    const tagsRaw = (cols[3] || "").trim();

    if (!slug || !url) continue;

    items.push({
      slug,
      title: title || slug,
      url,
      tags: tagsRaw
        ? tagsRaw
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
    });
  }

  return { version, items };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return await res.text();
}

export async function loadRegistryTSV(
  opts: CoreOptions,
): Promise<ParsedRegistry> {
  if (!opts?.baseUrl) throw new Error("baseUrl is required");

  const baseUrl = normalizeBaseUrl(opts.baseUrl);
  const cacheKeyPrefix = opts.cacheKeyPrefix || DEFAULT_CACHE_KEY_PREFIX;
  const maxAgeMs =
    typeof opts.maxAgeMs === "number" ? opts.maxAgeMs : DEFAULT_MAX_AGE;
  const registryPath = opts.registryPath || DEFAULT_REGISTRY_PATH;

  const K_TEXT = `${cacheKeyPrefix}:registryText`;
  const K_VER = `${cacheKeyPrefix}:registryVer`;
  const K_SAVED = `${cacheKeyPrefix}:savedAt`;

  const now = Date.now();
  const cachedText = localStorage.getItem(K_TEXT) || "";
  const cachedVer = localStorage.getItem(K_VER) || "";
  const savedAt = Number(localStorage.getItem(K_SAVED) || "0");
  const canUseCache = !!cachedText && savedAt > 0 && now - savedAt < maxAgeMs;

  let text: string;
  try {
    text = await fetchText(`${baseUrl}${registryPath}`);
  } catch (e) {
    if (canUseCache) return parseRegistryTSV(cachedText);
    throw e;
  }

  const parsed = parseRegistryTSV(text);

  if (parsed.version && cachedText && cachedVer === parsed.version) {
    return parseRegistryTSV(cachedText);
  }

  localStorage.setItem(K_TEXT, text);
  localStorage.setItem(K_VER, parsed.version || "");
  localStorage.setItem(K_SAVED, String(now));

  return parsed;
}

export function escapeHtml(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function sanitizeHttpUrl(url: string): string | null {
  try {
    const parsed = new URL(String(url).trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export function idle(fn: () => void): void {
  const ric = (window as any).requestIdleCallback as
    | undefined
    | ((cb: any) => void);
  if (ric) ric(() => fn());
  else setTimeout(fn, 800);
}
