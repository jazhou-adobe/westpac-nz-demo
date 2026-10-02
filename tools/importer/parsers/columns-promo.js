/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-promo. Base: columns.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/).
 * Selector: .promo-block
 *
 * Output (blocks/columns-promo/columns-promo.js contract): one row, two cells:
 *   cell 1: text (optional logo, heading, copy, CTA links), cell 2: image.
 *   For .promo-block--left the image cell is authored first (block supports either order).
 *
 * Verified source structure:
 *   .promo-block > .promo-block__image-wrap > picture > img.promo-block__image
 *               > .promo-block__content > h2.promo-block__title, p.promo-block__summary (may be empty),
 *                 p..., .promo-block__buttons > .promo-block__cta > a.btn
 * `promo-block__content--no-logo` implies a logo variant exists: .promo-block__logo img is kept.
 */
export default function parse(element, { document }) {
  const contentEl = element.querySelector('.promo-block__content') || element;
  const imageWrap = element.querySelector('.promo-block__image-wrap, .promo-block__image-wrapper');
  const image = (imageWrap && imageWrap.querySelector('img'))
    || element.querySelector('img.promo-block__image');

  const text = [];
  const logo = contentEl.querySelector('.promo-block__logo img, [class*="logo"] img');
  if (logo && logo !== image) text.push(logo);

  const heading = contentEl.querySelector('h1, h2, h3, .promo-block__title');
  if (heading) text.push(heading);

  // Body copy: non-empty paragraphs / lists outside the button area
  Array.from(contentEl.querySelectorAll('p, ul, ol')).forEach((el) => {
    if (el.closest('.promo-block__buttons')) return;
    if (el.parentElement && el.parentElement.closest('p, ul, ol') && contentEl.contains(el.parentElement.closest('p, ul, ol'))) return;
    if (!el.textContent.replace(/ /g, ' ').trim() && !el.querySelector('img')) return;
    if (logo && el.contains(logo)) return;
    text.push(el);
  });

  let ctas = Array.from(contentEl.querySelectorAll('.promo-block__buttons a[href], .promo-block__cta a[href]'));
  ctas = ctas.filter((a, i) => ctas.indexOf(a) === i);
  if (!ctas.length) {
    ctas = Array.from(contentEl.querySelectorAll('a.btn[href]')).filter((a) => !text.some((t) => t.contains(a)));
  }
  ctas.forEach((a) => {
    a.textContent = a.textContent.trim();
    const p = document.createElement('p');
    p.append(a);
    text.push(p);
  });

  if (!text.length && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const imageFirst = element.classList.contains('promo-block--left');
  const row = imageFirst ? [image || '', text] : [text, image || ''];
  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-promo', cells });
  element.replaceWith(block);
}
