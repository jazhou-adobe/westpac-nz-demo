/*
 * Header block
 *
 * All copy, links and images come from the nav fragment (content/nav.plain.html).
 * This file only reads that fragment and builds the interactive chrome around it
 * (megamenu triggers, login selector, search dialog, hamburger).
 *
 * Expected fragment sections (top-level <div>s, in order):
 *   1. brand       – logo link
 *   2. segments    – list of audience links (<strong> marks the active one)
 *   3. utilities   – list of icon links
 *   4. login       – list of login destinations + paragraph with the login button label
 *   5. search      – heading + link (href = search results URL, text = placeholder)
 *   6. secondary   – list of main nav items; plain-text items open a megamenu
 *   7+ megamenus   – heading (matches a plain-text item in 6), intro link, list of cards
 */

const DESKTOP_QUERY = window.matchMedia('(min-width: 1200px)');
const LOGIN_STORAGE_KEY = 'header-login-choice';

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
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) then /nav.plain.html (DA/EDS production).
 * @returns {Promise<HTMLElement|null>}
 */
async function fetchNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
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

/* ---------------------------------------------------------------- */
/* open / close state                                                */
/* ---------------------------------------------------------------- */

function closeAll(block, except) {
  block.querySelectorAll('.nav-mega-trigger[aria-expanded="true"], .nav-login-toggle[aria-expanded="true"]')
    .forEach((button) => {
      if (button !== except) button.setAttribute('aria-expanded', 'false');
    });
}

function closeSearch(block, restoreFocus = true) {
  const modal = block.querySelector('.nav-search-modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = '';
  if (restoreFocus) block.querySelector('.nav-search-button')?.focus();
}

function openSearch(block) {
  const modal = block.querySelector('.nav-search-modal');
  if (!modal) return;
  closeAll(block);
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  modal.querySelector('input')?.focus();
}

/* ---------------------------------------------------------------- */
/* builders                                                          */
/* ---------------------------------------------------------------- */

function buildBrand(section) {
  const link = section?.querySelector('a');
  if (!link) return null;
  const brand = el('a', { class: 'nav-brand', href: link.getAttribute('href') || '/' });
  const img = link.querySelector('img');
  if (img) {
    img.classList.add('nav-logo');
    img.removeAttribute('width');
    img.removeAttribute('height');
    brand.append(img);
    brand.setAttribute('aria-label', img.getAttribute('alt') || text(link) || 'Home');
  } else {
    brand.textContent = text(link);
  }
  return brand;
}

function buildLinkList(section, navClass, label) {
  const list = section?.querySelector('ul');
  if (!list) return null;
  const ul = el('ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const link = li.querySelector('a');
    if (!link) return;
    const item = el('li');
    const a = el('a', { href: link.getAttribute('href') });
    const icon = link.querySelector('img');
    if (icon) {
      icon.classList.add('nav-utility-icon');
      icon.setAttribute('aria-hidden', 'true');
      a.append(icon);
    }
    a.append(text(link));
    if (li.querySelector('strong, b')) a.classList.add('nav-segment-active');
    item.append(a);
    ul.append(item);
  });
  return el('nav', { class: navClass, 'aria-label': label }, ul);
}

