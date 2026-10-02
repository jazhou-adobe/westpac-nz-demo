/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-dropdown. Base: tabs.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/).
 * Selector: .content-switch-block .content-switch-block__content-wrapper
 *
 * Output (blocks/tabs-dropdown/tabs-dropdown.js contract):
 *   Row 0 (intro): prompt heading + helper text (2 cells: heading | helper)
 *   One row per topic: cell 1 label, cell 2 panel content
 *
 * Verified source structure:
 *   .content-switch-block__switch > h3.content-switch-block__label
 *     + .filter-dropdown ul.filter-dropdown__options > li.radio > label > input#{topic-id} + text
 *       (+ span.u-sr-only screen-reader hint, dropped)
 *   div.content-switch-block__content#filter-content__container-* (panel host; loaded on demand,
 *     usually EMPTY in the scrape)
 *   span.content-switch-block__content--desc (helper text)
 * Panels are fetched on demand by the source site, so whatever panel markup exists is captured:
 * children carrying a topic id/value are mapped to that topic; otherwise when the child count
 * equals the topic count they are mapped by index; otherwise all content goes to the
 * first (default-selected) topic. Topics with no captured content get an empty panel cell.
 */
function cleanText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.u-sr-only, .sr-only, input').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

/** Build authorable content from one panel element (tiles -> ul > li, else raw nodes). */
function panelContent(panel, document) {
  const tiles = Array.from(panel.querySelectorAll('[class*="tile-item__wrapper"], [class*="card__inner"], [class*="card__content"]'));
  if (tiles.length) {
    const ul = document.createElement('ul');
    tiles.forEach((wrapper) => {
      const tile = wrapper.closest('.tile-item, [class*="card"]:not([class*="__"]), a') || wrapper;
      const li = document.createElement('li');
      const img = Array.from(tile.querySelectorAll('img'))[0];
      if (img) li.append(img);
      const title = wrapper.querySelector('h2, h3, h4, h5, [class*="title"], [class*="cta"]');
      const anchor = wrapper.closest('a[href]') || tile.querySelector('a[href]');
      const titleText = title ? cleanText(title) : '';
      if (titleText) {
        const strong = document.createElement('p');
        if (anchor) {
          const a = document.createElement('a');
          a.href = anchor.getAttribute('href');
          a.textContent = titleText;
          strong.append(a);
        } else {
          strong.textContent = titleText;
        }
        li.append(strong);
      }
      wrapper.querySelectorAll('p').forEach((p) => {
        if (p !== title && !p.contains(title) && cleanText(p)) li.append(p);
      });
      if (li.textContent.trim() || li.querySelector('img')) ul.append(li);
    });
    return ul.children.length ? [ul] : [];
  }
  return Array.from(panel.childNodes).filter(
    (n) => (n.nodeType === 1 && (n.textContent.trim() || n.querySelector('img'))) || (n.nodeType === 3 && n.textContent.trim()),
  );
}

export default function parse(element, { document }) {
  const prompt = element.querySelector('.content-switch-block__label, .content-switch-block__switch h2, .content-switch-block__switch h3');
  const helperEl = element.querySelector('.content-switch-block__content--desc');

  // Topic labels (radio options; fall back to <option> elements)
  let topics = Array.from(element.querySelectorAll('.filter-dropdown__options li, .filter-dropdown__options label'))
    .filter((el) => el.tagName === 'LI' || !el.closest('li'))
    .map((el) => {
      const input = el.querySelector('input');
      return { label: cleanText(el), id: input ? (input.id || input.value || '') : '' };
    });
  if (!topics.length) {
    topics = Array.from(element.querySelectorAll('select option')).map((o) => ({
      label: o.textContent.trim(),
      id: o.value || '',
    }));
  }
  topics = topics.filter((t) => t.label);

  // Panel host (exclude the helper description span)
  const host = element.querySelector('.content-switch-block__content:not(.content-switch-block__content--desc)');
  const panelChildren = host ? Array.from(host.children).filter((c) => c.textContent.trim() || c.querySelector('img')) : [];
  const panels = topics.map(() => []);
  if (panelChildren.length && topics.length) {
    let mapped = false;
    panelChildren.forEach((child) => {
      const attrs = [child.id, child.getAttribute('data-id'), child.getAttribute('data-filter'), child.getAttribute('data-value'), child.getAttribute('data-category')]
        .filter(Boolean).join(' ');
      const idx = attrs ? topics.findIndex((t) => t.id && (attrs.includes(t.id) || t.id.includes(attrs))) : -1;
      if (idx > -1) {
        panels[idx].push(...panelContent(child, document));
        mapped = true;
      }
    });
    if (!mapped) {
      if (panelChildren.length === topics.length && panelChildren.length > 1) {
        panelChildren.forEach((child, i) => panels[i].push(...panelContent(child, document)));
      } else {
        panels[0].push(...panelContent(host, document));
      }
    }
  }

  if (!prompt && !topics.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Intro row: heading in cell 1 (marks it as intro for the block), helper text in cell 2
  const promptHeading = document.createElement('h3');
  promptHeading.textContent = prompt ? cleanText(prompt) : '';
  let helper = '';
  if (helperEl && cleanText(helperEl)) {
    helper = document.createElement('p');
    helper.textContent = cleanText(helperEl);
  }
  if (prompt || helper) cells.push([prompt ? promptHeading : '', helper]);

  topics.forEach((t, i) => {
    cells.push([t.label, panels[i].length ? panels[i] : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-dropdown', cells });
  element.replaceWith(block);
}
