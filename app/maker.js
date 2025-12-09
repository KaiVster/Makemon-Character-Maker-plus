/**
 * @fileoverview Makemon Character Maker - Core image compositing engine
 * @author Sho (Original) - http://furrytail.sakura.ne.jp/
 * @author KaiVs (Plus enhancements)
 */

/** @constant {number} Maximum RGB channel value */
const MAX_RGB = 255;

class Maker {
  constructor() {
    // Initialization
    this.resultImage = document.querySelector("IMG[data-mkresult]");
    this.layerImages = document.querySelectorAll("IMG[data-mklayer]");
    this.lineColors = document.querySelectorAll("[data-mkline]");
    this.fillColors = document.querySelectorAll("[data-mkfill]");
    this.resultCanvas = document.createElement("canvas");
    this.resultContext = this.resultCanvas.getContext("2d");
    this.workCanvas = document.createElement("canvas");
    this.workContext = this.workCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    this.lineColor = { red: 0, green: 0, blue: 0 };
    this.fillColor = { red: 1, green: 1, blue: 1 };
    this.maxLayer = 0;

    if (!this.resultImage) {
      throw 'Cannot set the icon output destination. Please describe an IMG tag with the "data-mkresult" attribute "only once" somewhere in the page.';
    }

    if (!this.layerImages.length) {
      throw 'There are no icon materials. Please describe an IMG tag with the "data-mklayer" attribute somewhere in the page.';
    }

    this.resultCanvas.width = this.resultImage.getAttribute("width");
    this.resultCanvas.height = this.resultImage.getAttribute("height");
    this.workCanvas.width = this.resultImage.getAttribute("width");
    this.workCanvas.height = this.resultImage.getAttribute("height");

    this.initializeListeners();
    this.updateResultImage();
  }

  initializeListeners() {
    this.layerImages.forEach((image) => {
      image.addEventListener("click", () => {
        this.selectImage(image);
        this.updateResultImage();
      });
      image.addEventListener("mouseover", () => addTooltip(image));
      image.addEventListener("mouseout", () => deleteTooltip());

      if (image.getAttribute("data-mkselect")) {
        this.selectImage(image);
      }

      const layer = parseInt(image.getAttribute("data-mklayer"), 10);
      if (this.maxLayer < layer) {
        this.maxLayer = layer;
      }
    });

    const setupColorListeners = (elements) => {
      elements.forEach((colorSwatch) => {
        colorSwatch.addEventListener("click", () => {
          this.selectColor(colorSwatch);
          this.updateResultImage();
        });
        if (colorSwatch.getAttribute("data-mkselect")) {
          this.selectColor(colorSwatch);
        }
      });
    };
    setupColorListeners(this.lineColors);
    setupColorListeners(this.fillColors);
  }

  /**
   * Updates the final character icon by compositing all selected layers.
   * @returns {void}
   */
  updateResultImage() {
    this.resultContext.clearRect(
      0,
      0,
      this.resultCanvas.width,
      this.resultCanvas.height
    );

    // Cache all selected images once to avoid repeated DOM queries
    const selectedImages = document.querySelectorAll('[data-mkselect]');
    const imagesByLayer = new Map();
    selectedImages.forEach((img) => {
      const layer = img.getAttribute('data-mklayer');
      if (layer !== null) {
        imagesByLayer.set(parseInt(layer, 10), img);
      }
    });

    for (let i = 0; i <= this.maxLayer; ++i) {
      const image = imagesByLayer.get(i);
      if (image) {
        if (image.hasAttribute("data-mkclip")) {
          this.clipImage(image);
        } else if (image.hasAttribute("data-mkcolor")) {
          this.drawColorImage(image);
        } else {
          this.drawImage(image);
        }
      }
    }
    this.resultImage.setAttribute("src", this.resultCanvas.toDataURL());
    window.syncStickyPreviewImage?.();
  }

