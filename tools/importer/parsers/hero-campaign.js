/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-campaign. Base: hero.
 * Source: https://www.westpac.co.nz/ (also /about-us/, /business/).
 * Selector: section.page-header
 *
 * Output (blocks/hero-campaign/hero-campaign.js contract):
 *   row 1: image (optional)
 *   row 2: heading, summary, caption/disclaimer, CTA link(s)
 *
 * Verified source structure (homepage):
 *   .page-header__left > h1.page-header__title, p.page-header__summary, p.page-header__disclaimer,
 *                        .page-header__links > a.page-header__link
 *   .page-header__right > .page-header__lifestyle-image > img
 * Section pages (page-header--section / --grey / --pink-tint) may omit the image, the
 * disclaimer or links, or include breadcrumbs - all handled defensively.
 */
export default function parse(element, { document }) {
  const left = element.querySelector('.page-header__left, .page-header__content') || element;

  const heading = left.querySelector('h1, .page-header__title, h2');
  const summary = left.querySelector('.page-header__summary, p.lead');
  const disclaimer = left.querySelector('.page-header__disclaimer');

  // Any other body paragraphs that are not the summary/disclaimer (section page variations)
  const extraParas = Array.from(left.querySelectorAll('p')).filter(
    (p) => p !== summary
      && p !== disclaimer
      && !p.closest('.page-header__links, nav, .breadcrumb, [class*="breadcrumb"]')
      && p.textContent.trim(),
  );

  let links = Array.from(left.querySelectorAll('.page-header__links a[href]'));
  if (!links.length) {
    links = Array.from(left.querySelectorAll('a.btn[href], a.page-header__link[href]'))
      .filter((a) => !a.closest('nav, .breadcrumb, [class*="breadcrumb"]'));
  }

  // Image: <img> in the right column, or a CSS background-image fallback
  let image = element.querySelector(
    '.page-header__right img, .page-header__lifestyle-image img, .page-header__image img',
  );
  if (!image) {
    const bgEl = element.querySelector('.page-header__lifestyle-image, .page-header__image, [style*="background-image"]');
    const style = bgEl && bgEl.getAttribute('style');
    const m = style && style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
    let src = m && m[1];
    if (!src) {
      // Live site: responsive background images declared in an inline <style> (largest is last)
      const css = Array.from(element.querySelectorAll('style')).map((s) => s.textContent).join('\n');
      const urls = [...css.matchAll(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/gi)].map((x) => x[1]);
      src = urls[urls.length - 1];
    }
    if (src) {
      image = document.createElement('img');
      image.src = src;
    }
  }
  // Alt text: the lifestyle image is a CSS background on a role="img" div carrying aria-label.
  if (image) {
    const imgHolder = element.querySelector(
      '.page-header__lifestyle-image[aria-label], .page-header__image[aria-label], [role="img"][aria-label]',
    );
    const labelled = element.querySelector('.page-header__right [aria-label], .page-header__right [title]');
    const alt = (imgHolder && imgHolder.getAttribute('aria-label'))
      || image.getAttribute('alt')
      || (image.closest && image.closest('[aria-label]') && image.closest('[aria-label]').getAttribute('aria-label'))
      || (labelled && (labelled.getAttribute('aria-label') || labelled.getAttribute('title')))
      || image.getAttribute('title')
      || '';
    image.setAttribute('alt', alt.trim());
  }

  if (!heading && !summary && !links.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const content = [];
  if (heading) content.push(heading);
  if (summary) content.push(summary);
  content.push(...extraParas);
  if (disclaimer) content.push(disclaimer);
  links.forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    content.push(p);
  });

  const cells = [];
  if (image) cells.push([image]);
  cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-campaign', cells });
  element.replaceWith(block);
}
