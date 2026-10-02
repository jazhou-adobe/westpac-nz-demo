import { toClassName } from '../../scripts/aem.js';

let instanceCount = 0;

/**
 * Splits a tile (list item) into an image column and a body column, and flags the title.
 * Authors may put the picture bare, in a <p>, or in a link; the title may be a heading
 * or a paragraph holding a single link.
 * @param {HTMLLIElement} li
 */
function decorateTile(li) {
  const picture = li.querySelector('picture, img');
  let media = null;
  if (picture) {
    media = picture.closest('li > *') || picture;
    if (media.textContent.trim()) media = picture.closest('a') || picture;
  }
  const image = document.createElement('div');
  image.className = 'tabs-dropdown-tile-image';
  const body = document.createElement('div');
  body.className = 'tabs-dropdown-tile-body';
  [...li.childNodes].forEach((node) => {
    if (node === media) return;
    if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) return;
    body.append(node);
  });
  if (media) {
    image.append(media);
    li.append(image);
  }
  li.append(body);

  const title = body.querySelector('h2, h3, h4, h5, h6')
    || [...body.querySelectorAll(':scope > p')].find((p) => {
      const a = p.querySelector('a');
      return a && p.textContent.trim() === a.textContent.trim();
    });
  if (title) title.classList.add('tabs-dropdown-tile-title');
  li.classList.add('tabs-dropdown-tile');
}

/**
 * Whether a row is the optional intro row (prompt heading + helper text) rather than a topic.
 * Intro = a single-cell row, or a first row whose first cell holds a heading.
 * @param {Element} row
 * @param {number} index
 * @returns {boolean}
 */
function isIntroRow(row, index) {
  if (index !== 0) return false;
  if (row.children.length < 2) return true;
  return !!row.firstElementChild.querySelector('h1, h2, h3, h4, h5, h6');
}

/**
 * Tabs (dropdown) — a "I want to know more about [topic]" selector that switches between panels.
 * Structural reference: Block Collection tabs (label | panel per row), with a native <select>
 * replacing the button tablist.
 * Content contract:
 *   Row 0 (optional): prompt heading + helper text (one or two cells).
 *   One row per topic: cell 1 label, cell 2 panel content (may be empty or missing).
 * Empty panels get no region semantics; when every panel is empty the panels container is
 * omitted and the block gets `tabs-dropdown-no-panels` (the selector still renders).
 * @param {Element} block
 */
export default async function decorate(block) {
  instanceCount += 1;
  const prefix = `tabs-dropdown-${instanceCount}`;

  const header = document.createElement('div');
  header.className = 'tabs-dropdown-header';
  const prompt = document.createElement('div');
  prompt.className = 'tabs-dropdown-prompt';
  const helper = document.createElement('div');
  helper.className = 'tabs-dropdown-helper';
  const panels = document.createElement('div');
  panels.className = 'tabs-dropdown-panels';

  const rows = [...block.children];
  const topics = [];

  rows.forEach((row, index) => {
    if (isIntroRow(row, index)) {
      [...row.children].forEach((cell) => {
        [...cell.children].forEach((el) => {
          if (/^H[1-6]$/.test(el.tagName) && !prompt.firstElementChild) prompt.append(el);
          else helper.append(el);
        });
        // bare text directly in a cell
        if (cell.textContent.trim()) helper.append(...cell.childNodes);
      });
      return;
    }
    const [labelCell, ...contentCells] = [...row.children];
    const label = labelCell?.textContent.trim();
    if (!label) return;
    topics.push({ label, contentCells });
  });

  const select = document.createElement('select');
  select.className = 'tabs-dropdown-select';
  select.id = `${prefix}-select`;

  const promptHeading = prompt.firstElementChild;
  if (promptHeading) {
    promptHeading.id = promptHeading.id || `${prefix}-label`;
    select.setAttribute('aria-labelledby', promptHeading.id);
  } else {
    select.setAttribute('aria-label', 'Select a topic');
  }

  topics.forEach(({ label, contentCells }, i) => {
    const id = `${prefix}-${toClassName(label) || i}`;
    const option = document.createElement('option');
    option.value = id;
    option.textContent = label;
    select.append(option);

    const panel = document.createElement('div');
    panel.className = 'tabs-dropdown-panel';
    panel.id = `${id}-panel`;
    panel.hidden = i !== 0;
    contentCells.forEach((cell) => panel.append(...cell.childNodes));
    // imported panels are often empty (the source site loads them on demand)
    const hasContent = !!panel.textContent.trim() || !!panel.querySelector('picture, img');
    if (hasContent) {
      panel.setAttribute('role', 'region');
      panel.setAttribute('aria-label', label);
      option.setAttribute('aria-controls', panel.id);
    } else {
      panel.replaceChildren();
      panel.classList.add('tabs-dropdown-panel-empty');
    }
    // tile list inside a panel (e.g. four resource tiles)
    const list = panel.querySelector(':scope > ul');
    if (list) {
      list.classList.add('tabs-dropdown-tiles');
      [...list.children].forEach(decorateTile);
    }
    panels.append(panel);
  });
  const hasPanels = [...panels.children].some((p) => !p.classList.contains('tabs-dropdown-panel-empty'));

  select.addEventListener('change', () => {
    [...panels.children].forEach((panel) => {
      panel.hidden = panel.id !== `${select.value}-panel`;
    });
  });

  header.append(prompt);
  if (topics.length) {
    const control = document.createElement('div');
    control.className = 'tabs-dropdown-control';
    control.append(select);
    header.append(control);
  }

  block.replaceChildren(header);
  if (helper.textContent.trim()) block.append(helper);
  if (hasPanels) block.append(panels);
  else if (topics.length) block.classList.add('tabs-dropdown-no-panels');
}
