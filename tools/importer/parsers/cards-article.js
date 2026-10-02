/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/ - may hold several carousels;
 * each .carousel-block__items match is parsed independently).
 * Selector: .carousel-block .carousel-block__items
 *
 * Output (blocks/cards-article/cards-article.js contract): one row per article,
 *   cell 1: image, cell 2: linked <h3> title + summary paragraph.
 *
 * Verified source structure (slick carousel, may or may not be initialised):
 *   .slick-slide > div > a.carousel-item[href][id] > div >
 *     .carousel-item__image-wrapper > img.carousel-item__image
 *     .carousel-item__content > h3.carousel-item__title + p.carousel-item__summary
 * Iteration keyed on the block wrapper .carousel-item__content (not the <a>), so importer
 * inline-element merging cannot collapse items. Slick clones are skipped and items are
 * de-duplicated by id/href.
 */
export default function parse(element, { document }) {
  let items = Array.from(element.querySelectorAll('.carousel-item__content')).map((content) => {
    const item = content.closest('.carousel-item') || content.parentElement;
    return { content, item };
  });
  if (!items.length) {
    items = Array.from(element.querySelectorAll('.carousel-item')).map((item) => ({ content: item, item }));
  }
  items = items.filter(({ content }) => !content.closest('.slick-cloned'));

  const seen = new Set();
  const cells = [];
  items.forEach(({ content, item }) => {
    const anchor = content.closest('a[href]') || (item && item.querySelector('a[href]'));
    const href = anchor ? anchor.getAttribute('href') : null;
    const key = (item && item.id) || href;
    if (key) {
      if (seen.has(key)) return;
      seen.add(key);
    }

    let image = null;
    if (item) {
      image = item.querySelector('.carousel-item__image-wrapper img, img.carousel-item__image')
        || Array.from(item.querySelectorAll('img')).find((img) => !content.contains(img)) || null;
    }

    const titleEl = content.querySelector('.carousel-item__title, h2, h3, h4');
    const summaryEl = content.querySelector('.carousel-item__summary, p');
    const body = [];
    const titleText = titleEl ? titleEl.textContent.trim() : '';
    if (titleText) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h3.append(a);
      } else {
        h3.textContent = titleText;
      }
      body.push(h3);
    }
    if (summaryEl && summaryEl !== titleEl && summaryEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = summaryEl.textContent.trim();
      body.push(p);
    }

    if (!image && !body.length) return;
    cells.push([image || '', body.length ? body : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
