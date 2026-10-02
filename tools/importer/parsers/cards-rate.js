/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-rate. Base: cards.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/).
 * Selector: .small-pricing-block .small-pricing-block__items
 *
 * Output (blocks/cards-rate/cards-rate.js contract): one row per tile, single cell holding
 *   eyebrow <p> (optional), <h3> title, rate <p> ("5.29% p.a."), link <p>, note <p>.
 *
 * Verified source structure (slick carousel, may or may not be initialised):
 *   .slick-slide > div > a.pricing-card[href] > div.pricing-card__inner >
 *     p.pricing-card__special-label?, h3.pricing-card__title,
 *     div.pricing-card__main > .pricing-card__number + .pricing-card__unit >
 *       (.pricing-card__percentage, .pricing-card__subunit),
 *     h4.pricing-card__subtitle, p.pricing-card__description
 * Iteration keyed on the block wrapper .pricing-card__inner (not the <a>); slick clones skipped.
 */
export default function parse(element, { document }) {
  let inners = Array.from(element.querySelectorAll('.pricing-card__inner'));
  if (!inners.length) inners = Array.from(element.querySelectorAll('.pricing-card'));
  inners = inners.filter((el) => !el.closest('.slick-cloned'));

  const seen = new Set();
  const cells = [];
  inners.forEach((inner) => {
    const anchor = inner.closest('a[href]') || inner.querySelector('a[href]');
    const card = inner.closest('.pricing-card') || inner;
    const key = card.id || null;
    if (key) {
      if (seen.has(key)) return;
      seen.add(key);
    }

    const content = [];
    const eyebrow = inner.querySelector('.pricing-card__special-label');
    if (eyebrow && eyebrow.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = eyebrow.textContent.trim();
      content.push(p);
    }

    const titleEl = inner.querySelector('.pricing-card__title, h3, h2');
    if (titleEl && titleEl.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = titleEl.textContent.trim();
      content.push(h3);
    }

    const number = inner.querySelector('.pricing-card__number');
    if (number && number.textContent.trim()) {
      const pct = inner.querySelector('.pricing-card__percentage');
      const sub = inner.querySelector('.pricing-card__subunit');
      const parts = [
        `${number.textContent.trim()}${pct ? pct.textContent.trim() : ''}`,
        sub ? sub.textContent.trim() : '',
      ].filter(Boolean);
      const p = document.createElement('p');
      p.textContent = parts.join(' ');
      content.push(p);
    }

    const subtitle = inner.querySelector('.pricing-card__subtitle, h4');
    const linkText = (subtitle && subtitle.textContent.trim()) || '';
    if (linkText || anchor) {
      // Source product label is an <h4> inside the card link: keep it as <h4><a href>label</a></h4>
      const h4 = document.createElement('h4');
      if (anchor) {
        const a = document.createElement('a');
        a.href = anchor.getAttribute('href');
        a.textContent = linkText || (titleEl ? titleEl.textContent.trim() : 'Learn more');
        h4.append(a);
      } else {
        h4.textContent = linkText;
      }
      content.push(h4);
    }

    const desc = inner.querySelector('.pricing-card__description');
    if (desc && desc.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = desc.textContent.trim();
      content.push(p);
    }

    if (content.length) cells.push([content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-rate', cells });
  element.replaceWith(block);
}
