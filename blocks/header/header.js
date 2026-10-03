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
 *   mobile-only    – a list of icon links (mobile utility labels) and, per audience
 *                    segment, a section whose heading is the segment link followed by a
 *                    nested list (group link > child links). The active segment's mobile
 *                    panel is built from the secondary nav + megamenus.
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

function buildLogin(section, block, onMobileOpen) {
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
    // mobile: the login button opens the login drawer instead of navigating
    if (!DESKTOP_QUERY.matches && onMobileOpen) {
      onMobileOpen(loginButton);
      return;
    }
    window.location.href = selected.href;
  });

  render();
  return {
    nav: el('nav', { class: 'nav-login', 'aria-label': 'Login' }, toggle, ul, loginButton),
    options,
  };
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
/* mobile drawer (hamburger) – slide-in segment panels + accordions  */
/* ---------------------------------------------------------------- */

const PANEL_TRANSITION_MS = 300;

function headingOf(section) {
  return section.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
}

/** groups for the active segment, derived from the secondary nav + megamenus */
function groupsFromSecondary(secondarySec, megaSections) {
  const list = secondarySec?.querySelector('ul');
  if (!list) return [];
  return [...list.querySelectorAll(':scope > li')].map((li) => {
    const link = li.querySelector('a');
    if (link) return { label: text(link), href: link.getAttribute('href'), children: [] };
    const label = text(li);
    const sec = megaSections.find((m) => text(headingOf(m)).toLowerCase() === label.toLowerCase());
    if (!sec) return { label, href: null, children: [] };
    const intro = sec.querySelector(':scope > p a');
    const children = [...sec.querySelectorAll(':scope > ul > li')].map((card) => card.querySelector('a'))
      .filter(Boolean).map((a) => ({ label: text(a), href: a.getAttribute('href') }));
    return { label, href: intro ? intro.getAttribute('href') : null, children };
  }).filter((g) => g.label);
}

/** groups from a mobile-only segment section (heading link + nested list) */
function groupsFromSegmentSection(section) {
  const list = section.querySelector(':scope > ul');
  if (!list) return [];
  return [...list.querySelectorAll(':scope > li')].map((li) => {
    const link = li.querySelector(':scope > a, :scope > p > a');
    const sub = li.querySelector(':scope > ul');
    const children = sub ? [...sub.querySelectorAll(':scope > li > a, :scope > li > p > a')]
      .map((a) => ({ label: text(a), href: a.getAttribute('href') })) : [];
    return { label: text(link) || text(li), href: link ? link.getAttribute('href') : null, children };
  }).filter((g) => g.label);
}

function buildGroupItem(group, panel) {
  const item = el('li', { class: 'nav-panel-item' });
  item.append(group.href
    ? el('a', { href: group.href }, group.label)
    : el('span', { class: 'nav-panel-label' }, group.label));
  if (!group.children.length) {
    item.classList.add('nav-panel-item-leaf');
    return item;
  }
  const groupId = uid('nav-group');
  const toggle = el('button', {
    type: 'button',
    class: 'nav-group-toggle',
    'aria-expanded': 'false',
    'aria-controls': groupId,
    'aria-label': `Show ${group.label} links`,
  }, el('span', { class: 'nav-sr' }, group.label));
  const sub = el('ul', { class: 'nav-group', id: groupId });
  group.children.forEach((c) => sub.append(el('li', {}, el('a', { href: c.href }, c.label))));
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    // single-expand: collapse the other groups in this panel
    panel.querySelectorAll('.nav-group-toggle[aria-expanded="true"]').forEach((other) => {
      if (other === toggle) return;
      other.setAttribute('aria-expanded', 'false');
      other.nextElementSibling.style.maxHeight = '0px';
    });
    toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    sub.style.maxHeight = open ? '0px' : `${sub.scrollHeight}px`;
  });
  item.append(toggle, sub);
  return item;
}

function showPanel(panel) {
  panel.classList.remove('nav-panel-hidden');
  // force a reflow so the slide-in transition runs from the off-canvas position
  panel.getBoundingClientRect();
  panel.classList.add('nav-panel-active');
}

function hidePanel(panel) {
  panel.classList.remove('nav-panel-active');
  setTimeout(() => {
    if (!panel.classList.contains('nav-panel-active')) panel.classList.add('nav-panel-hidden');
  }, PANEL_TRANSITION_MS);
}

function resetGroups(scope) {
  scope.querySelectorAll('.nav-group-toggle[aria-expanded="true"]').forEach((t) => {
    t.setAttribute('aria-expanded', 'false');
    t.nextElementSibling.style.maxHeight = '0px';
  });
}

