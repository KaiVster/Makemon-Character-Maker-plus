/**
 * @fileoverview Randomizer module for Makemon Character Maker+
 * Provides random selection functionality for character parts and colors.
 */

/** @constant {number} Delay before initializing to allow other scripts to load */
const INIT_DELAY_MS = 100;

// Wait for DOM to be fully loaded and maker to initialize
window.addEventListener("load", function () {
  setTimeout(function () {
    createRandomizerUI();
    setupRandomizerFunctions();
  }, INIT_DELAY_MS);
});

/**
 * Creates the randomizer UI buttons and adds them to the page
 */
function createRandomizerUI() {
  // Find the custom color block first; fallback to the original body color heading
  const customColorHeading = document.querySelector(
    'h3[data-translate-key="customColorPickerTitle"]'
  );
  const presetsHeading = document.querySelector(
    'h4[data-translate-key="presetColorsSubheading"]'
  );
  const bodyColorHeading = document.querySelector("h2.section");

  // Add randomize all button
  const allButton = document.createElement("button");
  allButton.id = "randomize-all";
  allButton.setAttribute("data-translate-key", "randomizeAllButton");
  allButton.className = "ui-button";

  // Create body color randomizer button
  const bodyColorButton = document.createElement("button");
  bodyColorButton.id = "randomize-body-color";
  bodyColorButton.setAttribute(
    "data-translate-key",
    "randomizeBodyColorButton"
  );
  bodyColorButton.className = "ui-button";

  // Create a wrapper div for center alignment
  const buttonsWrapper = document.createElement("div");
  buttonsWrapper.className = "catalog-block";
  buttonsWrapper.style.textAlign = "center";
  buttonsWrapper.style.marginBottom = "15px"; // provides spacing below the buttons

  // Append elements to the DOM directly
  buttonsWrapper.appendChild(allButton);
  buttonsWrapper.appendChild(bodyColorButton);
  if (presetsHeading && presetsHeading.parentNode) {
    presetsHeading.parentNode.appendChild(buttonsWrapper);
  } else if (customColorHeading && customColorHeading.parentNode) {
    customColorHeading.parentNode.insertBefore(
      buttonsWrapper,
      customColorHeading.nextSibling
    );
  } else if (bodyColorHeading && bodyColorHeading.parentNode) {
    bodyColorHeading.parentNode.insertBefore(buttonsWrapper, bodyColorHeading);
  } else {
    console.error(
      "Could not find a suitable spot to place randomizer buttons (custom color/preset/body color)."
    );
    return;
  }

  // Apply translations for the buttons
  if (
    window.languageManager &&
    typeof window.languageManager.updateUI === "function" &&
    typeof window.languageManager.getCurrentLanguage === "function"
  ) {
    window.languageManager.updateUI(
      window.languageManager.getCurrentLanguage()
    );
  } else {
    console.warn(
      "languageManager not available for randomizer UI translation."
    );
  }
}

/**
 * Sets up event listeners for randomizer buttons.
 * Uses direct function references instead of wrapper functions.
 */
function setupRandomizerFunctions() {
  const allButton = document.getElementById("randomize-all");
  allButton?.addEventListener("click", randomizeAll);

  const bodyColorButton = document.getElementById("randomize-body-color");
  bodyColorButton?.addEventListener("click", randomizeBodyColor);
}

/**
 * Get categories from the DOM by analyzing the section headings
 * @returns {Array} Array of categories with id and name
 */
function getCategories() {
  const categories = [];
  const sections = document.querySelectorAll("h2.section");

  sections.forEach(function (section, index) {
    if (section.dataset.translateKey === "sectionHeaderBodyColor") {
      return;
    }

    categories.push({
      id: "category-" + index,
      name: section.textContent.trim(),
      element: section,
    });
  });

  return categories;
}

/**
 * Get all items for a specific layer
 * @param {Number} layer - Layer number
 * @returns {Array} Array of image elements for that layer
 */
function getItemsForLayer(layer) {
  return Array.from(
    document.querySelectorAll('img[data-mklayer="' + layer + '"]')
  );
}

/**
 * Get all layers from the DOM
 * @returns {Array} Array of unique layer numbers
 */