function buildLogin(section, block) {
  const list = section?.querySelector('ul');
  if (!list) return null;
  const options = [...list.querySelectorAll(':scope > li a')]
    .map((a) => ({ label: text(a), href: a.getAttribute('href') }))
    .filter((o) => o.label && o.href);
  if (!options.length) return null;

  const buttonLabel = text([...section.querySelectorAll(':scope > p')].find((p) => !p.querySelector('a')))
    || 'Login';
  let selected = options[0];
  try {
    const stored = window.localStorage.getItem(LOGIN_STORAGE_KEY);
    selected = options.find((o) => o.href === stored) || selected;
  } catch (e) {
    // storage unavailable – keep default
  }

  const listId = uid('nav-login-list');
  const toggle = el('button', {
    type: 'button',
    class: 'nav-login-toggle',
    'aria-expanded': 'false',
    'aria-controls': listId,
  }, selected.label);
  const ul = el('ul', { class: 'nav-login-list', id: listId });
  const loginButton = el('button', { type: 'button', class: 'nav-login-button' }, buttonLabel);

  const render = () => {
    toggle.textContent = selected.label;
    ul.querySelectorAll('a').forEach((a) => {
      const active = a.getAttribute('href') === selected.href;
      a.classList.toggle('nav-login-active', active);
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  };

  options.forEach((option) => {
    const a = el('a', { href: option.href }, option.label);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      selected = option;
      try {
        window.localStorage.setItem(LOGIN_STORAGE_KEY, option.href);
      } catch (err) {
        // ignore storage errors
      }
      render();
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    });
    ul.append(el('li', {}, a));
  });

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    closeAll(block, toggle);
    toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  });
  loginButton.addEventListener('click', () => {
    window.location.href = selected.href;
  });

  render();
  return el('nav', { class: 'nav-login', 'aria-label': 'Login' }, toggle, ul, loginButton);
}

function buildSearch(section) {
  const link = section?.querySelector('a');
  if (!link) return { button: null, modal: null };
  const placeholder = text(link) || 'Search';
  const headingText = text(section.querySelector('h1, h2, h3, h4, h5, h6'));
  const headingId = uid('nav-search-title');

  const button = el('button', {
    type: 'button',
    class: 'nav-search-button',
    'aria-label': placeholder,
    'aria-haspopup': 'dialog',
  });

  const input = el('input', {
    type: 'search',
    name: 'q',
    class: 'nav-search-input',
    placeholder,
    'aria-label': placeholder,
    autocomplete: 'off',
  });
  const submit = el('button', { type: 'submit', class: 'nav-search-submit', 'aria-label': placeholder });
  const form = el('form', {
    class: 'nav-search-form',
    action: link.getAttribute('href'),
    method: 'get',
    role: 'search',
  }, input, submit);

  const close = el('button', { type: 'button', class: 'nav-search-close', 'aria-label': 'Close search' }, el('span'));
  const modal = el(
    'div',
    {
      class: 'nav-search-modal',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': headingText ? headingId : null,
      'aria-label': headingText ? null : placeholder,
      hidden: true,
    },
    close,
    el(
      'div',
      { class: 'nav-search-inner' },
      headingText ? el('h2', { class: 'nav-search-heading', id: headingId }, headingText) : null,
      form,
    ),
  );
  return {
    button, modal, close, form, input,
  };
}

function buildMegamenu(section) {
  const panel = el('div', { class: 'nav-mega' });
  const intro = [...section.querySelectorAll(':scope > p a')][0];
  if (intro) {
    panel.append(el('a', { class: 'nav-mega-intro', href: intro.getAttribute('href') }, text(intro)));
  }
  const grid = el('ul', { class: 'nav-mega-grid' });
  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    const link = li.querySelector('a');
    if (!link) return;
    const summary = [...li.querySelectorAll('p')].filter((p) => !p.querySelector('a')).map(text).join(' ')
      || text(li).replace(text(link), '').trim();
    const card = el(
      'a',
      { class: 'nav-mega-link', href: link.getAttribute('href') },
      el('span', { class: 'nav-mega-title' }, text(link)),
      summary ? el('p', { class: 'nav-mega-summary' }, summary) : null,
    );
    grid.append(el('li', { class: 'nav-mega-card' }, card));
  });
  if (!intro) grid.classList.add('nav-mega-grid-no-intro');
  panel.append(grid);
  return panel;
}

