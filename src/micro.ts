import { idle, loadRegistryTSV, type CoreOptions, type DemoItem } from "./core";

export type MicroWidgetOptions = CoreOptions & {
  buttonId?: string; // BUTTON_ID
  popoverId?: string; // POPOVER_ID
  contentId?: string; // CONTENT_ID
  limit?: number; // default: 8
};

const BUTTON_ID = "demosBtn";
const POPOVER_ID = "demosPopover";
const CONTENT_ID = "demosContent";

export default function initMicro(opts: MicroWidgetOptions): void {
  const buttonId = opts.buttonId || BUTTON_ID;
  const popoverId = opts.popoverId || POPOVER_ID;
  const contentId = opts.contentId || CONTENT_ID;
  const limit = typeof opts.limit === "number" ? opts.limit : 8;

  const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
  const pop = document.getElementById(popoverId) as HTMLElement | null;
  const content = document.getElementById(contentId) as HTMLElement | null;
  if (!btn || !pop || !content) return;

  let loaded = false;
  let loading: Promise<void> | null = null;

  function render(items: DemoItem[]) {
    const list = items.slice(0, Math.max(0, limit));
    if (!list.length) {
      content.textContent = "No demos.";
      return;
    }

    // ultra-light markup: just links
    let html = "";
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      html += `<div><a href="${it.url}" rel="noopener noreferrer">${it.title || it.slug}</a></div>`;
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
