import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards (icon) — grid of navigation tiles, each an icon above a linked label.
 * Content contract: one row per tile; cell 1 icon image, cell 2 link label.
 * Tolerates a single merged cell, missing icons, or extra cells.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-icon-tile';
    const icon = document.createElement('div');
    icon.className = 'cards-icon-tile-icon';
    const body = document.createElement('div');
    body.className = 'cards-icon-tile-body';

    [...row.children].forEach((cell) => {
      const pic = cell.querySelector('picture');
      if (pic && !icon.firstElementChild) {
        icon.append(pic);
        // keep any text that shared the cell with the icon
        if (!cell.textContent.trim()) return;
      }
      body.append(...cell.childNodes);
    });

    // drop empty wrappers left behind after moving the picture
    body.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, a')) p.remove();
    });

    if (!icon.firstElementChild && !body.textContent.trim()) return; // skip blank rows
    if (icon.firstElementChild) li.append(icon);
    li.append(body);

    // make the whole tile clickable via the label link
    if (body.querySelector('a')) li.classList.add('cards-icon-tile-linked');
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '180' }]));
  });

  block.replaceChildren(ul);
}
