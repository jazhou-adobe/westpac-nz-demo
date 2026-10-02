import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Whether a paragraph is only a call-to-action link (with or without decorateButtons markup).
 * @param {Element} p
 * @returns {boolean}
 */
function isCtaParagraph(p) {
  if (p.classList.contains('button-container')) return true;
  const link = p.querySelector('a');
  return !!link && p.textContent.trim() === link.textContent.trim();
}

/**
 * Hero (campaign) — split layout: text panel on one side, portrait image on the other.
 * Content contract: row 1 image, row 2 heading / copy / caption / CTA.
 * Authors may swap row order, merge everything into one row, or omit the image.
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-campaign-media';
  const content = document.createElement('div');
  content.className = 'hero-campaign-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      [...cell.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (node.textContent.trim()) {
            const p = document.createElement('p');
            p.append(node);
            content.append(p);
          }
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        // first picture goes to the media column (it may be wrapped in a <p>)
        const pic = node.matches('picture') ? node : node.querySelector('picture');
        if (pic && !media.firstElementChild) {
          media.append(pic);
          if (node === pic || (!node.textContent.trim() && !node.querySelector('img, a'))) return;
        }
        content.append(node);
      });
    });
  });

  // styling hooks: lead (first body paragraph), caption (later body paragraphs), CTA links
  const paragraphs = [...content.querySelectorAll(':scope > p')];
  const ctaParagraphs = paragraphs.filter((p) => isCtaParagraph(p));
  const bodyParagraphs = paragraphs
    .filter((p) => !ctaParagraphs.includes(p) && !p.querySelector('picture'));
  bodyParagraphs.slice(0, 1).forEach((p) => p.classList.add('hero-campaign-lead'));
  bodyParagraphs.slice(1).forEach((p) => p.classList.add('hero-campaign-caption'));
  ctaParagraphs.forEach((p) => p.classList.add('hero-campaign-cta'));

  // titles with macrons (e.g. "MĀORI") get a taller line-height so accents do not collide
  const title = content.querySelector('h1, h2');
  if (title && /[\u0100-\u017F]/.test(title.textContent)) {
    block.classList.add('hero-campaign-macron');
  }

  // the homepage variant carries a purple stripe accent on its left edge;
  // authors can also opt in explicitly with the "stripe" variant
  if (/^\/(content\/)?(index)?$/.test(window.location.pathname)) {
    block.classList.add('stripe');
  }

  media.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, true, [
      { media: '(min-width: 900px)', width: '1200' },
      { width: '750' },
    ]);
    img.closest('picture').replaceWith(optimized);
  });

  block.replaceChildren(content);
  if (media.firstElementChild) {
    block.append(media);
    block.classList.add('hero-campaign-has-media');
  }
}
