/**
 * @fileoverview Language management for Makemon Character Maker+
 * Handles UI translations and language switching between English and Japanese.
 */

document.addEventListener("DOMContentLoaded", () => {
  const languageManager = {
    uiStrings: {
      en: typeof uiStrings_en !== "undefined" ? uiStrings_en : {},
      ja: typeof uiStrings_ja !== "undefined" ? uiStrings_ja : {},
      ko: typeof uiStrings_ko !== "undefined" ? uiStrings_ko : {},
    },
    observer: null,

    /**
     * Initializes the language manager and sets up event listeners.
     */
    init() {
      const savedLanguage = localStorage.getItem("language") || "en";

      document.getElementById("lang-en")
        ?.addEventListener("click", () => this.switchLanguage("en"));
      document.getElementById("lang-ja")
        ?.addEventListener("click", () => this.switchLanguage("ja"));
      document.getElementById("lang-ko")
        ?.addEventListener("click", () => this.switchLanguage("ko"));

      this.switchLanguage(savedLanguage);
      this.initObserver();
    },

    /**
     * Switches the active language and updates all UI elements.
     * @param {string} lang - The language code ('en', 'ja', 'ko')
     */
    switchLanguage(lang) {
      if (!this.uiStrings[lang]) {
        console.error(`Language '${lang}' not found or strings not loaded.`);
        return;
      }

      localStorage.setItem("language", lang);

      // Update active button state
      document.getElementById("lang-en")?.classList.toggle("lang-selected", lang === "en");
      document.getElementById("lang-ja")?.classList.toggle("lang-selected", lang === "ja");
      document.getElementById("lang-ko")?.classList.toggle("lang-selected", lang === "ko");

      // Update body class for font switching
      document.body.classList.toggle("lang-ko", lang === "ko");

      this.applyTranslations(lang);
      updateTitleImage(lang);
    },

    /**
     * Applies translations to all translatable elements in the document.
     * @param {string} lang - The language code
     */
    applyTranslations(lang) {
      const strings = this.uiStrings[lang];

      // Update page title (outside body, needs explicit handling)
      if (strings?.page_title) {
        document.title = strings.page_title;
      }

      this.applyTranslationsToNode(document.body, lang);
      updateTitleImage(lang);
    },

    /**
     * Applies translations to a specific DOM node and its descendants.
     * @param {HTMLElement} node - The root node to translate
     * @param {string} lang - The language code
     */
    applyTranslationsToNode(node, lang) {
      const strings = this.uiStrings[lang];
      if (!strings) return;

      const elements = node.querySelectorAll(
        "[data-translate-key], [data-translate-alt-key]"
      );

      elements.forEach((element) => {
        const key = element.getAttribute("data-translate-key");
        const altKey = element.getAttribute("data-translate-alt-key");

        // Handle text content translation
        if (key && strings[key]) {
          // Use innerHTML for keys that contain HTML (links, line breaks)
          const useHTML = key.startsWith('footer_') || key === 'creator_note' || key === 'plus_credits';
          element[useHTML ? 'innerHTML' : 'textContent'] = strings[key];
        }

        // Handle alt text translation
        if (altKey && strings[altKey]) {
          element.setAttribute("alt", strings[altKey]);
          if (element.hasAttribute("title")) {
            element.setAttribute("title", strings[altKey]);
          }
        }
      });

      // Handle preselected parts
      node.querySelectorAll('[data-mkselect="true"]').forEach((element) => {
        const altKey = element.getAttribute("data-translate-alt-key");
        if (altKey && strings[altKey]) {
          element.setAttribute("alt", strings[altKey]);
          if (element.hasAttribute("title")) {
            element.setAttribute("title", strings[altKey]);
          }
        }
      });
    },

    /**
     * Initializes MutationObserver to translate dynamically added elements.
     */
    initObserver() {
      this.observer = new MutationObserver((mutations) => {
        const currentLang = localStorage.getItem("language") || "en";
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.applyTranslationsToNode(node, currentLang);
            }
          });
        });
      });

      this.observer.observe(document.body, { childList: true, subtree: true });
    },
  };

  languageManager.init();

  // helper function outside the languageManager object, but inside DOMContentLoaded
  function updateTitleImage(lang) {
    const img = document.getElementById('titleImage');
    if (!img) return;

    if (lang === 'ko') {
      img.src = 'Makemon/daimei_kor.png';
    } else if (lang === 'ja') {
      img.src = 'Makemon/daimei.png';
    } else {
      img.src = 'Makemon/daimei_eng.png'; // Fallback / EN
    }
  }
});