  /**
   * Draws an image layer with line/fill color blending applied.
   * @param {HTMLImageElement} image - The source image to draw
   * @returns {void}
   */
  drawImage(image) {
    this.workContext.clearRect(
      0,
      0,
      this.workCanvas.width,
      this.workCanvas.height
    );
    this.workContext.drawImage(
      image,
      0,
      0,
      this.workCanvas.width,
      this.workCanvas.height
    );
    const imageData = this.workContext.getImageData(
      0,
      0,
      this.workCanvas.width,
      this.workCanvas.height
    );
    const data = imageData.data;

    // Cache color values outside loop for performance
    const { red: lineR, green: lineG, blue: lineB } = this.lineColor;
    const { red: fillR, green: fillG, blue: fillB } = this.fillColor;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      data[i] = lineR * (MAX_RGB - r) + fillR * r;
      data[i + 1] = lineG * (MAX_RGB - g) + fillG * g;
      data[i + 2] = lineB * (MAX_RGB - b) + fillB * b;
    }
    this.workContext.putImageData(imageData, 0, 0);
    this.resultContext.drawImage(
      this.workCanvas,
      0,
      0,
      this.resultCanvas.width,
      this.resultCanvas.height
    );
  }

  /**
   * Draws an image layer without color transformation (preserves original colors).
   * @param {HTMLImageElement} image - The source image to draw
   * @returns {void}
   */
  drawColorImage(image) {
    this.resultContext.drawImage(
      image,
      0,
      0,
      this.resultCanvas.width,
      this.resultCanvas.height
    );
  }

  /**
   * Applies a clipping mask using the specified image.
   * @param {HTMLImageElement} image - The mask image
   * @returns {void}
   */
  clipImage(image) {
    this.workContext.clearRect(
      0,
      0,
      this.workCanvas.width,
      this.workCanvas.height
    );
    this.workContext.drawImage(
      image,
      0,
      0,
      this.workCanvas.width,
      this.workCanvas.height
    );
    const workImageData = this.workContext.getImageData(
      0,
      0,
      this.workCanvas.width,
      this.workCanvas.height
    );
    const resultImageData = this.resultContext.getImageData(
      0,
      0,
      this.resultCanvas.width,
      this.resultCanvas.height
    );
    const workData = workImageData.data;
    const resultData = resultImageData.data;

    // Cache color values outside loop for performance
    const lineR = this.lineColor.red * MAX_RGB;
    const lineG = this.lineColor.green * MAX_RGB;
    const lineB = this.lineColor.blue * MAX_RGB;
    const RGB_CHANNELS = 3;

    for (let i = 0; i < resultData.length; i += 4) {
      resultData[i + 3] = resultData[i + 3] - workData[i + 3];
      workData[i + 3] =
        (((MAX_RGB * RGB_CHANNELS - workData[i] - workData[i + 1] - workData[i + 2]) / RGB_CHANNELS) *
          workData[i + 3]) /
        MAX_RGB;
      workData[i] = lineR;
      workData[i + 1] = lineG;
      workData[i + 2] = lineB;
    }
    this.workContext.putImageData(workImageData, 0, 0);
    this.resultContext.putImageData(resultImageData, 0, 0);
    this.resultContext.drawImage(
      this.workCanvas,
      0,
      0,
      this.resultCanvas.width,
      this.resultCanvas.height
    );
  }

  /**
   * Selects an image part and marks it as the active choice for its layer.
   * @param {HTMLImageElement} image - The image element to select
   * @returns {void}
   */
  selectImage(image) {
    const layer = image.getAttribute("data-mklayer");
    const currentSelected = document.querySelector(
      `[data-mklayer="${layer}"][data-mkselect]`
    );
    if (currentSelected) {
      currentSelected.classList.remove("mkselect");
      currentSelected.removeAttribute("data-mkselect");
    }
    image.classList.add("mkselect");
    image.setAttribute("data-mkselect", "true");
  }

  /**
   * Applies a color swatch as the current line or fill color.
   * @param {HTMLElement} colorSwatch - The color swatch element with data-mkline or data-mkfill
   * @returns {void}
   */
  selectColor(colorSwatch) {
    const isLineColor = colorSwatch.hasAttribute("data-mkline");
    const isFillColor = colorSwatch.hasAttribute("data-mkfill");

    const colorDataString = isLineColor
      ? colorSwatch.getAttribute("data-mkline")
      : isFillColor
        ? colorSwatch.getAttribute("data-mkfill")
        : null;

    if (!colorDataString) return;

    const [red, green, blue] = colorDataString.split(",").map(parseFloat);
    const colorObject = { red, green, blue };

    if (isLineColor) {
      this.lineColor = colorObject;
    } else {
      this.fillColor = colorObject;
    }

    const querySelector = isLineColor
      ? "[data-mkline][data-mkselect]"
      : "[data-mkfill][data-mkselect]";
    const currentSelected = document.querySelector(querySelector);
    currentSelected?.classList.remove("mkselect");
    currentSelected?.removeAttribute("data-mkselect");

    colorSwatch.classList.add("mkselect");
    colorSwatch.setAttribute("data-mkselect", "true");
  }
}

