const RATE_PATTERN = /^\s*([\d.,]+)\s*(%)\s*(.*)$/;

/**
 * Splits a rate paragraph ("5.29% p.a.") into number / unit / suffix spans so the
 * unit and suffix can stack beside the large figure.
 * @param {Element} el
 * @returns {boolean} whether the element was recognised as a rate
 */
function decorateRate(el) {
  if (el.querySelector('a, picture')) return false;
  const match = el.textContent.match(RATE_PATTERN);
  if (!match) return false;
  const [, number, unit, suffix] = match;
  el.classList.add('cards-rate-value');
  const num = document.createElement('span');
  num.className = 'cards-rate-number';
  num.textContent = number;
  const units = document.createElement('span');
  units.className = 'cards-rate-units';
  const unitEl = document.createElement('span');
  unitEl.className = 'cards-rate-unit';
  unitEl.textContent = unit;
  units.append(unitEl);
  if (suffix.trim()) {
    const suffixEl = document.createElement('span');
    suffixEl.className = 'cards-rate-suffix';
    suffixEl.textContent = suffix.trim();
    units.append(suffixEl);
  }
  el.replaceChildren(num, units);
  return true;
}

/**
 * @param {Element} el
 * @returns {boolean}
 */
function isHeading(el) {
  return /^H[1-6]$/.test(el.tagName);
}

/**
 * Whether the element holds a single link and no other text,
 * e.g. <h4><a>Choices Fixed 2 years</a></h4> or <p><a>…</a></p>.
 * @param {Element} el
 * @returns {boolean}
 */
function isLinkOnly(el) {
  const links = el.querySelectorAll('a');
  return links.length === 1 && el.textContent.trim() === links[0].textContent.trim();
}

/**
 * Product link: a (non-title) heading containing a link — the current content model,
 * <h4><a>…</a></h4> — or, for older content, a paragraph holding a single link.
 * @param {Element} el
 * @returns {boolean}
 */
function isCta(el) {
  if (isHeading(el)) return !!el.querySelector('a');
  return el.tagName === 'P' && isLinkOnly(el);
}

/**
 * Cards (rate) — interest-rate tiles: eyebrow, product title, large rate, product link, note.
 * Content contract: one row per tile, a single cell holding
 * optional eyebrow paragraph, heading, rate paragraph ("5.29% p.a."),
 * product link (<h4><a>…</a></h4>, or legacy <p><a>…</a></p>), note.
 * Every part is optional; extra cells are merged into the tile body.
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    li.className = 'cards-rate-tile';
    const body = document.createElement('div');
    body.className = 'cards-rate-tile-body';
    [...row.children].forEach((cell) => body.append(...cell.childNodes));
    if (!body.textContent.trim()) return;

    const elements = [...body.children];
    const headings = elements.filter(isHeading);
    // title: first heading that is not just a link (that one is the product link);
    // if every heading is a bare link, the first is a linked title only when another follows
    const heading = headings.find((el) => !isLinkOnly(el))
      || (headings.length > 1 ? headings[0] : undefined);
    const headingIndex = heading ? elements.indexOf(heading) : -1;
    let rateFound = false;

    elements.forEach((el, i) => {
      if (el === heading) {
        el.classList.add('cards-rate-title');
        return;
      }
      if (!rateFound && decorateRate(el)) {
        rateFound = true;
        return;
      }
      if (isCta(el)) {
        el.classList.add('cards-rate-cta');
        return;
      }
      if (headingIndex > -1 && i < headingIndex) el.classList.add('cards-rate-eyebrow');
      else if (rateFound) el.classList.add('cards-rate-note');
    });

    // a tile with an eyebrow ("Special¹") gets the highlighted treatment
    if (body.querySelector('.cards-rate-eyebrow')) li.classList.add('cards-rate-tile-special');

    li.append(body);
    ul.append(li);
  });

  // other tiles get extra top padding so titles line up with the special tile's title
  if (ul.querySelector('.cards-rate-tile-special')) block.classList.add('cards-rate-has-special');

  block.replaceChildren(ul);
}
