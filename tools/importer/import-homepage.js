/* eslint-disable */
/* global WebImporter */

/**
 * Import script for template "homepage".
 * Homepage and section landing pages: red page header, icon tile and quick-link grids, featured rates, promo panels, article carousels
 *
 * Note: WebImporter.rules.convertIcons() is intentionally NOT called. The tile icons
 * (cards-icon, cards-quicklink) are .svg on the source; they must stay as images so the
 * Bright Data image map can swap them for their PNG copies instead of :icon-name: codes.
 */

// PARSER IMPORTS
import heroCampaignParser from './parsers/hero-campaign.js';
import cardsIconParser from './parsers/cards-icon.js';
import cardsQuicklinkParser from './parsers/cards-quicklink.js';
import cardsRateParser from './parsers/cards-rate.js';
import columnsPromoParser from './parsers/columns-promo.js';
import tabsDropdownParser from './parsers/tabs-dropdown.js';
import columnsIntroParser from './parsers/columns-intro.js';
import cardsArticleParser from './parsers/cards-article.js';

// TRANSFORMER IMPORTS
import westpacCleanupTransformer from './transformers/westpac-cleanup.js';
import westpacSectionsTransformer from './transformers/westpac-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-campaign': heroCampaignParser,
  'cards-icon': cardsIconParser,
  'cards-quicklink': cardsQuicklinkParser,
  'cards-rate': cardsRateParser,
  'columns-promo': columnsPromoParser,
  'tabs-dropdown': tabsDropdownParser,
  'columns-intro': columnsIntroParser,
  'cards-article': cardsArticleParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
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

// TRANSFORMER REGISTRY - cleanup first, then sections
const transformers = [
  westpacCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [westpacSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      let elements = [];
      try {
        elements = document.querySelectorAll(selector);
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

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section breaks (while section elements still exist)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block (skip elements already replaced by an earlier parser)
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root maps to the index document)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
