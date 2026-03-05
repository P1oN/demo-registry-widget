import {
  escapeHtml,
  idle,
  loadRegistryTSV,
  sanitizeHttpUrl,
  type CoreOptions,
  type DemoItem,
} from "./core";

export type MicroWidgetOptions = CoreOptions & {
  buttonId?: string; // BUTTON_ID
  popoverId?: string; // POPOVER_ID
  contentId?: string; // CONTENT_ID
  limit?: number; // default: 8
};

const BUTTON_ID = __DRW_BUTTON_ID__;
const POPOVER_ID = __DRW_POPOVER_ID__;
const CONTENT_ID = __DRW_CONTENT_ID__;
const DEFAULT_LIMIT = __DRW_LIMIT__;

export function renderMicroLinksHtml(items: DemoItem[], limit: number): string {
  const list = items.slice(0, Math.max(0, limit));
  if (!list.length) return "";

  let html = "";
  for (let i = 0; i < list.length; i++) {
    const it = list[i];
    const safeUrl = sanitizeHttpUrl(it.url);
    if (!safeUrl) continue;
    const safeLabel = escapeHtml(it.title || it.slug);
    html += `<div><a href="${safeUrl}" rel="noopener noreferrer">${safeLabel}</a></div>`;
  }
  return html;
}

export default function initMicro(opts: MicroWidgetOptions): void {
  const buttonId = opts.buttonId || BUTTON_ID;
  const popoverId = opts.popoverId || POPOVER_ID;
  const contentId = opts.contentId || CONTENT_ID;
  const limit = typeof opts.limit === "number" ? opts.limit : DEFAULT_LIMIT;

  const btnNode = document.getElementById(buttonId) as HTMLButtonElement | null;
  const popNode = document.getElementById(popoverId) as HTMLElement | null;
  const contentNode = document.getElementById(contentId) as HTMLElement | null;
  if (!btnNode || !popNode || !contentNode) return;
  const btn = btnNode;
  const pop = popNode;
  const content = contentNode;

  let loaded = false;
  let loading: Promise<void> | null = null;

  function render(items: DemoItem[]) {
    const html = renderMicroLinksHtml(items, limit);
    if (!html) {
      content.textContent = "No demos.";
      return;
    }
    content.innerHTML = html;
  }

  async function ensureLoaded() {
    if (loaded) return;
    if (loading) return loading;

    loading = (async () => {
      content.textContent = "Loading…";
      const parsed = await loadRegistryTSV(opts);
      render(parsed.items);
      loaded = true;
    })()
      .catch(() => {
        content.textContent = "Failed to load demos.";
      })
      .finally(() => {
        loading = null;
      });

    return loading;
  }

  function open() {
    pop.setAttribute("data-open", "1");
    btn.setAttribute("aria-expanded", "true");
  }
  function close() {
    pop.removeAttribute("data-open");
    btn.setAttribute("aria-expanded", "false");
  }

  btn.addEventListener("click", () => {
    const isOpen = pop.getAttribute("data-open") === "1";
    if (isOpen) close();
    else {
      open();
      void ensureLoaded();
    }
  });

  idle(() => {
    void ensureLoaded();
  });
}