function buildDrawer({
  segmentSec, mobileUtilitySec, utilitySec, segmentSections, secondarySec, megaSections,
}) {
  const content = el('div', { class: 'nav-content' });
  const root = el('div', { class: 'nav-panel nav-panel-root nav-panel-active', 'data-depth': '0' });
  root.append(el('div', { class: 'nav-panel-head' }));
  const rootList = el('ul', { class: 'nav-panel-list' });
  root.append(rootList);
  content.append(root);

  const segLinks = [...(segmentSec?.querySelectorAll('ul > li') || [])].map((li) => {
    const a = li.querySelector('a');
    return a ? { label: text(a), href: a.getAttribute('href'), active: !!li.querySelector('strong, b') } : null;
  }).filter(Boolean);

  segLinks.forEach((seg) => {
    const item = el('li', { class: `nav-panel-item${seg.active ? ' nav-panel-item-current' : ''}` }, el('a', { href: seg.href }, seg.label));
    const section = segmentSections.find((s) => {
      const link = headingOf(s).querySelector('a');
      return text(link).toLowerCase() === seg.label.toLowerCase();
    });
    let groups = [];
    if (section) groups = groupsFromSegmentSection(section);
    else if (seg.active) groups = groupsFromSecondary(secondarySec, megaSections);
    if (groups.length) {
      const panel = el('div', { class: 'nav-panel nav-panel-hidden', 'data-depth': '1', id: uid('nav-panel') });
      const back = el('button', { type: 'button', class: 'nav-back', 'aria-label': 'Back' });
      const titleLink = section ? headingOf(section).querySelector('a') : null;
      panel.append(el(
        'div',
        { class: 'nav-panel-title' },
        back,
        el('span', {}, el('a', { href: titleLink ? titleLink.getAttribute('href') : seg.href }, seg.label)),
      ));
      const list = el('ul', { class: 'nav-panel-list' });
      groups.forEach((g) => list.append(buildGroupItem(g, panel)));
      panel.append(list);
      content.append(panel);

      const next = el('button', {
        type: 'button',
        class: 'nav-panel-next',
        'aria-controls': panel.id,
        'aria-label': `Show ${seg.label} menu`,
      }, el('span', { class: 'nav-sr' }, seg.label));
      next.addEventListener('click', () => {
        showPanel(panel);
        setTimeout(() => back.focus(), PANEL_TRANSITION_MS);
      });
      back.addEventListener('click', () => {
        hidePanel(panel);
        resetGroups(panel);
        next.focus();
      });
      item.append(next);
    } else {
      item.classList.add('nav-panel-item-leaf');
    }
    rootList.append(item);
  });

  // utilities (mobile labels when provided, else desktop labels)
  const utilSource = mobileUtilitySec || utilitySec;
  const utilList = el('ul', { class: 'nav-drawer-utilities' });
  [...(utilSource?.querySelectorAll('ul > li') || [])].forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const link = el('a', { href: a.getAttribute('href') });
    const img = a.querySelector('img');
    if (img) {
      const icon = img.cloneNode(true);
      icon.className = 'nav-utility-icon';
      icon.setAttribute('aria-hidden', 'true');
      link.append(icon);
    }
    link.append(text(a));
    utilList.append(el('li', {}, link));
  });
  if (utilList.children.length) root.append(utilList);

  return el('nav', { class: 'nav-drawer', 'aria-label': 'Mobile navigation', hidden: true }, content);
}

