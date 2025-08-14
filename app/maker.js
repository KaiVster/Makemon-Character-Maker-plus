/*	
	Original maker.js creator: Sho
	http://furrytail.sakura.ne.jp/
  
	+ (Plus) added functions: KaiVs
*/

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
   * @brief Updates the icon image.
   */
  updateResultImage() {
    this.resultContext.clearRect(
      0,
      0,
      this.resultCanvas.width,
      this.resultCanvas.height
    );
    for (let i = 0; i <= this.maxLayer; ++i) {
      const image = document.querySelector(
        `[data-mklayer="${i}"][data-mkselect]`
      );
      if (image) {
        if (image.getAttribute("data-mkclip")) {
          this.clipImage(image);
        } else if (image.getAttribute("data-mkcolor")) {
          this.drawColorImage(image);
        } else {
          this.drawImage(image);
        }
      }
    }
    this.resultImage.setAttribute("src", this.resultCanvas.toDataURL());
    if (window.syncStickyPreviewImage) window.syncStickyPreviewImage();
  }

  /**
   * @brief Draws the specified image on the internal canvas.
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
    for (let i = 0; i < data.length; i += 4) {
      data[i] =
        this.lineColor.red * (255 - data[i]) + this.fillColor.red * data[i];
      data[i + 1] =
        this.lineColor.green * (255 - data[i + 1]) +
        this.fillColor.green * data[i + 1];
      data[i + 2] =
        this.lineColor.blue * (255 - data[i + 2]) +
        this.fillColor.blue * data[i + 2];
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
   * @brief Draws the specified image on the internal canvas without changing its color.
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
   * @brief Masks the internal canvas using the specified image.
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
    for (let i = 0; i < resultData.length; i += 4) {
      resultData[i + 3] = resultData[i + 3] - workData[i + 3];
      workData[i + 3] =
        (((255 * 3 - workData[i] - workData[i + 1] - workData[i + 2]) / 3) *
          workData[i + 3]) /
        255;
      workData[i] = this.lineColor.red * 255;
      workData[i + 1] = this.lineColor.green * 255;
      workData[i + 2] = this.lineColor.blue * 255;
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
   * @brief Sets the specified image to the selected state.
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
   * @brief Uses the specified color.
   */
  selectColor(colorSwatch) {
    let colorDataString;
    let querySelector;

    if (colorSwatch.hasAttribute("data-mkline")) {
      colorDataString = colorSwatch.getAttribute("data-mkline");
      querySelector = "[data-mkline][data-mkselect]";
    } else if (colorSwatch.hasAttribute("data-mkfill")) {
      colorDataString = colorSwatch.getAttribute("data-mkfill");
      querySelector = "[data-mkfill][data-mkselect]";
    }

    if (colorDataString) {
      const colorData = colorDataString.split(",");
      const colorObject = {
        red: parseFloat(colorData[0]),
        green: parseFloat(colorData[1]),
        blue: parseFloat(colorData[2]),
      };

      if (colorSwatch.hasAttribute("data-mkline")) {
        this.lineColor = colorObject;
      } else {
        this.fillColor = colorObject;
      }

      const currentSelected = document.querySelector(querySelector);
      if (currentSelected) {
        currentSelected.classList.remove("mkselect");
        currentSelected.removeAttribute("data-mkselect");
      }
      colorSwatch.classList.add("mkselect");
      colorSwatch.setAttribute("data-mkselect", "true");
    }
  }
}

function addTooltip(image) {
  const container = image.parentNode;
  // Prevent adding multiple tooltips
  if (container.querySelector(".mktooltipcontainer")) {
    return;
  }

  const key = image.dataset.translateAltKey;
  const altText = image.getAttribute("alt");
  let tooltipText = altText; // Default to alt text

  if (
    key &&
    window.languageManager &&
    typeof window.languageManager.getTranslation === "function"
  ) {
    // Use the getTranslation function, providing the original alt text as a fallback.
    tooltipText = window.languageManager.getTranslation(key, altText);
  }

  const span = document.createElement("span");
  const innerSpan = document.createElement("span");
  span.setAttribute("class", "mktooltipcontainer");
  innerSpan.setAttribute("class", "mktooltip");
  innerSpan.innerText = tooltipText;
  span.appendChild(innerSpan);
  container.insertBefore(span, image);
}

function deleteTooltip() {
  const tooltipElement = document.querySelector(".mktooltipcontainer");
  if (tooltipElement) {
    tooltipElement.remove();
  }
}

// Processing
window.addEventListener("load", () => {
  window.makerInstance = new Maker();
});