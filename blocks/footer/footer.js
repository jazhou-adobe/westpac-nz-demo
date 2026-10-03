/*
 * Footer block
 *
 * All copy, links and images come from the footer fragment (content/footer.plain.html).
 * This file only reads that fragment and builds the layout around it.
 *
 * Expected fragment sections (top-level <div>s, in order):
 *   1. brand    – paragraph with the logo link, then a list of primary links
 *                 (each link may start with a small icon image)
 *   2. social   – list of icon links (image alt = accessible name)
 *   3. legal    – list of legal / utility links
 *   4. notice   – paragraph with an image-only badge link (opens its URL in an
 *                 overlay dialog) and a paragraph with the copyright line
 * Any section may be omitted; missing pieces are skipped.
 */

let idCounter = 0;
function uid(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  });
  children.flat().forEach((child) => {
    if (child === undefined || child === null) return;
    node.append(child);
  });
  return node;
}

function text(node) {
  return (node?.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) then /footer.plain.html (DA/EDS production).
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  // relative image paths in the fragment are relative to the fragment itself
  const base = new URL(resp.url, window.location.href);
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^([a-z]+:|\/)/i.test(src)) img.src = new URL(src, base).href;
  });
  return container;
}

function isExternal(link) {
  try {
    return new URL(link.href, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

/** External links open in a new tab, like the source site. */
function prepareLink(link) {
  if (isExternal(link)) {
    link.target = '_blank';
    link.rel = 'nofollow noopener noreferrer';
  }
  return link;
}

function buildBrand(section) {
  const link = section?.querySelector('p a, a');
  if (!link) return null;
  const brand = el('a', { class: 'footer-brand', href: link.getAttribute('href') || '/' });
  const img = link.querySelector('img');
  if (img) {
    img.classList.add('footer-logo');
    brand.append(img);
  } else {
    brand.textContent = text(link);
  }
  return brand;
}

function buildLinkList(section, listClass) {
  const list = section?.querySelector('ul');
  if (!list) return null;
  list.className = listClass;
  list.querySelectorAll('a').forEach((link) => {
    prepareLink(link);
    link.querySelectorAll('img').forEach((img) => {
      img.classList.add('footer-link-icon');
      img.setAttribute('aria-hidden', 'true');
      img.loading = 'lazy';
    });
  });
  return list;
}

function buildSocial(section) {
  const list = section?.querySelector('ul');
  if (!list) return null;
  list.className = 'footer-social';
  list.querySelectorAll('a').forEach((link) => {
    prepareLink(link);
    const img = link.querySelector('img');
    if (img) {
      // render the icon as a CSS image (like the source) so it can be recoloured on hover
      link.setAttribute('aria-label', img.getAttribute('alt') || text(link));
      link.style.setProperty('--footer-icon', `url("${img.src}")`);
      link.classList.add('footer-social-icon');
      img.remove();
    }
  });
  return list;
}

/**
 * Turns an image-only link into a trigger that opens the linked page in an
 * overlay dialog (iframe) instead of navigating away.
 */
function buildOverlayLink(link) {
  const label = link.querySelector('img')?.getAttribute('alt') || text(link);
  link.classList.add('footer-badge');
  link.setAttribute('aria-haspopup', 'dialog');
  if (label) link.setAttribute('aria-label', label);

  let dialog;
  const close = () => {
    if (!dialog?.open) return;
    dialog.close();
  };
  const onMessage = (event) => {
    if (event.data === 'closeModal') close();
  };

  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (!dialog) {
      dialog = el('dialog', { class: 'footer-overlay', 'aria-label': label || null, id: uid('footer-overlay') });
      const frame = el('iframe', {
        src: link.href,
        title: label || link.href,
        sandbox: 'allow-forms allow-scripts allow-same-origin allow-popups',
      });
      dialog.append(frame);
      // clicking the backdrop (outside the frame) closes the overlay
      dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
      dialog.addEventListener('close', () => {
        document.body.style.overflow = '';
        link.classList.remove('is-open');
        window.removeEventListener('message', onMessage);
        link.focus();
      });
      // a modal <dialog> renders in the top layer, so it can live inside the block
      (link.closest('.footer') || document.body).append(dialog);
    }
    link.setAttribute('aria-controls', dialog.id);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    link.classList.add('is-open');
    // the framed page may ask to be closed via postMessage('closeModal')
    window.addEventListener('message', onMessage);
  });
  return link;
}

function buildNotice(section) {
  if (!section) return null;
  const notice = el('div', { class: 'footer-notice' });
  section.querySelectorAll(':scope > p').forEach((p) => {
    const links = [...p.querySelectorAll('a')];
    const imageOnly = links.length === 1 && links[0].querySelector('img') && !text(links[0]);
    if (imageOnly) {
      notice.append(el('div', { class: 'footer-badge-wrapper' }, buildOverlayLink(links[0])));
    } else if (text(p)) {
      p.className = 'footer-copyright';
      p.querySelectorAll('a').forEach(prepareLink);
      notice.append(p);
    }
  });
  return notice.children.length ? notice : null;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const [brandSection, socialSection, legalSection, noticeSection] = [...fragment.querySelectorAll(':scope > div')];

  const top = el(
    'div',
    { class: 'footer-top' },
    buildBrand(brandSection),
    buildLinkList(brandSection, 'footer-primary'),
    buildSocial(socialSection),
  );

  const bottom = el(
    'div',
    { class: 'footer-bottom' },
    buildLinkList(legalSection, 'footer-legal'),
    buildNotice(noticeSection),
  );

  const container = el('div', { class: 'footer-container' });
  if (top.children.length) container.append(top);
  if (top.children.length && bottom.children.length) container.append(el('hr', { class: 'footer-divider' }));
  if (bottom.children.length) container.append(bottom);
  block.append(container);
}