function buildSecondary(section, megaSections, block) {
  const list = section?.querySelector('ul');
  if (!list) return null;
  const megaByLabel = new Map();
  megaSections.forEach((sec) => {
    const heading = sec.querySelector('h1, h2, h3, h4, h5, h6');
    if (heading) megaByLabel.set(text(heading).toLowerCase(), sec);
  });

  const ul = el('ul');
  list.querySelectorAll(':scope > li').forEach((li) => {
    const link = li.querySelector(':scope > a, :scope > p > a, :scope > strong > a');
    const item = el('li', { class: 'nav-secondary-item' });
    if (link) {
      item.append(el('a', { class: 'nav-secondary-link', href: link.getAttribute('href') }, text(link)));
      ul.append(item);
      return;
    }
    const label = text(li);
    const megaSection = megaByLabel.get(label.toLowerCase());
    if (!label) return;
    if (!megaSection) {
      item.append(el('span', { class: 'nav-secondary-link' }, label));
      ul.append(item);
      return;
    }
    const panel = buildMegamenu(megaSection);
    panel.id = uid('nav-mega');
    const trigger = el('button', {
      type: 'button',
      class: 'nav-mega-trigger',
      'aria-expanded': 'false',
      'aria-controls': panel.id,
    }, label);
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      closeAll(block, trigger);
      trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    item.classList.add('nav-has-mega');
    item.append(trigger, panel);
    ul.append(item);
  });
  return el('nav', { class: 'nav-secondary', 'aria-label': 'Secondary' }, ul);
}

/* ---------------------------------------------------------------- */
/* mobile menu (hamburger)                                           */
/* ---------------------------------------------------------------- */

function setMobileMenu(wrapper, open) {
  const button = wrapper.querySelector('.nav-hamburger button');
  if (!button) return;
  const isOpen = open && !DESKTOP_QUERY.matches;
  wrapper.classList.toggle('nav-mobile-open', isOpen);
  button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  button.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((child) => child.tagName === 'DIV');
  const [
    brandSec, segmentSec, utilitySec, loginSec, searchSec, secondarySec, ...megaSecs
  ] = sections;

  const wrapper = el('div', { class: 'nav-wrapper' });

  // row 0 – brand bar
  const top = el('div', { class: 'nav-top' });
  const hamburgerButton = el('button', {
    type: 'button',
    'aria-label': 'Open navigation',
    'aria-expanded': 'false',
  }, el('span', { class: 'nav-hamburger-icon' }));
  top.append(el('div', { class: 'nav-hamburger' }, hamburgerButton));

  const brand = buildBrand(brandSec);
  if (brand) top.append(brand);

  const segments = buildLinkList(segmentSec, 'nav-segments', 'Main');
  if (segments) top.append(segments);

  const tools = el('div', { class: 'nav-tools' });
  const utilities = buildLinkList(utilitySec, 'nav-utilities', 'utilities');
  if (utilities) tools.append(utilities);
  const login = buildLogin(loginSec, block);
  if (login) tools.append(login);
  const search = buildSearch(searchSec);
  if (search.button) tools.append(search.button);
  top.append(tools);
  wrapper.append(top);

  // row 1 – secondary nav with megamenus
  const secondary = buildSecondary(secondarySec, megaSecs, block);
  if (secondary) wrapper.append(secondary);

  block.append(wrapper);
  if (search.modal) block.append(search.modal);

  /* ---- behaviour ---- */
  if (search.button) {
    search.button.addEventListener('click', () => openSearch(block));
    search.close.addEventListener('click', () => closeSearch(block));
    search.form.addEventListener('submit', (e) => {
      if (!search.input.value.trim()) e.preventDefault();
    });
  }

  hamburgerButton.addEventListener('click', () => {
    setMobileMenu(wrapper, hamburgerButton.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', (e) => {
    if (!block.contains(e.target)) closeAll(block);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const searchModal = block.querySelector('.nav-search-modal');
    if (searchModal && !searchModal.hidden) {
      closeSearch(block);
      return;
    }
    const open = block.querySelector('.nav-mega-trigger[aria-expanded="true"], .nav-login-toggle[aria-expanded="true"]');
    closeAll(block);
    if (open && block.contains(document.activeElement)) open.focus();
    if (wrapper.classList.contains('nav-mobile-open')) {
      setMobileMenu(wrapper, false);
      hamburgerButton.focus();
    }
  });

  block.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !block.contains(e.relatedTarget)) closeAll(block);
  });

  // reset transient state when crossing the desktop breakpoint
  DESKTOP_QUERY.addEventListener('change', () => {
    closeAll(block);
    setMobileMenu(wrapper, false);
  });
}
