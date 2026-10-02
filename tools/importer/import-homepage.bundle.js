/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-campaign.js
  function parse(element, { document: document2 }) {
    const left = element.querySelector(".page-header__left, .page-header__content") || element;
    const heading = left.querySelector("h1, .page-header__title, h2");
    const summary = left.querySelector(".page-header__summary, p.lead");
    const disclaimer = left.querySelector(".page-header__disclaimer");
    const extraParas = Array.from(left.querySelectorAll("p")).filter(
      (p) => p !== summary && p !== disclaimer && !p.closest('.page-header__links, nav, .breadcrumb, [class*="breadcrumb"]') && p.textContent.trim()
    );
    let links = Array.from(left.querySelectorAll(".page-header__links a[href]"));
    if (!links.length) {
      links = Array.from(left.querySelectorAll("a.btn[href], a.page-header__link[href]")).filter((a) => !a.closest('nav, .breadcrumb, [class*="breadcrumb"]'));
    }
    let image = element.querySelector(
      ".page-header__right img, .page-header__lifestyle-image img, .page-header__image img"
    );
    if (!image) {
      const bgEl = element.querySelector('.page-header__lifestyle-image, .page-header__image, [style*="background-image"]');
      const style = bgEl && bgEl.getAttribute("style");
      const m = style && style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
      let src = m && m[1];
      if (!src) {
        const css = Array.from(element.querySelectorAll("style")).map((s) => s.textContent).join("\n");
        const urls = [...css.matchAll(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/gi)].map((x) => x[1]);
        src = urls[urls.length - 1];
      }
      if (src) {
        image = document2.createElement("img");
        image.src = src;
      }
    }
    if (image) {
      const imgHolder = element.querySelector(
        '.page-header__lifestyle-image[aria-label], .page-header__image[aria-label], [role="img"][aria-label]'
      );
      const labelled = element.querySelector(".page-header__right [aria-label], .page-header__right [title]");
      const alt = imgHolder && imgHolder.getAttribute("aria-label") || image.getAttribute("alt") || image.closest && image.closest("[aria-label]") && image.closest("[aria-label]").getAttribute("aria-label") || labelled && (labelled.getAttribute("aria-label") || labelled.getAttribute("title")) || image.getAttribute("title") || "";
      image.setAttribute("alt", alt.trim());
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
      const p = document2.createElement("p");
      p.append(a);
      content.push(p);
    });
    const cells = [];
    if (image) cells.push([image]);
    cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-campaign", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  function parse2(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll('[class*="tile-item__wrapper"]')).map((wrapper) => {
      const tile = wrapper.closest(".tile-item, a") || wrapper.parentElement;
      return { wrapper, tile };
    });
    if (!items.length) {
      items = Array.from(element.querySelectorAll(":scope > .tile-item, :scope > a")).map((tile) => ({
        wrapper: tile,
        tile
      }));
    }
    const cells = [];
    items.forEach(({ wrapper, tile }) => {
      let icon = null;
      if (tile && tile !== wrapper) {
        icon = Array.from(tile.querySelectorAll("img")).find((img) => !wrapper.contains(img)) || null;
      }
      if (!icon) icon = wrapper.querySelector("img");
      const labelEl = wrapper.querySelector(".tile-item__cta, .tile-item__title, h2, h3, h4, span, strong");
      const label = (labelEl ? labelEl.textContent : wrapper.textContent).trim();
      const anchor = wrapper.closest("a[href]") || tile && tile.querySelector("a[href]");
      const href = anchor ? anchor.getAttribute("href") : null;
      const body = [];
      if (label) {
        const p = document2.createElement("p");
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = label;
          p.append(a);
        } else {
          p.textContent = label;
        }
        body.push(p);
      }
      const desc = wrapper.querySelector(".tile-item__description, .tile-item__summary, p");
      if (desc && desc !== labelEl && desc.textContent.trim() && desc.textContent.trim() !== label) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        body.push(p);
      }
      if (!icon && !body.length) return;
      cells.push([icon || "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-icon", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-quicklink.js
  function parse3(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(".quick-link-item__text")).map((labelEl) => ({
      labelEl,
      tile: labelEl.closest(".quick-link-item, a") || labelEl.parentElement
    }));
    if (!items.length) {
      items = Array.from(element.querySelectorAll(".quick-link-item, :scope > a")).map((tile) => ({
        labelEl: null,
        tile
      }));
    }
    const cells = [];
    items.forEach(({ labelEl, tile }) => {
      const icon = tile.querySelector("img");
      const label = (labelEl ? labelEl.textContent : tile.textContent).trim() || icon && icon.getAttribute("alt") || "";
      const anchor = labelEl && labelEl.closest("a[href]") || (tile.matches("a[href]") ? tile : tile.querySelector("a[href]"));
      let body = "";
      if (label) {
        const p = document2.createElement("p");
        if (anchor) {
          const a = document2.createElement("a");
          a.href = anchor.getAttribute("href");
          a.textContent = label;
          p.append(a);
        } else {
          p.textContent = label;
        }
        body = p;
      }
      if (!icon && !body) return;
      cells.push([icon || "", body]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-quicklink", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-rate.js
  function parse4(element, { document: document2 }) {
    let inners = Array.from(element.querySelectorAll(".pricing-card__inner"));
    if (!inners.length) inners = Array.from(element.querySelectorAll(".pricing-card"));
    inners = inners.filter((el) => !el.closest(".slick-cloned"));
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    inners.forEach((inner) => {
      const anchor = inner.closest("a[href]") || inner.querySelector("a[href]");
      const card = inner.closest(".pricing-card") || inner;
      const key = card.id || null;
      if (key) {
        if (seen.has(key)) return;
        seen.add(key);
      }
      const content = [];
      const eyebrow = inner.querySelector(".pricing-card__special-label");
      if (eyebrow && eyebrow.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = eyebrow.textContent.trim();
        content.push(p);
      }
      const titleEl = inner.querySelector(".pricing-card__title, h3, h2");
      if (titleEl && titleEl.textContent.trim()) {
        const h3 = document2.createElement("h3");
        h3.textContent = titleEl.textContent.trim();
        content.push(h3);
      }
      const number = inner.querySelector(".pricing-card__number");
      if (number && number.textContent.trim()) {
        const pct = inner.querySelector(".pricing-card__percentage");
        const sub = inner.querySelector(".pricing-card__subunit");
        const parts = [
          `${number.textContent.trim()}${pct ? pct.textContent.trim() : ""}`,
          sub ? sub.textContent.trim() : ""
        ].filter(Boolean);
        const p = document2.createElement("p");
        p.textContent = parts.join(" ");
        content.push(p);
      }
      const subtitle = inner.querySelector(".pricing-card__subtitle, h4");
      const linkText = subtitle && subtitle.textContent.trim() || "";
      if (linkText || anchor) {
        const h4 = document2.createElement("h4");
        if (anchor) {
          const a = document2.createElement("a");
          a.href = anchor.getAttribute("href");
          a.textContent = linkText || (titleEl ? titleEl.textContent.trim() : "Learn more");
          h4.append(a);
        } else {
          h4.textContent = linkText;
        }
        content.push(h4);
      }
      const desc = inner.querySelector(".pricing-card__description");
      if (desc && desc.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = desc.textContent.trim();
        content.push(p);
      }
      if (content.length) cells.push([content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-rate", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-promo.js
  function parse5(element, { document: document2 }) {
    const contentEl = element.querySelector(".promo-block__content") || element;
    const imageWrap = element.querySelector(".promo-block__image-wrap, .promo-block__image-wrapper");
    const image = imageWrap && imageWrap.querySelector("img") || element.querySelector("img.promo-block__image");
    const text = [];
    const logo = contentEl.querySelector('.promo-block__logo img, [class*="logo"] img');
    if (logo && logo !== image) text.push(logo);
    const heading = contentEl.querySelector("h1, h2, h3, .promo-block__title");
    if (heading) text.push(heading);
    Array.from(contentEl.querySelectorAll("p, ul, ol")).forEach((el) => {
      if (el.closest(".promo-block__buttons")) return;
      if (el.parentElement && el.parentElement.closest("p, ul, ol") && contentEl.contains(el.parentElement.closest("p, ul, ol"))) return;
      if (!el.textContent.replace(/ /g, " ").trim() && !el.querySelector("img")) return;
      if (logo && el.contains(logo)) return;
      text.push(el);
    });
    let ctas = Array.from(contentEl.querySelectorAll(".promo-block__buttons a[href], .promo-block__cta a[href]"));
    ctas = ctas.filter((a, i) => ctas.indexOf(a) === i);
    if (!ctas.length) {
      ctas = Array.from(contentEl.querySelectorAll("a.btn[href]")).filter((a) => !text.some((t) => t.contains(a)));
    }
    ctas.forEach((a) => {
      a.textContent = a.textContent.trim();
      const p = document2.createElement("p");
      p.append(a);
      text.push(p);
    });
    if (!text.length && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const imageFirst = element.classList.contains("promo-block--left");
    const row = imageFirst ? [image || "", text] : [text, image || ""];
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-dropdown.js
  function cleanText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll(".u-sr-only, .sr-only, input").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function panelContent(panel, document2) {
    const tiles = Array.from(panel.querySelectorAll('[class*="tile-item__wrapper"], [class*="card__inner"], [class*="card__content"]'));
    if (tiles.length) {
      const ul = document2.createElement("ul");
      tiles.forEach((wrapper) => {
        const tile = wrapper.closest('.tile-item, [class*="card"]:not([class*="__"]), a') || wrapper;
        const li = document2.createElement("li");
        const img = Array.from(tile.querySelectorAll("img"))[0];
        if (img) li.append(img);
        const title = wrapper.querySelector('h2, h3, h4, h5, [class*="title"], [class*="cta"]');
        const anchor = wrapper.closest("a[href]") || tile.querySelector("a[href]");
        const titleText = title ? cleanText(title) : "";
        if (titleText) {
          const strong = document2.createElement("p");
          if (anchor) {
            const a = document2.createElement("a");
            a.href = anchor.getAttribute("href");
            a.textContent = titleText;
            strong.append(a);
          } else {
            strong.textContent = titleText;
          }
          li.append(strong);
        }
        wrapper.querySelectorAll("p").forEach((p) => {
          if (p !== title && !p.contains(title) && cleanText(p)) li.append(p);
        });
        if (li.textContent.trim() || li.querySelector("img")) ul.append(li);
      });
      return ul.children.length ? [ul] : [];
    }
    return Array.from(panel.childNodes).filter(
      (n) => n.nodeType === 1 && (n.textContent.trim() || n.querySelector("img")) || n.nodeType === 3 && n.textContent.trim()
    );
  }
  function parse6(element, { document: document2 }) {
    const prompt = element.querySelector(".content-switch-block__label, .content-switch-block__switch h2, .content-switch-block__switch h3");
    const helperEl = element.querySelector(".content-switch-block__content--desc");
    let topics = Array.from(element.querySelectorAll(".filter-dropdown__options li, .filter-dropdown__options label")).filter((el) => el.tagName === "LI" || !el.closest("li")).map((el) => {
      const input = el.querySelector("input");
      return { label: cleanText(el), id: input ? input.id || input.value || "" : "" };
    });
    if (!topics.length) {
      topics = Array.from(element.querySelectorAll("select option")).map((o) => ({
        label: o.textContent.trim(),
        id: o.value || ""
      }));
    }
    topics = topics.filter((t) => t.label);
    const host = element.querySelector(".content-switch-block__content:not(.content-switch-block__content--desc)");
    const panelChildren = host ? Array.from(host.children).filter((c) => c.textContent.trim() || c.querySelector("img")) : [];
    const panels = topics.map(() => []);
    if (panelChildren.length && topics.length) {
      let mapped = false;
      panelChildren.forEach((child) => {
        const attrs = [child.id, child.getAttribute("data-id"), child.getAttribute("data-filter"), child.getAttribute("data-value"), child.getAttribute("data-category")].filter(Boolean).join(" ");
        const idx = attrs ? topics.findIndex((t) => t.id && (attrs.includes(t.id) || t.id.includes(attrs))) : -1;
        if (idx > -1) {
          panels[idx].push(...panelContent(child, document2));
          mapped = true;
        }
      });
      if (!mapped) {
        if (panelChildren.length === topics.length && panelChildren.length > 1) {
          panelChildren.forEach((child, i) => panels[i].push(...panelContent(child, document2)));
        } else {
          panels[0].push(...panelContent(host, document2));
        }
      }
    }
    if (!prompt && !topics.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    const promptHeading = document2.createElement("h3");
    promptHeading.textContent = prompt ? cleanText(prompt) : "";
    let helper = "";
    if (helperEl && cleanText(helperEl)) {
      helper = document2.createElement("p");
      helper.textContent = cleanText(helperEl);
    }
    if (prompt || helper) cells.push([prompt ? promptHeading : "", helper]);
    topics.forEach((t, i) => {
      cells.push([t.label, panels[i].length ? panels[i] : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-dropdown", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-intro.js
  function parse7(element, { document: document2 }) {
    const heading = element.querySelector(":scope > h1, :scope > h2, :scope > h3, .content-block__title");
    const contentEl = element.querySelector(".content-block__content");
    let body = [];
    if (contentEl) {
      body = Array.from(contentEl.children).filter((el) => el.textContent.trim() || el.querySelector("img"));
    } else {
      body = Array.from(element.children).filter(
        (el) => el !== heading && (el.textContent.trim() || el.querySelector("img"))
      );
    }
    body.forEach((el) => {
      el.querySelectorAll("span").forEach((span) => {
        if (span.classList.contains("u-sr-only")) return;
        span.replaceWith(...span.childNodes);
      });
    });
    const extraCtas = Array.from(element.querySelectorAll('a.btn[href], [class*="content-block__button"] a[href]')).filter((a) => !body.some((el) => el.contains(a)));
    extraCtas.forEach((a) => {
      const p = document2.createElement("p");
      p.append(a);
      body.push(p);
    });
    if (!heading && !body.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[heading || "", body.length ? body : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-intro", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse8(element, { document: document2 }) {
    let items = Array.from(element.querySelectorAll(".carousel-item__content")).map((content) => {
      const item = content.closest(".carousel-item") || content.parentElement;
      return { content, item };
    });
    if (!items.length) {
      items = Array.from(element.querySelectorAll(".carousel-item")).map((item) => ({ content: item, item }));
    }
    items = items.filter(({ content }) => !content.closest(".slick-cloned"));
    const seen = /* @__PURE__ */ new Set();
    const cells = [];
    items.forEach(({ content, item }) => {
      const anchor = content.closest("a[href]") || item && item.querySelector("a[href]");
      const href = anchor ? anchor.getAttribute("href") : null;
      const key = item && item.id || href;
      if (key) {
        if (seen.has(key)) return;
        seen.add(key);
      }
      let image = null;
      if (item) {
        image = item.querySelector(".carousel-item__image-wrapper img, img.carousel-item__image") || Array.from(item.querySelectorAll("img")).find((img) => !content.contains(img)) || null;
      }
      const titleEl = content.querySelector(".carousel-item__title, h2, h3, h4");
      const summaryEl = content.querySelector(".carousel-item__summary, p");
      const body = [];
      const titleText = titleEl ? titleEl.textContent.trim() : "";
      if (titleText) {
        const h3 = document2.createElement("h3");
        if (href) {
          const a = document2.createElement("a");
          a.href = href;
          a.textContent = titleText;
          h3.append(a);
        } else {
          h3.textContent = titleText;
        }
        body.push(h3);
      }
      if (summaryEl && summaryEl !== titleEl && summaryEl.textContent.trim()) {
        const p = document2.createElement("p");
        p.textContent = summaryEl.textContent.trim();
        body.push(p);
      }
      if (!image && !body.length) return;
      cells.push([image || "", body.length ? body : ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/westpac-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var WEBP_REWRITE_SUFFIX = "_ExtRewriteWyJqcGciLCJ3ZWJwIl0.webp";
  function useWidestPictureSource(element, baseUrl) {
    element.querySelectorAll("picture").forEach((picture) => {
      const img = picture.querySelector("img");
      const source = picture.querySelector("source[srcset]");
      if (!img || !source) return;
      const first = source.getAttribute("srcset").split(",")[0].trim().split(/\s+/)[0];
      if (!first) return;
      try {
        img.setAttribute("src", new URL(first, baseUrl).href);
      } catch (e) {
      }
    });
  }
  function useWebpOgImage(document2) {
    document2.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"]').forEach((meta) => {
      const content = meta.getAttribute("content") || "";
      if (/\.(jpe?g|png)$/i.test(content) && !content.includes("_ExtRewrite")) {
        meta.setAttribute("content", content.replace(/^http:/, "https:").replace(/\.(jpe?g|png)$/i, WEBP_REWRITE_SUFFIX));
      }
    });
  }
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      const baseUrl = payload.params && payload.params.originalURL || payload.url || "https://www.westpac.co.nz/";
      useWidestPictureSource(element, baseUrl);
      useWebpOgImage(payload.document);
      WebImporter.DOMUtils.remove(element, [
        "#skiplink",
        "#urgent-banner-slot",
        ".QSIFeedbackButton",
        "#QSIFeedbackButton-target-container",
        "#ZN_720ybwXftNyqxiS",
        "#destination_publishing_iframe_wnzl_0",
        "#universal_pixel_x9b5zq2"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.header",
        "footer.footer",
        ".js-back-to-top",
        "#main > div.js-in-page-nav",
        ".js-in-page-nav",
        "iframe",
        "link",
        "noscript",
        "script",
        "style"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("onclick");
        el.removeAttribute("data-track");
      });
    }
  }

  // tools/importer/transformers/westpac-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      let el = null;
      try {
        el = root.querySelector(sel);
      } catch (e) {
        el = null;
      }
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    const hasSections = sections.length > 1;
    if (hookName === "beforeTransform" && hasSections) {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform" && hasSections) {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-campaign": parse,
    "cards-icon": parse2,
    "cards-quicklink": parse3,
    "cards-rate": parse4,
    "columns-promo": parse5,
    "tabs-dropdown": parse6,
    "columns-intro": parse7,
    "cards-article": parse8
  };
  var PAGE_TEMPLATE = {
    "name": "homepage",
    "description": "Homepage and section landing pages: red page header, icon tile and quick-link grids, featured rates, promo panels, article carousels",
    "urls": [
      "https://www.westpac.co.nz/",
      "https://www.westpac.co.nz/about-us/",
      "https://www.westpac.co.nz/business/"
    ],
    "blocks": [
      {
        "name": "hero-campaign",
        "instances": [
          "section.page-header"
        ]
      },
      {
        "name": "cards-icon",
        "instances": [
          ".tile-block .tile-block__items"
        ]
      },
      {
        "name": "cards-quicklink",
        "instances": [
          ".quick-link-block .quick-link-block__items"
        ]
      },
      {
        "name": "cards-rate",
        "instances": [
          ".small-pricing-block .small-pricing-block__items"
        ]
      },
      {
        "name": "columns-promo",
        "instances": [
          ".promo-block"
        ]
      },
      {
        "name": "tabs-dropdown",
        "instances": [
          ".content-switch-block .content-switch-block__content-wrapper"
        ]
      },
      {
        "name": "columns-intro",
        "instances": [
          "#news-and-stories > .content-block"
        ]
      },
      {
        "name": "cards-article",
        "instances": [
          ".carousel-block .carousel-block__items"
        ]
      }
    ],
    "sections": [
      {
        "id": "rc2",
        "name": "hero",
        "selector": [
          "section.page-header"
        ],
        "style": null,
        "blocks": [
          "hero-campaign"
        ],
        "defaultContent": []
      },
      {
        "id": "rc4",
        "name": "how-can-we-help",
        "selector": [
          "#main > section:has(> #how-can-we-help)",
          "#main > section:has(.tile-block)"
        ],
        "style": null,
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          ".tile-block__heading-wrapper h2"
        ]
      },
      {
        "id": "rc5",
        "name": "quick-links",
        "selector": [
          "#main > section:has(> #get-help)",
          "#main > section:has(.quick-link-block)"
        ],
        "style": null,
        "blocks": [
          "cards-quicklink"
        ],
        "defaultContent": [
          ".quick-link-block__heading"
        ]
      },
      {
        "id": "rc6",
        "name": "featured-rates",
        "selector": [
          "#main > section:has(> #featured-rates)",
          "#main > section:has(.small-pricing-block)"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-rate"
        ],
        "defaultContent": [
          ".small-pricing-block__left h2",
          ".small-pricing-block__left .small-pricing-block__cta a",
          ".small-pricing-block__disclaimer"
        ]
      },
      {
        "id": "rc7",
        "name": "scams-promo",
        "selector": [
          "#main > section.u-background--pink-tint:has(.promo-block)"
        ],
        "style": "pink-tint",
        "blocks": [
          "columns-promo"
        ],
        "defaultContent": []
      },
      {
        "id": "rc8",
        "name": "financial-wellbeing",
        "selector": [
          "#main > section.u-background--content-switch",
          "#main > section:has(.content-switch-block)"
        ],
        "style": null,
        "blocks": [
          "tabs-dropdown"
        ],
        "defaultContent": [
          ".content-switch-block__title"
        ]
      },
      {
        "id": "rc9",
        "name": "news-and-stories-intro",
        "selector": [
          "#main > section:has(> #news-and-stories)"
        ],
        "style": "light-grey",
        "blocks": [
          "columns-intro"
        ],
        "defaultContent": []
      },
      {
        "id": "rc10",
        "name": "news-and-stories-articles",
        "selector": [
          "#main > section.u-background--pale-grey:has(.carousel-block)",
          "#main > section:has(.carousel-block)"
        ],
        "style": "light-grey",
        "blocks": [
          "cards-article"
        ],
        "defaultContent": [
          ".carousel-block__heading"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        let elements = [];
        try {
          elements = document2.querySelectorAll(selector);
        } catch (e) {
          console.warn(`Invalid selector for block "${blockDef.name}": ${selector}`);
        }
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element, section: blockDef.section || null });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document: document2, url, html, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
