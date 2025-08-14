window.addEventListener("load", function () {
  // CUSTOMIZATION: Adjust this delay if `maker.js` takes longer to initialize on your system.
  const initializationDelay = 1000; // Time in milliseconds.

  setTimeout(function () {
    // --- SCRIPT INITIALIZATION ---
    // The script identifies the 'Body Color' section to inject the UI.
    // MODIFICATION: If you rename the `sectionHeaderBodyColor` key in `language.js`, update it here too.
    const bodyColorSection = document.querySelector(
      'h2.section[data-translate-key="sectionHeaderBodyColor"]'
    );

    if (!bodyColorSection) {
      console.error(
        "Color Picker Error: Could not find the target section to attach the UI."
      );
      return;
    }

    // --- UI ELEMENT CREATION ---
    // This section dynamically creates the HTML elements for the color picker.
    // CUSTOMIZATION: To change the appearance (e.g., styles, layout), modify the `style` properties of these elements.

    const title = document.createElement("h3");
    title.setAttribute("data-translate-key", "customColorPickerTitle");
    title.style.margin = "15px 0 10px 0";
    title.style.textAlign = "center";
    
    // Check the language from localStorage
    const currentLang = localStorage.getItem("language") || "en";
    title.textContent = currentLang === "ja" ? "カスタムカラー" : "Custom Color";

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.id = "custom-color-picker";
    colorInput.value = "#ffffff"; // Default color

    const colorDisplay = document.createElement("span");
    colorDisplay.id = "selected-color-display";
    colorDisplay.className = "border block";
    colorDisplay.style.backgroundColor = "#ffffff";
    colorDisplay.style.display = "inline-block";
    colorDisplay.style.width = "64px";
    colorDisplay.style.height = "32px";
    colorDisplay.style.verticalAlign = "top";
    colorDisplay.style.marginLeft = "10px";
    colorDisplay.style.marginTop = "9px";
    colorDisplay.innerHTML = "&nbsp;";

    const colorPickerWrapper = document.createElement("div");
    colorPickerWrapper.style.textAlign = "center";
    colorPickerWrapper.style.margin = "10px 0";
    colorPickerWrapper.appendChild(colorInput);
    colorPickerWrapper.appendChild(colorDisplay);

    const rgbContainer = document.createElement("div");
    rgbContainer.className = "color-info";
    rgbContainer.style.marginTop = "15px";

    const rLabel = document.createElement("label");
    rLabel.htmlFor = "red-value";
    rLabel.setAttribute("data-translate-key", "redLabel");
    const rInput = document.createElement("input");
    rInput.type = "number";
    rInput.id = "red-value";
    rInput.min = "0";
    rInput.max = "255";
    rInput.step = "1";
    rInput.value = "255";
    rInput.className = "themed-input";

    const gLabel = document.createElement("label");
    gLabel.htmlFor = "green-value";
    gLabel.setAttribute("data-translate-key", "greenLabel");
    const gInput = document.createElement("input");
    gInput.type = "number";
    gInput.id = "green-value";
    gInput.min = "0";
    gInput.max = "255";
    gInput.step = "1";
    gInput.value = "255";
    gInput.className = "themed-input";

    const bLabel = document.createElement("label");
    bLabel.htmlFor = "blue-value";
    bLabel.setAttribute("data-translate-key", "blueLabel");
    const bInput = document.createElement("input");
    bInput.type = "number";
    bInput.id = "blue-value";
    bInput.min = "0";
    bInput.max = "255";
    bInput.step = "1";
    bInput.value = "255";
    bInput.className = "themed-input";

    const applyButton = document.createElement("button");
    applyButton.id = "apply-custom-color";
    applyButton.setAttribute("data-translate-key", "applyCustomColor");
    applyButton.className = "ui-button";

    rgbContainer.appendChild(rLabel);
    rgbContainer.appendChild(rInput);
    rgbContainer.appendChild(document.createTextNode(" "));
    rgbContainer.appendChild(gLabel);
    rgbContainer.appendChild(gInput);
    rgbContainer.appendChild(document.createTextNode(" "));
    rgbContainer.appendChild(bLabel);
    rgbContainer.appendChild(bInput);
    rgbContainer.appendChild(document.createTextNode(" "));
    rgbContainer.appendChild(applyButton);
    rgbContainer.style.textAlign = "center";
    rgbContainer.style.marginBottom = "15px";

    // --- UI INJECTION ---
    // The created elements are inserted into the main document.
    bodyColorSection.parentNode.insertBefore(
      title,
      bodyColorSection.nextSibling
    );
    bodyColorSection.parentNode.insertBefore(
      colorPickerWrapper,
      title.nextSibling
    );
    bodyColorSection.parentNode.insertBefore(
      rgbContainer,
      colorPickerWrapper.nextSibling
    );

    // --- MAKER.JS INTEGRATION ---
    // This global function synchronizes the color picker UI with the maker's internal state.
    window.updateColorPickerFromFillColor = function () {
      if (!window.makerInstance) return;

      const {
        red: r_norm,
        green: g_norm,
        blue: b_norm,
      } = window.makerInstance.fillColor;
      const r = Math.round(Math.max(0, Math.min(1, r_norm)) * 255);
      const g = Math.round(Math.max(0, Math.min(1, g_norm)) * 255);
      const b = Math.round(Math.max(0, Math.min(1, b_norm)) * 255);

      const rInput = document.getElementById("red-value");
      const gInput = document.getElementById("green-value");
      const bInput = document.getElementById("blue-value");
      const colorInput = document.getElementById("custom-color-picker");
      const colorDisplay = document.getElementById("selected-color-display");

      if (rInput && gInput && bInput && colorInput && colorDisplay) {
        rInput.value = r;
        gInput.value = g;
        bInput.value = b;

        const hexColor = `#${r.toString(16).padStart(2, "0")}${g
          .toString(16)
          .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
        colorInput.value = hexColor;
        colorDisplay.style.backgroundColor = hexColor;
      }
    };

    // To keep the UI in sync, wrap the original `selectColor` method.
    // This ensures the custom color picker updates whenever a preset color is chosen.
    if (window.makerInstance) {
      const originalSelectColor = window.makerInstance.selectColor;
      window.makerInstance.selectColor = function (color) {
        originalSelectColor.call(this, color);
        setTimeout(window.updateColorPickerFromFillColor, 50);
      };
    }

    const presetColors = document.querySelectorAll("span[data-mkfill]");
    presetColors.forEach(function (colorEl) {
      colorEl.addEventListener("click", function () {
        setTimeout(window.updateColorPickerFromFillColor, 50);
      });
    });

    const presetsHeading = document.createElement("h4");
    presetsHeading.setAttribute("data-translate-key", "presetColorsSubheading");
    presetsHeading.style.marginTop = "15px";
    presetsHeading.style.marginBottom = "5px";
    
    // Set initial text based on current language
    presetsHeading.textContent = currentLang === "ja" ? "プリセットカラー" : "Preset Colors";
    
    bodyColorSection.parentNode.insertBefore(
      presetsHeading,
      rgbContainer.nextSibling
    );

    const maker = window.makerInstance;
    if (!maker) {
      console.warn(
        "Color Picker Warning: Maker instance not found. Some functionality may be limited."
      );
    }

    // --- UI EVENT LISTENERS ---
    // These listeners keep the color swatch, hex input, and RGB inputs synchronized.
    colorInput.addEventListener("input", function () {
      const hexColor = this.value;
      colorDisplay.style.backgroundColor = hexColor;

      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);

      rInput.value = r;
      gInput.value = g;
      bInput.value = b;
    });

    function updateFromRGB() {
      const r = Math.min(255, Math.max(0, parseInt(rInput.value)));
      const g = Math.min(255, Math.max(0, parseInt(gInput.value)));
      const b = Math.min(255, Math.max(0, parseInt(bInput.value)));

      const hexColor = `#${r.toString(16).padStart(2, "0")}${g
        .toString(16)
        .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

      colorInput.value = hexColor;
      colorDisplay.style.backgroundColor = hexColor;
    }

    rInput.addEventListener("input", updateFromRGB);
    gInput.addEventListener("input", updateFromRGB);
    bInput.addEventListener("input", updateFromRGB);

    function handleSpinnerClick(event) {
      const input = event.target;
      const rect = input.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      const arrowZoneWidth = 20; // px width of the clickable arrow area on the right

      // Only proceed if the click is within the horizontal "arrow zone"
      if (clickX > rect.width - arrowZoneWidth) {
        // Prevent the input from gaining focus and showing a cursor when clicking the arrows
        event.preventDefault();

        // Check if the click is in the top or bottom half of the input
        if (clickY < rect.height / 2) {
          // Clicked top half (increment)
          input.stepUp();
        } else {
          // Clicked bottom half (decrement)
          input.stepDown();
        }

        // Manually trigger the 'input' event to ensure UI updates
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }

    rInput.addEventListener("click", handleSpinnerClick);
    gInput.addEventListener("click", handleSpinnerClick);
    bInput.addEventListener("click", handleSpinnerClick);

    // --- CUSTOM SPINNER ARROW HOVER LOGIC ---
    function handleSpinnerHover(event) {
      const input = event.target;
      const rect = input.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const arrowZoneWidth = 20; // Must match the click zone width

      if (mouseX > rect.width - arrowZoneWidth) {
        input.classList.add("arrow-hover");
      } else {
        input.classList.remove("arrow-hover");
      }
    }

    function handleSpinnerMouseLeave(event) {
      event.target.classList.remove("arrow-hover");
    }

    rInput.addEventListener("mousemove", handleSpinnerHover);
    gInput.addEventListener("mousemove", handleSpinnerHover);
    bInput.addEventListener("mousemove", handleSpinnerHover);

    rInput.addEventListener("mouseleave", handleSpinnerMouseLeave);
    gInput.addEventListener("mouseleave", handleSpinnerMouseLeave);
    bInput.addEventListener("mouseleave", handleSpinnerMouseLeave);

    // --- APPLY COLOR LOGIC ---
    applyButton.addEventListener("click", function () {
      if (!maker) {
        console.error(
          "Color Picker Error: Cannot apply color because maker instance is not available."
        );
        return;
      }

      // Convert UI color (0-255) to maker's internal format (0-1).
      const r = parseFloat(rInput.value) / 255;
      const g = parseFloat(gInput.value) / 255;
      const b = parseFloat(bInput.value) / 255;
      const rgbString = `${r},${g},${b}`;

      // To apply a custom color, use a persistent, hidden HTML element.
      // This element acts like a preset color swatch that updates dynamically.
      let customColorElement = document.getElementById(
        "custom-color-persistent"
      );

      if (!customColorElement) {
        customColorElement = document.createElement("span");
        customColorElement.id = "custom-color-persistent";
        customColorElement.className = "border block";
        customColorElement.style.display = "none";
        document.body.appendChild(customColorElement);
      }

      customColorElement.setAttribute("data-mkfill", rgbString);
      colorDisplay.style.backgroundColor = colorInput.value;

      // Deselect any currently selected preset color.
      const currentSelectedColor = document.querySelector(
        "[data-mkfill][data-mkselect]"
      );
      if (currentSelectedColor) {
        currentSelectedColor.classList.remove("mkselect");
        currentSelectedColor.removeAttribute("data-mkselect");
      }

      // Directly update the maker's internal color state.
      maker.fillColor.red = r;
      maker.fillColor.green = g;
      maker.fillColor.blue = b;

      // Marks custom color element as selected for UI consistency.
      customColorElement.classList.add("mkselect");
      customColorElement.setAttribute("data-mkselect", "true");

      // Trigger a redraw of the character to show the new color.
      maker.updateResultImage();
    });

    // --- TRANSLATION ---
    // Ensures the UI text is updated when the language changes.
    function initializeTranslations() {
      if (window.languageManager && typeof window.languageManager.updateUI === "function") {
        window.languageManager.updateUI(window.languageManager.getCurrentLanguage());
      } else {
        // If language manager isn't ready yet, try again after a short delay
        setTimeout(initializeTranslations, 100);
      }
    }

    // Start the translation initialization
    initializeTranslations();
  }, initializationDelay);
});