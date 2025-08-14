document.addEventListener("DOMContentLoaded", () => {
  const languageManager = {
    // Default to English if the Japanese strings are not loaded.
    uiStrings: {
      en: typeof uiStrings_en !== "undefined" ? uiStrings_en : {},
      ja: typeof uiStrings_ja !== "undefined" ? uiStrings_ja : {},
    },
    observer: null,

    init() {
      // Get saved language from localStorage or default to 'en'.
      const savedLanguage = localStorage.getItem("language") || "en";

      // Add event listeners to language switcher buttons.
      document
        .getElementById("lang-en")
        .addEventListener("click", () => this.switchLanguage("en"));
      document
        .getElementById("lang-ja")
        .addEventListener("click", () => this.switchLanguage("ja"));

      // Set and apply the initial language.
      this.switchLanguage(savedLanguage);

      // Initialize the observer to watch for dynamically added elements.
      this.initObserver();
    },

    switchLanguage(lang) {
      if (this.uiStrings[lang]) {
        localStorage.setItem("language", lang);

        // Update button states
        const currentLang = localStorage.getItem("language") || "en";
        document
          .getElementById("lang-en")
          .classList.toggle("lang-selected", currentLang === "en");
        document
          .getElementById("lang-ja")
          .classList.toggle("lang-selected", currentLang === "ja");

        this.applyTranslations(lang);
        // Update the title image after switching language
        updateTitleImage(lang);
      } else {
        console.error(`Language '${lang}' not found or strings not loaded.`);
      }
    },

    applyTranslations(lang) {
      this.applyTranslationsToNode(document.body, lang);
      // Update the title image after applying translations (for initial load)
      updateTitleImage(lang);
    },

    applyTranslationsToNode(node, lang) {
      const strings = this.uiStrings[lang];
      if (!strings) return;

      // Find all elements with translation keys within the given node.
      const elements = node.querySelectorAll(
        "[data-translate-key], [data-translate-alt-key]"
      );

      elements.forEach((element) => {
        const key = element.getAttribute("data-translate-key");
        const altKey = element.getAttribute("data-translate-alt-key");

        // Handle text content translation
        if (key && strings[key]) {
          // Use innerHTML for footer keys to allow HTML links
          if (key.startsWith('footer_')) {
            element.innerHTML = strings[key];
          } else {
            element.textContent = strings[key];
          }
        }

        // Handle alt text translation
        if (altKey && strings[altKey]) {
          element.setAttribute("alt", strings[altKey]);
          // Also update title attribute if it exists
          if (element.hasAttribute("title")) {
            element.setAttribute("title", strings[altKey]);
          }
        }
      });

      // Handle preselected parts
      const preselected = node.querySelectorAll('[data-mkselect="true"]');
      preselected.forEach((element) => {
        const altKey = element.getAttribute("data-translate-alt-key");
        if (altKey && strings[altKey]) {
          element.setAttribute("alt", strings[altKey]);
          if (element.hasAttribute("title")) {
            element.setAttribute("title", strings[altKey]);
          }
        }
      });
    },

    initObserver() {
      this.observer = new MutationObserver((mutations) => {
        const currentLang = localStorage.getItem("language") || "en";
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            // Check if the added node is an element and not just text.
            if (node.nodeType === 1) {
              this.applyTranslationsToNode(node, currentLang);
            }
          });
        });
      });

      // Start observing the body for added child elements.
      this.observer.observe(document.body, { childList: true, subtree: true });
    },
  };

  languageManager.init();

  // helper function outside the languageManager object, but inside DOMContentLoaded
  function updateTitleImage(lang) {
    const img = document.getElementById('titleImage');
    if (!img) return;
    img.src = lang === 'ja' ? '../Makemon/daimei.png' : '../Makemon/daimei_eng.png';
  }
});