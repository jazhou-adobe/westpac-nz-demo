/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Westpac NZ site-wide cleanup.
 *
 * All selectors verified in migration-work/cleaned.html (homepage capture) and
 * migration-work/visual-trees.json (about-us / business captures):
 *  - <div id="skiplink" class="skip-link">                     (cleaned.html, top of #app)
 *  - <header class="header"> (mega menu, mobile menu, login nav) (cleaned.html)
 *  - <div id="urgent-banner-slot" class="mbox-name-urgent-banner"> (cleaned.html, inside #main)
 *  - <div class="js-back-to-top back-to-top">                  (cleaned.html, last child of #main)
 *  - #main > div.js-in-page-nav                                 (visual-trees.json, about-us / business)
 *  - <footer class="footer">                                    (cleaned.html)
 *  - <iframe id="destination_publishing_iframe_wnzl_0">         (cleaned.html, Adobe ID sync, outside #main)
 *  - <iframe id="universal_pixel_x9b5zq2">                      (cleaned.html, TTD pixel, outside #main)
 *  - <div id="ZN_720ybwXftNyqxiS">                              (cleaned.html, Qualtrics intercept, outside #main)
 *  - <div class="QSIFeedbackButton"> / #QSIFeedbackButton-target-container (cleaned.html, Qualtrics feedback)
 * No cookie consent banner exists in the captured DOM (none found in cleaned.html or BD snapshot).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

// Westpac serves each asset as a webp rewrite: "<name>.jpg" -> "<name>_ExtRewriteWyJqcGciLCJ3ZWJwIl0.webp"
const WEBP_REWRITE_SUFFIX = '_ExtRewriteWyJqcGciLCJ3ZWJwIl0.webp';

/**
 * Point each <picture> <img> at its first (widest) <source>. The <img> fallback is the
 * smallest rendition, which the browser never downloads, so it is missing from the
 * Bright Data image map; the widest source is the rendition that was captured.
 */
function useWidestPictureSource(element, baseUrl) {
  element.querySelectorAll('picture').forEach((picture) => {
    const img = picture.querySelector('img');
    const source = picture.querySelector('source[srcset]');
    if (!img || !source) return;
    const first = source.getAttribute('srcset').split(',')[0].trim().split(/\s+/)[0];
    if (!first) return;
    try {
      img.setAttribute('src', new URL(first, baseUrl).href);
    } catch (e) {
      // keep the original src
    }
  });
}

/** Point og:image at its webp rewrite, which is the rendition the page actually loads. */
function useWebpOgImage(document) {
  document.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"]').forEach((meta) => {
    const content = meta.getAttribute('content') || '';
    if (/\.(jpe?g|png)$/i.test(content) && !content.includes('_ExtRewrite')) {
      meta.setAttribute('content', content.replace(/^http:/, 'https:').replace(/\.(jpe?g|png)$/i, WEBP_REWRITE_SUFFIX));
    }
  });
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Snapshot imports run on about:blank, so resolve relative srcsets against the source URL
    const baseUrl = (payload.params && payload.params.originalURL) || payload.url || 'https://www.westpac.co.nz/';
    useWidestPictureSource(element, baseUrl);
    useWebpOgImage(payload.document);

    // Overlays / widgets / tracking that could interfere with block parsing
    WebImporter.DOMUtils.remove(element, [
      '#skiplink',
      '#urgent-banner-slot',
      '.QSIFeedbackButton',
      '#QSIFeedbackButton-target-container',
      '#ZN_720ybwXftNyqxiS',
      '#destination_publishing_iframe_wnzl_0',
      '#universal_pixel_x9b5zq2',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome
    WebImporter.DOMUtils.remove(element, [
      'header.header',
      'footer.footer',
      '.js-back-to-top',
      '#main > div.js-in-page-nav',
      '.js-in-page-nav',
      'iframe',
      'link',
      'noscript',
      'script',
      'style',
    ]);

    // Strip tracking / inline attributes left on remaining elements
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('onclick');
      el.removeAttribute('data-track');
    });
  }
}
