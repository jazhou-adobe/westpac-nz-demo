/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-intro. Base: columns.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/).
 * Selector: #news-and-stories > .content-block
 *
 * Output (blocks/columns-intro/columns-intro.js contract): one row, two cells:
 *   cell 1: heading, cell 2: intro paragraph(s) with inline links (+ any CTA links).
 *
 * Verified source structure:
 *   .content-block > h2.content-block__title + div.content-block__content > p > (span | a)*
 * Presentational <span> wrappers inside paragraphs are unwrapped so text and links stay inline.
 */
export default function parse(element, { document }) {
  const heading = element.querySelector(':scope > h1, :scope > h2, :scope > h3, .content-block__title');
  const contentEl = element.querySelector('.content-block__content');

  let body = [];
  if (contentEl) {
    body = Array.from(contentEl.children).filter((el) => el.textContent.trim() || el.querySelector('img'));
  } else {
    body = Array.from(element.children).filter(
      (el) => el !== heading && (el.textContent.trim() || el.querySelector('img')),
    );
  }

  // Unwrap plain spans (keep their text / inline links)
  body.forEach((el) => {
    el.querySelectorAll('span').forEach((span) => {
      if (span.classList.contains('u-sr-only')) return;
      span.replaceWith(...span.childNodes);
    });
  });

  // CTA buttons outside the content wrapper (variation on section pages)
  const extraCtas = Array.from(element.querySelectorAll('a.btn[href], [class*="content-block__button"] a[href]'))
    .filter((a) => !body.some((el) => el.contains(a)));
  extraCtas.forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    body.push(p);
  });

  if (!heading && !body.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[heading || '', body.length ? body : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-intro', cells });
  element.replaceWith(block);
}
