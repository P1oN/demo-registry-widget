type DemoItem = {
    slug: string;
    title: string;
    url: string;
    tags: string[];
};
type CoreOptions = {
    baseUrl: string;
    cacheKeyPrefix?: string;
    maxAgeMs?: number;
    registryPath?: string;
};
type ParsedRegistry = {
    version: string;
    items: DemoItem[];
};
declare function parseRegistryTSV(text: string): ParsedRegistry;
declare function sanitizeHttpUrl(url: string): string | null;

type FullWidgetOptions = CoreOptions & {
    buttonId?: string;
    popoverId?: string;
    contentId?: string;
    limit?: number;
    sort?: "slug" | "title" | "none";
};

declare function renderFullListHtml(items: DemoItem[]): string;
declare function initFull(opts: FullWidgetOptions): void;

export { type FullWidgetOptions, initFull as default, parseRegistryTSV, renderFullListHtml, sanitizeHttpUrl };
