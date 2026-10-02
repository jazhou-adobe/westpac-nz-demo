import { createOptimizedPicture } from '../../scripts/aem.js';

let trackId = 0;

/**
 * Adds previous/next buttons that scroll the tile row one tile at a time.
 * Buttons hide themselves when every tile fits (e.g. the 4-column desktop grid).
 * @param {Element} block
 * @param {HTMLUListElement} ul
 */
function addSliderControls(block, ul) {
  trackId += 1;
  ul.id = ul.id || `cards-article-track-${trackId}`;

  const makeButton = (dir, label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cards-article-nav cards-article-${dir}`;
    btn.setAttribute('aria-label', label);
    btn.setAttribute('aria-controls', ul.id);
    btn.hidden = true;
    return btn;
  };
  const prev = makeButton('prev', 'Previous');
  const next = makeButton('next', 'Next');

  const step = () => {
    const tile = ul.querySelector('li');
    if (!tile) return ul.clientWidth;
    const gap = parseFloat(getComputedStyle(ul).columnGap) || 0;
    return tile.getBoundingClientRect().width + gap;
  };

  let frame;
  const update = () => {
    frame = null;
    const overflow = ul.scrollWidth - ul.clientWidth > 1;
    prev.hidden = !overflow;
    next.hidden = !overflow;
    if (!overflow) return;
    prev.disabled = ul.scrollLeft <= 1;
    next.disabled = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 1;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  prev.addEventListener('click', () => ul.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => ul.scrollBy({ left: step(), behavior: 'smooth' }));
  ul.addEventListener('scroll', schedule, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(schedule).observe(ul);
  else window.addEventListener('resize', schedule);

  block.append(prev, next);
  schedule();
}

/**
 * Cards (article) — news teaser tiles: image on top, linked title, description.
 * Content contract: one row per article; cell 1 image, cell 2 heading (linked) + paragraph.
 * Tolerates missing images, a single merged cell, or extra cells.
 * Variant: `large` (taller images, 3 tiles per view on desktop).
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-article-tile';
    const media = document.createElement('div');
    media.className = 'cards-article-tile-image';
    const body = document.createElement('div');
    body.className = 'cards-article-tile-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !media.firstElementChild) {
        media.append(pic);
        if (!cell.textContent.trim()) return;
      }
      body.append(...cell.childNodes);
    });

    body.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, a')) p.remove();
    });

    if (!media.firstElementChild && !body.textContent.trim()) return;
    if (media.firstElementChild) li.append(media);
    li.append(body);

    // whole tile is clickable through the title link
    const titleLink = body.querySelector('h1 a, h2 a, h3 a, h4 a, h5 a, h6 a');
    if (titleLink) li.classList.add('cards-article-tile-linked');
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
  });

  block.replaceChildren(ul);
  if (ul.children.length > 1) addSliderControls(block, ul);
}
