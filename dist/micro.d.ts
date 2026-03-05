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

type MicroWidgetOptions = CoreOptions & {
    buttonId?: string;
    popoverId?: string;
    contentId?: string;
    limit?: number;
};
declare function renderMicroLinksHtml(items: DemoItem[], limit: number): string;
declare function initMicro(opts: MicroWidgetOptions): void;

export { type MicroWidgetOptions, initMicro as default, renderMicroLinksHtml };
