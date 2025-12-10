window.addEventListener("load", function () {
  // --- CONSTANTS ---
  const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;
  const MOBILE_BREAKPOINT = 360;
  const TABLET_BREAKPOINT = 900;
  const ARROW_ZONE_WIDTH_PX = 20;
  const INIT_TIMEOUT_MS = 8000;
  const INIT_POLL_INTERVAL_MS = 100;

  // --- UTILITY FUNCTIONS ---
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const toHex = (v) => v.toString(16).padStart(2, "0");
  const hexFromRgb = (r, g, b) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  const parseHex = (hex) => {
    if (!HEX_REGEX.test(hex)) return null;
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  };

  const sanitizeHexInput = (val) => {
    const hex = val.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    return "#" + hex;
  };

  const hsvToRgb = (h, s, v) => {
    h = ((h % 360) + 360) % 360;
    s = clamp01(s);
    v = clamp01(v);
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r1 = 0,
      g1 = 0,
      b1 = 0;
    if (h < 60) {
      r1 = c;
      g1 = x;
      b1 = 0;
    } else if (h < 120) {
      r1 = x;
      g1 = c;
      b1 = 0;
    } else if (h < 180) {
      r1 = 0;
      g1 = c;
      b1 = x;
    } else if (h < 240) {
      r1 = 0;
      g1 = x;
      b1 = c;
    } else if (h < 300) {
      r1 = x;
      g1 = 0;
      b1 = c;
    } else {
      r1 = c;
      g1 = 0;
      b1 = x;
    }
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    };
  };

  const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r:
          h = ((g - b) / d) % 6;
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h: (h + 360) % 360, s, v };
  };

  const init = (bodyColorSectionParam) => {
    // --- SCRIPT INITIALIZATION ---
    // The script identifies the 'Body Color' section to inject the UI.
    // If you rename the `sectionHeaderBodyColor` key in `language.js`, update it here too.
    const bodyColorSection =
      bodyColorSectionParam ||
      document.querySelector(
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
    // To change the appearance (e.g., styles, layout), modify the `style` properties of these elements.

    const title = document.createElement("h3");
    title.setAttribute("data-translate-key", "customColorPickerTitle");
    title.style.margin = "15px 0 10px 0";
    title.style.textAlign = "center";

    // Check the language from localStorage
    const currentLang = localStorage.getItem("language") || "en";
    title.textContent = currentLang === "ja" ? "カスタムカラー" : "Custom Color";

    const colorInput = document.createElement("input");
    colorInput.type = "text";
    colorInput.id = "custom-color-picker";
    colorInput.value = "#ffffff"; // Default color
    colorInput.placeholder = "#ffffff";
    colorInput.className = "themed-input";
    colorInput.maxLength = 7;
    colorInput.setAttribute("pattern", "^#?[0-9a-fA-F]{6}$");
    colorInput.setAttribute("inputmode", "text");
    colorInput.setAttribute("aria-label", "Custom color hex");

    const colorDisplay = document.createElement("span");
    colorDisplay.id = "selected-color-display";
    colorDisplay.className = "block";
    colorDisplay.style.backgroundColor = "#ffffff";
    colorDisplay.style.display = "inline-block";
    colorDisplay.style.width = "40px";
    colorDisplay.style.height = "40px";
    colorDisplay.style.verticalAlign = "middle";
    colorDisplay.style.marginLeft = "0px";
    colorDisplay.style.marginTop = "0px";
    colorDisplay.innerHTML = "&nbsp;";

    // --- ADVANCED COLOR PICKER (H/S/V) ---
    const pickerContainer = document.createElement("div");
    pickerContainer.className = "mk-color-picker";

    const svCanvas = document.createElement("canvas");
    const hueCanvas = document.createElement("canvas");
    svCanvas.className = "sv-canvas";
    hueCanvas.className = "hue-canvas";

    let isMobileNarrow = window.innerWidth <= MOBILE_BREAKPOINT;

    const applyCanvasSizes = () => {
      isMobileNarrow = window.innerWidth <= MOBILE_BREAKPOINT;
      const isTablet = window.innerWidth <= TABLET_BREAKPOINT;
      const svSize = isMobileNarrow
        ? { w: 170, h: 120 }
        : isTablet
          ? { w: 200, h: 140 }
          : { w: 240, h: 170 };
      const hueSize = isMobileNarrow
        ? { w: 170, h: 14 }
        : isTablet
          ? { w: 200, h: 16 }
          : { w: 240, h: 16 };

      svCanvas.width = svSize.w;
      svCanvas.height = svSize.h;
      svCanvas.style.width = `${svSize.w}px`;
      svCanvas.style.height = `${svSize.h}px`;

      hueCanvas.width = hueSize.w;
      hueCanvas.height = hueSize.h;
      hueCanvas.style.width = `${hueSize.w}px`;
      hueCanvas.style.height = `${hueSize.h}px`;
    };

    applyCanvasSizes();
    pickerContainer.appendChild(svCanvas);
    pickerContainer.appendChild(hueCanvas);

    window.addEventListener("resize", () => {
      applyCanvasSizes();
      if (typeof renderHueCanvas === "function" && typeof renderSVCanvas === "function") {
        renderHueCanvas();
        renderSVCanvas();
      }
    });

    const hexRow = document.createElement("div");
    hexRow.className = "mk-color-hex-row";
    hexRow.appendChild(colorInput);
    hexRow.appendChild(colorDisplay);

    const colorPickerWrapper = document.createElement("div");
    colorPickerWrapper.className = "mk-color-picker-shell";
    colorPickerWrapper.appendChild(pickerContainer);
    colorPickerWrapper.appendChild(hexRow);

    if (isMobileNarrow) {
      colorPickerWrapper.style.padding = "0 12px";
      colorPickerWrapper.style.gap = "12px";
      pickerContainer.style.alignItems = "center";
      hexRow.style.width = "100%";
      hexRow.style.padding = "0 12px";
      hexRow.style.boxSizing = "border-box";
      hexRow.style.marginTop = "6px";
    }

    const rgbContainer = document.createElement("div");
    rgbContainer.className = "color-info";
    rgbContainer.style.marginTop = "15px";

    // --- HELPER: Create labeled number input ---
    const createColorInput = (id, translationKey) => {
      const label = document.createElement("label");
      label.htmlFor = id;
      label.setAttribute("data-translate-key", translationKey);

      const input = document.createElement("input");
      Object.assign(input, {
        type: "number",
        id,
        min: "0",
        max: "255",
        step: "1",
        value: "255",
        className: "themed-input"
      });
      return { label, input };
    };

    const { label: rLabel, input: rInput } = createColorInput("red-value", "redLabel");
    const { label: gLabel, input: gInput } = createColorInput("green-value", "greenLabel");
    const { label: bLabel, input: bInput } = createColorInput("blue-value", "blueLabel");

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

    const customColorBlock = document.createElement("div");
    customColorBlock.className = "catalog-block";
    customColorBlock.appendChild(title);
    customColorBlock.appendChild(colorPickerWrapper);
    customColorBlock.appendChild(rgbContainer);

    // --- UI INJECTION ---
    // Insert the custom color block into the DOM after the Body Color heading
    if (bodyColorSection && bodyColorSection.parentNode) {
      bodyColorSection.parentNode.insertBefore(
        customColorBlock,
        bodyColorSection.nextSibling
      );
    } else {
      console.error(
        "Color Picker Error: Could not insert custom color block; body color section missing."
      );
      return;
    }

    // --- STATE + DRAW HELPERS ---
    const hueCtx = hueCanvas.getContext("2d");
    const svCtx = svCanvas.getContext("2d");

    const state = {
      h: 0,
      s: 0,
      v: 1,
    };

    const setStateFromRgb = (r, g, b) => {
      const hsv = rgbToHsv(r, g, b);
      state.h = hsv.h;
      state.s = hsv.s;
      state.v = hsv.v;
      applyStateToUI();
    };

    const renderHueCanvas = () => {
      const grad = hueCtx.createLinearGradient(0, 0, hueCanvas.width, 0);
      grad.addColorStop(0, "rgb(255,0,0)");
      grad.addColorStop(1 / 6, "rgb(255,255,0)");
      grad.addColorStop(2 / 6, "rgb(0,255,0)");
      grad.addColorStop(3 / 6, "rgb(0,255,255)");
      grad.addColorStop(4 / 6, "rgb(0,0,255)");
      grad.addColorStop(5 / 6, "rgb(255,0,255)");
      grad.addColorStop(1, "rgb(255,0,0)");
      hueCtx.fillStyle = grad;
      hueCtx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);

      const x = (state.h / 360) * hueCanvas.width;
      hueCtx.strokeStyle = "#fff";
      hueCtx.lineWidth = 2;
      hueCtx.beginPath();
      hueCtx.moveTo(x, 0);
      hueCtx.lineTo(x, hueCanvas.height);
      hueCtx.stroke();
      hueCtx.strokeStyle = "rgba(0,0,0,0.35)";
      hueCtx.beginPath();
      hueCtx.moveTo(x + 2, 0);
      hueCtx.lineTo(x + 2, hueCanvas.height);
      hueCtx.stroke();
    };

    const renderSVCanvas = () => {
      const { h } = state;
      const { r, g, b } = hsvToRgb(h, 1, 1);
      const w = svCanvas.width;
      const hgt = svCanvas.height;

      const satGrad = svCtx.createLinearGradient(0, 0, w, 0);
      satGrad.addColorStop(0, "white");
      satGrad.addColorStop(1, `rgb(${r},${g},${b})`);
      svCtx.fillStyle = satGrad;
      svCtx.fillRect(0, 0, w, hgt);

      const valGrad = svCtx.createLinearGradient(0, 0, 0, hgt);
      valGrad.addColorStop(0, "rgba(0,0,0,0)");
      valGrad.addColorStop(1, "rgba(0,0,0,1)");
      svCtx.fillStyle = valGrad;
      svCtx.fillRect(0, 0, w, hgt);

      const x = state.s * w;
      const y = (1 - state.v) * hgt;
      svCtx.strokeStyle = "#fff";
      svCtx.lineWidth = 2;
      svCtx.beginPath();
      svCtx.arc(x, y, 6, 0, Math.PI * 2);
      svCtx.stroke();
      svCtx.strokeStyle = "rgba(0,0,0,0.45)";
      svCtx.beginPath();
      svCtx.arc(x + 1, y + 1, 6, 0, Math.PI * 2);
      svCtx.stroke();
    };

    const applyStateToUI = () => {
      const { r, g, b } = hsvToRgb(state.h, state.s, state.v);
      const hexColor = hexFromRgb(r, g, b);
      colorDisplay.style.backgroundColor = hexColor;
      colorInput.value = hexColor;
      rInput.value = r;
      gInput.value = g;
      bInput.value = b;
      renderHueCanvas();
      renderSVCanvas();
    };

    renderHueCanvas();
    renderSVCanvas();

    // --- EVENT HANDLERS (HSV CANVAS) ---
    // Update color based on X position for Hue
    const handleHue = (clientX) => {
      const rect = hueCanvas.getBoundingClientRect();
      const x = clamp01((clientX - rect.left) / rect.width);
      state.h = x * 360;
      applyStateToUI();
    };

    // Update saturation/value based on X/Y position
    const handleSV = (clientX, clientY) => {
      const rect = svCanvas.getBoundingClientRect();
      const x = clamp01((clientX - rect.left) / rect.width);
      const y = clamp01((clientY - rect.top) / rect.height);
      state.s = x;
      state.v = 1 - y;
      applyStateToUI();
    };

    let draggingHue = false;
    let draggingSV = false;

    // Mouse Events
    hueCanvas.addEventListener("mousedown", (e) => {
      draggingHue = true;
      handleHue(e.clientX);
    });
    svCanvas.addEventListener("mousedown", (e) => {
      draggingSV = true;
      handleSV(e.clientX, e.clientY);
    });

    window.addEventListener("mousemove", (e) => {
      if (draggingHue) handleHue(e.clientX);
      if (draggingSV) handleSV(e.clientX, e.clientY);
    });
    window.addEventListener("mouseup", () => {
      draggingHue = false;
      draggingSV = false;
    });

    // Touch Events
    hueCanvas.addEventListener("touchstart", (e) => {
      draggingHue = true;
      e.preventDefault(); // Stop scrolling
      handleHue(e.touches[0].clientX);
    }, { passive: false });

    svCanvas.addEventListener("touchstart", (e) => {
      draggingSV = true;
      e.preventDefault(); // Stop scrolling
      handleSV(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (draggingHue) {
        e.preventDefault(); // Stop scrolling
        handleHue(e.touches[0].clientX);
      }
      if (draggingSV) {
        e.preventDefault(); // Stop scrolling
        handleSV(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    window.addEventListener("touchend", () => {
      draggingHue = false;
      draggingSV = false;
    });

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
      setStateFromRgb(r, g, b);
    };

    // To keep the UI in sync, wrap the original `selectColor` method.
    // This ensures the custom color picker updates whenever a preset color is chosen.
    if (window.makerInstance) {
      const originalSelectColor = window.makerInstance.selectColor;
      window.makerInstance.selectColor = function (color) {
        originalSelectColor.call(this, color);
        setTimeout(window.updateColorPickerFromFillColor, 50);
        setTimeout(() => {
          const currentSelectedColor = document.querySelector("[data-mkfill][data-mkselect]");
          if (currentSelectedColor) {
            currentSelectedColor.classList.remove("mkselect");
            currentSelectedColor.removeAttribute("data-mkselect");
          }
        }, 50);
      };
    }

    const presetColors = document.querySelectorAll("span[data-mkfill]");
    presetColors.forEach(function (colorEl) {
      colorEl.addEventListener("click", function () {
        setTimeout(window.updateColorPickerFromFillColor, 50);
      });
    });

    const maker = window.makerInstance;
    if (!maker) {
      console.warn(
        "Color Picker Warning: Maker instance not found. Some functionality may be limited."
      );
    }

    // --- UI EVENT LISTENERS ---
    // These listeners keep the color swatch, hex input, and RGB inputs synchronized.
    const syncHexInput = (el) => {
      const cleaned = sanitizeHexInput(el.value);
      el.value = cleaned;
      const rgb = parseHex(cleaned);
      if (rgb) {
        setStateFromRgb(rgb.r, rgb.g, rgb.b);
      }
    };

    colorInput.addEventListener("input", function () {
      syncHexInput(this);
    });
    colorInput.addEventListener("blur", function () {
      syncHexInput(this);
    });

    // Insert Preset Colors heading above the preset swatches batch
    const presetsHeading = document.createElement("h4");
    presetsHeading.setAttribute("data-translate-key", "presetColorsSubheading");
    presetsHeading.style.marginTop = "15px";
    presetsHeading.style.marginBottom = "5px";
    presetsHeading.textContent =
      currentLang === "ja" ? "プリセットカラー" : "Preset Colors";

    const firstPreset = document.querySelector(
      '#catalog-body-colors span[data-mkfill]'
    );
    if (firstPreset && firstPreset.parentNode) {
      firstPreset.parentNode.insertBefore(presetsHeading, firstPreset);
    } else {
      // fallback: append near the custom color block
      customColorBlock.parentNode.insertBefore(
        presetsHeading,
        customColorBlock.nextSibling
      );
    }

    // Refresh translation for the newly added heading
    if (
      window.languageManager &&
      typeof window.languageManager.updateUI === "function" &&
      typeof window.languageManager.getCurrentLanguage === "function"
    ) {
      window.languageManager.updateUI(
        window.languageManager.getCurrentLanguage()
      );
    }

    function updateFromRGB() {
      const r = Math.min(255, Math.max(0, parseInt(rInput.value)));
      const g = Math.min(255, Math.max(0, parseInt(gInput.value)));
      const b = Math.min(255, Math.max(0, parseInt(bInput.value)));
      setStateFromRgb(r, g, b);
    }

    rInput.addEventListener("input", updateFromRGB);
    gInput.addEventListener("input", updateFromRGB);
    bInput.addEventListener("input", updateFromRGB);

    function handleSpinnerClick(event) {
      const input = event.target;
      const rect = input.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Only proceed if the click is within the horizontal "arrow zone"
      if (clickX > rect.width - ARROW_ZONE_WIDTH_PX) {
        // Prevent the input from gaining focus when clicking the arrows
        event.preventDefault();

        // Check if the click is in the top or bottom half of the input
        if (clickY < rect.height / 2) {
          input.stepUp();
        } else {
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

      if (mouseX > rect.width - ARROW_ZONE_WIDTH_PX) {
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
  };

  // --- INITIALIZATION ---
  // Listen for makerReady event dispatched by maker.js, with fallback polling
  const bodyColorSection = document.querySelector(
    'h2.section[data-translate-key="sectionHeaderBodyColor"]'
  );

  const tryInit = () => {
    if (bodyColorSection && window.makerInstance) {
      init(bodyColorSection);
      return true;
    }
    return false;
  };

  // Try immediate initialization
  if (!tryInit()) {
    // Listen for the makerReady event
    const handleMakerReady = () => {
      if (tryInit()) {
        window.removeEventListener('makerReady', handleMakerReady);
      }
    };
    window.addEventListener('makerReady', handleMakerReady);

    // Fallback: polling with timeout
    const startTime = performance.now();
    const pollForReady = () => {
      if (tryInit()) return;
      if (performance.now() - startTime > INIT_TIMEOUT_MS) {
        console.warn("Color Picker: maker not ready after waiting; initializing anyway.");
        init(bodyColorSection);
        return;
      }
      setTimeout(pollForReady, INIT_POLL_INTERVAL_MS);
    };
    setTimeout(pollForReady, INIT_POLL_INTERVAL_MS);
  }
});