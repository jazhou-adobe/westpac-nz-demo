/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-icon. Base: cards.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/).
 * Selector: .tile-block .tile-block__items
 *
 * Output (blocks/cards-icon/cards-icon.js contract): one row per tile,
 *   cell 1: icon image, cell 2: linked label (+ any extra tile text).
 *
 * Verified source structure:
 *   a.tile-item[href] > img.tile-item__icon + div.tile-item__wrapper--tile > span.tile-item__cta
 * Iteration is keyed on the inner block wrapper (div.tile-item__wrapper*) rather than the
 * <a> tile, so the importer's inline-element merging cannot collapse tiles; the href is
 * read back off the closest <a>.
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('[class*="tile-item__wrapper"]')).map((wrapper) => {
    const tile = wrapper.closest('.tile-item, a') || wrapper.parentElement;
    return { wrapper, tile };
  });
  if (!items.length) {
    // Fallback: tiles without an inner wrapper
    items = Array.from(element.querySelectorAll(':scope > .tile-item, :scope > a')).map((tile) => ({
      wrapper: tile,
      tile,
    }));
  }

  const cells = [];
  items.forEach(({ wrapper, tile }) => {
    // Icon: sibling of the wrapper inside the same tile
    let icon = null;
    if (tile && tile !== wrapper) {
      icon = Array.from(tile.querySelectorAll('img')).find((img) => !wrapper.contains(img)) || null;
    }
    if (!icon) icon = wrapper.querySelector('img');

    const labelEl = wrapper.querySelector('.tile-item__cta, .tile-item__title, h2, h3, h4, span, strong');
    const label = (labelEl ? labelEl.textContent : wrapper.textContent).trim();
    const anchor = wrapper.closest('a[href]') || (tile && tile.querySelector('a[href]'));
    const href = anchor ? anchor.getAttribute('href') : null;

    const body = [];
    if (label) {
      const p = document.createElement('p');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        p.append(a);
      } else {
        p.textContent = label;
      }
      body.push(p);
    }
    // Optional description text on section-page tile variants
    const desc = wrapper.querySelector('.tile-item__description, .tile-item__summary, p');
    if (desc && desc !== labelEl && desc.textContent.trim() && desc.textContent.trim() !== label) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      body.push(p);
    }

    if (!icon && !body.length) return;
    cells.push([icon || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-icon', cells });
  element.replaceWith(block);
}
