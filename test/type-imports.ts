import initDefault from 'demo-registry-widget';
import initFull, { renderFullListHtml } from 'demo-registry-widget/full';
import initMicro, { renderMicroLinksHtml } from 'demo-registry-widget/micro';

const baseOptions = {
  baseUrl: 'https://example.com',
};

initDefault(baseOptions);
initFull({ ...baseOptions, sort: 'title' });
initMicro({ ...baseOptions, limit: 3 });

renderFullListHtml([]);
renderMicroLinksHtml([], 5);
