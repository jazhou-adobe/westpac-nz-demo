import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards (quick link) — horizontal utility tiles, icon left of a linked label.
 * Content contract: one row per tile; cell 1 icon image, cell 2 link label.
 * Tolerates a single merged cell, missing/empty icon cells, or extra cells.
 * When no tile has an icon the block gets `cards-quicklink-no-icons`.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-quicklink-tile';
    const icon = document.createElement('div');
    icon.className = 'cards-quicklink-tile-icon';
    const body = document.createElement('div');
    body.className = 'cards-quicklink-tile-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !icon.firstElementChild) {
        icon.append(pic);
        if (!cell.textContent.trim()) return;
      }
      body.append(...cell.childNodes);
    });

    body.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, a')) p.remove();
    });

    if (!icon.firstElementChild && !body.textContent.trim()) return;
    if (icon.firstElementChild) li.append(icon);
    li.append(body);
    if (body.querySelector('a')) li.classList.add('cards-quicklink-tile-linked');
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '96' }]));
  });

  // link-only lists (every icon cell left empty, e.g. "Our leaders") get a layout hook
  if (ul.children.length && !ul.querySelector('.cards-quicklink-tile-icon')) {
    block.classList.add('cards-quicklink-no-icons');
  }

  block.replaceChildren(ul);
}
