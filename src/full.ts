import {
  escapeHtml,
  idle,
  loadRegistryTSV,
  type CoreOptions,
  type DemoItem,
} from "./core";

export type FullWidgetOptions = CoreOptions & {
  buttonId?: string; // BUTTON_ID
  popoverId?: string; // POPOVER_ID
  contentId?: string; // CONTENT_ID
  limit?: number; // optional: show only N
  sort?: "slug" | "title" | "none"; // default: "none"
};

const BUTTON_ID = "demosBtn";
const POPOVER_ID = "demosPopover";
const CONTENT_ID = "demosContent";

function byTitle(a: DemoItem, b: DemoItem) {
  return a.title.localeCompare(b.title);
}
function bySlug(a: DemoItem, b: DemoItem) {
  return a.slug.localeCompare(b.slug);
}

export default function initFull(opts: FullWidgetOptions): void {
  const buttonId = opts.buttonId || BUTTON_ID;
  const popoverId = opts.popoverId || POPOVER_ID;
  const contentId = opts.contentId || CONTENT_ID;

  const btn = document.getElementById(buttonId) as HTMLButtonElement | null;
  const pop = document.getElementById(popoverId) as HTMLElement | null;
  const content = document.getElementById(contentId) as HTMLElement | null;
  if (!btn || !pop || !content) return;

  let loaded = false;
  let loading: Promise<void> | null = null;

  function render(items: DemoItem[]) {
    let list = items.slice();

    if (opts.sort === "title") list.sort(byTitle);
    else if (opts.sort === "slug") list.sort(bySlug);

    if (typeof opts.limit === "number" && opts.limit > 0)
      list = list.slice(0, opts.limit);

    if (!list.length) {
      content.innerHTML = '<div class="error">No demos found.</div>';
      return;
    }

    const html =
      '<ul class="list">' +
      list
        .map((it) => {
          const tags = it.tags.length
            ? `<div class="tags">${escapeHtml(it.tags.join(", "))}</div>`
            : "";
          return (
            `<li class="item">` +
            `<div class="row">` +
            `<a href="${it.url}" rel="noopener noreferrer">${escapeHtml(it.title || it.slug)}</a>` +
            `<span class="muted">${escapeHtml(it.slug)}</span>` +
            `</div>` +
            tags +
            `</li>`
          );
        })
        .join("") +
      "</ul>";

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
        content.innerHTML = '<div class="error">Failed to load demos.</div>';
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

  document.addEventListener("click", (e) => {
    if (pop.getAttribute("data-open") !== "1") return;
    const t = e.target as Node | null;
    if (!t) return;
    if (t === btn || pop.contains(t)) return;
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  idle(() => {
    void ensureLoaded();
  });
}