function buildLoginDrawer(brand, options) {
  if (!options?.length) return null;
  const close = el('button', { type: 'button', class: 'nav-login-drawer-close', 'aria-label': 'Close login menu' }, el('span'));
  const head = el('div', { class: 'nav-login-drawer-head' });
  if (brand) {
    const logo = brand.cloneNode(true);
    logo.className = 'nav-login-drawer-brand';
    head.append(logo);
  }
  head.append(close);
  const list = el('ul', { class: 'nav-login-drawer-list' });
  options.forEach((o) => list.append(el('li', {}, el('a', { href: o.href }, o.label))));
  return el('nav', { class: 'nav-login-drawer', 'aria-label': 'Login options', hidden: true }, head, list);
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
    brandSec, segmentSec, utilitySec, loginSec, searchSec, secondarySec, ...rest
  ] = sections;
  const megaSections = rest.filter((s) => headingOf(s) && !headingOf(s).querySelector('a'));
  const segmentSections = rest.filter((s) => headingOf(s)?.querySelector('a'));
  const mobileUtilitySec = rest.find((s) => !headingOf(s) && s.querySelector('ul img'));

  const wrapper = el('div', { class: 'nav-wrapper' });

  // row 0 – brand bar
  const top = el('div', { class: 'nav-top' });
  const hamburgerButton = el('button', {
    type: 'button',
    'aria-label': 'Open navigation',
    'aria-expanded': 'false',
  }, el('span', { class: 'nav-hamburger-icon' }));
  const hamburger = el('div', { class: 'nav-hamburger' }, hamburgerButton);
  top.append(hamburger);

  const brand = buildBrand(brandSec);
  if (brand) top.append(brand);

  const segments = buildLinkList(segmentSec, 'nav-segments', 'Main');
  if (segments) top.append(segments);

  const tools = el('div', { class: 'nav-tools' });
  const utilities = buildLinkList(utilitySec, 'nav-utilities', 'utilities');
  if (utilities) tools.append(utilities);

  // mobile drawers + shared overlay
  const overlay = el('div', { class: 'nav-mobile-overlay', hidden: true });
  const drawer = buildDrawer({
    segmentSec, mobileUtilitySec, utilitySec, segmentSections, secondarySec, megaSections,
  });
  let loginDrawer = null;
  let lastOpener = null;

  const lockScroll = (lock) => { document.body.style.overflow = lock ? 'hidden' : ''; };

  const openLayer = (layer, cls) => {
    layer.hidden = false;
    overlay.hidden = false;
    layer.getBoundingClientRect();
    wrapper.classList.add(cls);
    lockScroll(true);
  };
  const closeLayer = (layer, cls) => {
    if (!layer || !wrapper.classList.contains(cls)) return;
    wrapper.classList.remove(cls);
    setTimeout(() => {
      if (wrapper.classList.contains(cls)) return;
      layer.hidden = true;
      if (!wrapper.classList.contains('nav-mobile-open') && !wrapper.classList.contains('nav-login-open')) {
        overlay.hidden = true;
      }
    }, PANEL_TRANSITION_MS);
    if (!wrapper.classList.contains('nav-mobile-open') && !wrapper.classList.contains('nav-login-open')) {
      lockScroll(false);
    }
  };

  const resetDrawer = () => {
    drawer.querySelectorAll('.nav-panel[data-depth="1"]').forEach((p) => {
      p.classList.remove('nav-panel-active');
      p.classList.add('nav-panel-hidden');
    });
    resetGroups(drawer);
  };

  const setMobileMenu = (open) => {
    const isOpen = open && !DESKTOP_QUERY.matches;
    if (isOpen) {
      resetDrawer();
      openLayer(drawer, 'nav-mobile-open');
    } else {
      closeLayer(drawer, 'nav-mobile-open');
    }
    hamburgerButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    hamburgerButton.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  };

  const setLoginDrawer = (open, opener) => {
    if (!loginDrawer) return;
    if (open && !DESKTOP_QUERY.matches) {
      lastOpener = opener || null;
      openLayer(loginDrawer, 'nav-login-open');
      loginDrawer.querySelector('.nav-login-drawer-close').focus();
    } else {
      closeLayer(loginDrawer, 'nav-login-open');
      if (lastOpener) lastOpener.focus();
      lastOpener = null;
    }
  };

  const login = buildLogin(loginSec, block, (opener) => setLoginDrawer(true, opener));
  if (login) {
    tools.append(login.nav);
    loginDrawer = buildLoginDrawer(brand, login.options);
    loginDrawer?.querySelector('.nav-login-drawer-close')
      .addEventListener('click', () => setLoginDrawer(false));
  }
  const search = buildSearch(searchSec);
  if (search.button) tools.append(search.button);
  top.append(tools);
  wrapper.append(top);

  // row 1 – secondary nav with megamenus (desktop)
  const secondary = buildSecondary(secondarySec, megaSections, block);
  if (secondary) wrapper.append(secondary);

  // the mobile drawers only live in the DOM below the desktop breakpoint
  const mobileLayers = [overlay, drawer, loginDrawer].filter(Boolean);
  const mountMobileLayers = () => {
    if (DESKTOP_QUERY.matches) mobileLayers.forEach((layer) => layer.remove());
    else mobileLayers.forEach((layer) => { if (!layer.isConnected) wrapper.append(layer); });
  };
  mountMobileLayers();
  block.append(wrapper);
  if (search.modal) block.append(search.modal);

  /* ---- behaviour ---- */
  if (search.button) {
    search.button.addEventListener('click', () => {
      setMobileMenu(false);
      setLoginDrawer(false);
      openSearch(block);
    });
    search.close.addEventListener('click', () => closeSearch(block));
    search.form.addEventListener('submit', (e) => {
      if (!search.input.value.trim()) e.preventDefault();
    });
  }

  // listen on the wrapper so both the button and its container toggle the menu
  hamburger.addEventListener('click', () => {
    setMobileMenu(hamburgerButton.getAttribute('aria-expanded') !== 'true');
  });

  overlay.addEventListener('click', () => {
    setMobileMenu(false);
    setLoginDrawer(false);
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
    if (wrapper.classList.contains('nav-login-open')) {
      setLoginDrawer(false);
      return;
    }
    if (wrapper.classList.contains('nav-mobile-open')) {
      setMobileMenu(false);
      hamburgerButton.focus();
      return;
    }
    const open = block.querySelector('.nav-mega-trigger[aria-expanded="true"], .nav-login-toggle[aria-expanded="true"]');
    closeAll(block);
    if (open && block.contains(document.activeElement)) open.focus();
  });

  block.addEventListener('focusout', (e) => {
    if (e.relatedTarget && !block.contains(e.relatedTarget)) closeAll(block);
  });

  // reset transient state when crossing the desktop breakpoint (resize / rotate)
  DESKTOP_QUERY.addEventListener('change', () => {
    closeAll(block);
    setMobileMenu(false);
    setLoginDrawer(false);
    resetDrawer();
    mountMobileLayers();
  });
}
