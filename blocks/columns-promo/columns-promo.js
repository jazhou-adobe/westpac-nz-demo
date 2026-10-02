import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Is this element a paragraph holding nothing but one link (a CTA)?
 * Covers both plain authored links and links already buttonized by decorateButtons.
 * @param {Element} el
 * @returns {boolean}
 */
function isCtaParagraph(el) {
  if (el.tagName !== 'P') return false;
  const links = el.querySelectorAll('a[href]');
  if (links.length !== 1 || links[0].querySelector('img, picture')) return false;
  return el.textContent.trim() === links[0].textContent.trim();
}

/**
 * Turns trailing link-only paragraphs of a text cell into pill buttons, grouped in a
 * flex row (source "promo-block__buttons"). First plain link = primary (red), later
 * plain links = secondary (outline). Authored strong/em formatting is respected.
 * @param {Element} cell
 */
function decorateCtas(cell) {
  const ctas = [];
  let el = cell.lastElementChild;
  while (el && isCtaParagraph(el)) {
    ctas.unshift(el);
    el = el.previousElementSibling;
  }
  if (!ctas.length) return;
  const group = document.createElement('div');
  group.className = 'columns-promo-buttons';
  ctas[0].before(group);
  ctas.forEach((p, i) => {
    const a = p.querySelector('a');
    p.classList.add('button-wrapper');
    if (!a.classList.contains('button')) {
      a.classList.add('button', i === 0 ? 'primary' : 'secondary');
    }
    group.append(p);
  });
}

/**
 * Columns (promo) — text (heading, copy, CTA) beside a large image.
 * Content contract: one row, two cells: cell 1 text, cell 2 image.
 * Cell order is the desktop layout: authoring the image cell first puts the image on the
 * left (source "promo-block--left"); extra rows repeat the layout.
 * @param {Element} block
 */
export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-promo-row');
    // drop empty cells (e.g. a promo imported without an image) so the text spans the row
    [...row.children].forEach((cell) => {
      if (!cell.textContent.trim() && !cell.querySelector('picture, img')) cell.remove();
    });
    const cells = [...row.children];
    if (!cells.length) {
      row.remove();
      return;
    }
    if (cells.length === 1) row.classList.add('columns-promo-row-single');
    cells.forEach((cell) => {
      const pic = cell.querySelector('picture');
      const onlyImage = pic && !cell.textContent.trim();
      cell.classList.add(onlyImage ? 'columns-promo-img-col' : 'columns-promo-text-col');
      if (!onlyImage) decorateCtas(cell);
    });
    // image authored first → image-left layout (authored order is kept)
    if (cells[0]?.classList.contains('columns-promo-img-col')) {
      row.classList.add('columns-promo-row-image-first');
    }
  });

  block.querySelectorAll('.columns-promo-img-col picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 900px)', width: '1000' },
      { width: '750' },
    ]));
  });
}