function getAllLayers() {
  const layers = new Set();
  document.querySelectorAll("img[data-mklayer]").forEach(function (image) {
    layers.add(image.getAttribute("data-mklayer"));
  });
  return Array.from(layers).sort((a, b) => parseInt(a) - parseInt(b));
}

/**
 * Get items for a specific category
 * @param {String} categoryId - Category identifier
 * @returns {Array} Array of items in that category
 */
function getItemsForCategory(categoryId) {
  const categories = getCategories();
  const category = categories.find((c) => c.id === categoryId);

  if (!category || !category.element) {
    return [];
  }

  // Find all images between this category heading and the next
  let items = [];
  let currentElement = category.element.nextElementSibling;
  let nextHeading = null;

  // Find the next category heading
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].id === categoryId && i < categories.length - 1) {
      nextHeading = categories[i + 1].element;
      break;
    }
  }

  // Collect all image items until the next heading or end
  while (currentElement && currentElement !== nextHeading) {
    if (
      currentElement.tagName === "IMG" &&
      currentElement.hasAttribute("data-mklayer")
    ) {
      items.push(currentElement);
    } else if (currentElement.querySelectorAll) {
      const nestedImages = currentElement.querySelectorAll("img[data-mklayer]");
      items = items.concat(Array.from(nestedImages));
    }
    currentElement = currentElement.nextElementSibling;
  }

  return items;
}

/**
 * Select a random item from a list of items
 * @param {Array} items - Array of items to choose from
 * @returns {Element|null} Randomly selected item or null if array is empty
 */
function getRandomItem(items) {
  if (!items || items.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * items.length);
  return items[randomIndex];
}

/**
 * Select a random item for each layer
 */
function randomizeAll() {
  const layers = getAllLayers();

  layers.forEach(function (layer) {
    const items = getItemsForLayer(layer);
    const randomItem = getRandomItem(items);

    if (randomItem && window.makerInstance) {
      window.makerInstance.selectImage(randomItem);
    }
  });

  // Update the result image
  if (window.makerInstance) {
    window.makerInstance.updateResultImage();
  }
}

/**
 * Select a random item for each layer in a specific category
 * @param {String} categoryId - Category identifier
 */
function randomizeCategory(categoryId) {
  const items = getItemsForCategory(categoryId);

  // Group items by layer
  const layerGroups = {};
  items.forEach(function (item) {
    const layer = item.getAttribute("data-mklayer");
    if (!layerGroups[layer]) {
      layerGroups[layer] = [];
    }
    layerGroups[layer].push(item);
  });

  // Select a random item for each layer in this category
  Object.keys(layerGroups).forEach(function (layer) {
    const layerItems = layerGroups[layer];
    const randomItem = getRandomItem(layerItems);

    if (randomItem && window.makerInstance) {
      window.makerInstance.selectImage(randomItem);
    }
  });

  // Update the result image
  if (window.makerInstance) {
    window.makerInstance.updateResultImage();
  }
}

/**
 * Generate a truly random body color instead of selecting from presets
 */
function randomizeBodyColor() {
  if (window.makerInstance) {
    // Generate random RGB values between 0 and 1
    const red = Math.random();
    const green = Math.random();
    const blue = Math.random();
    const rgbString = `${red},${green},${blue}`;

    // Find our persistent random color element or create one if it doesn't exist
    let randomColorElement = document.getElementById("random-color-persistent");

    if (!randomColorElement) {
      // Create a persistent random color element and add it to the DOM (but hidden)
      randomColorElement = document.createElement("span");
      randomColorElement.id = "random-color-persistent";
      randomColorElement.className = "border block";
      randomColorElement.style.display = "none"; // Hide it from view
      randomColorElement.innerHTML = "&nbsp;";
      randomColorElement.setAttribute("data-mkfill", rgbString);
      document.body.appendChild(randomColorElement);
    } else {
      // Update the existing element with new color values
      randomColorElement.setAttribute("data-mkfill", rgbString);
    }

    // Use the selectColor method like the preset colors do
    window.makerInstance.selectColor(randomColorElement);

    // Update the custom color picker UI to reflect the new random color *before* updating image
    if (window.updateColorPickerFromFillColor) {
      window.updateColorPickerFromFillColor();
    }

    window.makerInstance.updateResultImage();
  }
}