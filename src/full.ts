import {
  escapeHtml,
  idle,
  loadRegistryTSV,
  parseRegistryTSV,
  sanitizeHttpUrl,
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

export { parseRegistryTSV, sanitizeHttpUrl };

const BUTTON_ID = __DRW_BUTTON_ID__;
const POPOVER_ID = __DRW_POPOVER_ID__;
const CONTENT_ID = __DRW_CONTENT_ID__;
const DEFAULT_LIMIT = __DRW_LIMIT__;

function resolveSort(sort: FullWidgetOptions["sort"] | undefined): "slug" | "title" | "none" {
  if (sort === "slug" || sort === "title" || sort === "none") return sort;
  if (__DRW_SORT__ === "slug" || __DRW_SORT__ === "title" || __DRW_SORT__ === "none") {
    return __DRW_SORT__;
  }
  return "none";
}

function byTitle(a: DemoItem, b: DemoItem) {
  return a.title.localeCompare(b.title);
}
function bySlug(a: DemoItem, b: DemoItem) {
  return a.slug.localeCompare(b.slug);
}

export function renderFullListHtml(items: DemoItem[]): string {
  const html =
    '<ul class="list">' +
    items
      .map((it) => {
        const safeUrl = sanitizeHttpUrl(it.url);
        if (!safeUrl) return "";
        const tags = it.tags.length
          ? `<div class="tags">${escapeHtml(it.tags.join(", "))}</div>`
          : "";
        return (
          `<li class="item">` +
          `<div class="row">` +
          `<a href="${safeUrl}" rel="noopener noreferrer">${escapeHtml(it.title || it.slug)}</a>` +
          `<span class="muted">${escapeHtml(it.slug)}</span>` +
          `</div>` +
          tags +
          `</li>`
        );
      })
      .join("") +
    "</ul>";

  return html;
}

export default function initFull(opts: FullWidgetOptions): void {
  const buttonId = opts.buttonId || BUTTON_ID;
  const popoverId = opts.popoverId || POPOVER_ID;
  const contentId = opts.contentId || CONTENT_ID;

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
    let list = items.slice();

    const sort = resolveSort(opts.sort);
    if (sort === "title") list.sort(byTitle);
    else if (sort === "slug") list.sort(bySlug);

    const limit = typeof opts.limit === "number" ? opts.limit : DEFAULT_LIMIT;
    if (limit > 0) list = list.slice(0, limit);

    if (!list.length) {
      content.innerHTML = '<div class="error">No demos found.</div>';
      return;
    }

    const html = renderFullListHtml(list);
    if (!html || html === '<ul class="list"></ul>') {
      content.innerHTML = '<div class="error">No demos found.</div>';
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
