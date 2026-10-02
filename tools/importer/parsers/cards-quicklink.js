/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-quicklink. Base: cards.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/).
 * Selector: .quick-link-block .quick-link-block__items
 *
 * Output (blocks/cards-quicklink/cards-quicklink.js contract): one row per tile,
 *   cell 1: icon image, cell 2: linked label.
 *
 * Verified source structure:
 *   a.quick-link-item[href] > img.quick-link-item__icon + span.quick-link-item__text
 * The optional .quick-link-block__heading (about-us / business) sits outside the matched
 * items element and is left as default content.
 * Iteration is keyed on the label span (.quick-link-item__text) rather than the <a> tile,
 * so importer inline-element merging cannot collapse tiles; the href is read off the closest <a>.
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.quick-link-item__text')).map((labelEl) => ({
    labelEl,
    tile: labelEl.closest('.quick-link-item, a') || labelEl.parentElement,
  }));
  if (!items.length) {
    items = Array.from(element.querySelectorAll('.quick-link-item, :scope > a')).map((tile) => ({
      labelEl: null,
      tile,
    }));
  }

  const cells = [];
  items.forEach(({ labelEl, tile }) => {
    const icon = tile.querySelector('img');
    const label = (labelEl ? labelEl.textContent : tile.textContent).trim()
      || (icon && icon.getAttribute('alt')) || '';
    const anchor = (labelEl && labelEl.closest('a[href]'))
      || (tile.matches('a[href]') ? tile : tile.querySelector('a[href]'));

    let body = '';
    if (label) {
      const p = document.createElement('p');
      if (anchor) {
        const a = document.createElement('a');
        a.href = anchor.getAttribute('href');
        a.textContent = label;
        p.append(a);
      } else {
        p.textContent = label;
      }
      body = p;
    }
    if (!icon && !body) return;
    cells.push([icon || '', body]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-quicklink', cells });
  element.replaceWith(block);
}