function addTooltip(image) {
  // Remove any existing tooltip first so we always have one visible instance
  deleteTooltip();

  const container = image.parentNode;

  // Ensure positioning context so the tooltip can align relative to this container
  const computedPos = window.getComputedStyle(container).position;
  if (computedPos === "static" || !computedPos) {
    container.style.position = "relative";
  }

  const key = image.dataset.translateAltKey;
  const altText = image.getAttribute("alt");
  // Use optional chaining for cleaner null checks
  const tooltipText = window.languageManager?.getTranslation?.(key, altText) ?? altText;

  const span = document.createElement("span");
  const innerSpan = document.createElement("span");
  span.setAttribute("class", "mktooltipcontainer");
  // Inline fallbacks so visibility doesn't depend solely on CSS load order
  span.style.position = "fixed";
  span.style.display = "block";
  span.style.pointerEvents = "none";
  span.style.zIndex = "3000";
  span.style.whiteSpace = "normal";
  span.style.maxWidth = "calc(100vw - 16px)";
  span.style.textAlign = "center";
  innerSpan.setAttribute("class", "mktooltip");
  innerSpan.innerText = tooltipText;
  // Ensure visual styling even if CSS is late
  innerSpan.style.backgroundColor = "var(--tooltip-bg-color, #222)";
  innerSpan.style.color = "var(--tooltip-text-color, #fff)";
  innerSpan.style.borderRadius = "5px";
  innerSpan.style.border = "1px solid var(--tooltip-bg-color, #222)";
  innerSpan.style.padding = "4px 6px";
  innerSpan.style.fontWeight = "bold";
  innerSpan.style.display = "inline-block";
  innerSpan.style.wordBreak = "break-word";
  innerSpan.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";

  // Position tooltip centered over the image itself (not the full row)
  const rect = image.getBoundingClientRect();
  const viewportPadding = 8; // prevent touching edges
  const leftPx = Math.min(
    Math.max(rect.left + rect.width / 2, viewportPadding),
    window.innerWidth - viewportPadding
  );
  // Place above the image with a small gap, but keep at least viewportPadding visible
  const topPx = Math.max(rect.top - 12, viewportPadding);

  span.style.left = `${leftPx}px`;
  span.style.top = `${topPx}px`;
  // Keep X-centered and lift fully above the part
  span.style.transform = "translate(-50%, -100%)";

  span.appendChild(innerSpan);
  // Append to body so it won't be clipped by container overflow
  document.body.appendChild(span);
}

/**
 * Removes any existing tooltip from the DOM.
 * @returns {void}
 */
function deleteTooltip() {
  document.querySelector(".mktooltipcontainer")?.remove();
}

// Processing
let makerInitialized = false;

/**
 * Initializes the Maker instance and dispatches a ready event.
 * @returns {Maker} The singleton Maker instance
 */
function initMaker() {
  if (makerInitialized) return window.makerInstance;
  window.makerInstance = new Maker();
  makerInitialized = true;
  // Dispatch event for dependent modules instead of requiring polling
  window.dispatchEvent(new CustomEvent('makerReady', { detail: window.makerInstance }));
  return window.makerInstance;
}

if (window.autoInitMaker !== false) {
  window.addEventListener("load", initMaker);
}

window.initMaker = initMaker;