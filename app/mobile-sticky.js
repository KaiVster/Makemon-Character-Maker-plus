/**
 * @fileoverview Mobile sticky preview functionality for Makemon Character Maker+
 * Creates a floating preview image when scrolling on mobile devices.
 */

/** @constant {number} Maximum viewport width for mobile behavior */
const MOBILE_MAX_WIDTH = 900;
/** @constant {number} Scroll buffer to prevent flicker at threshold */
const SCROLL_BUFFER_PX = 10;

document.addEventListener("DOMContentLoaded", function () {
  const originalPreviewImage = document.querySelector(
    'img[data-mkresult="true"]'
  );
  const kanseiImage = document.querySelector("#kansei-reference");
  const layoutContainer = document.querySelector(".main-layout-container");

  if (!originalPreviewImage || !layoutContainer) {
    console.error("Sticky Preview: Required elements not found.");
    return;
  }

  // --- INIT DOM ELEMENTS ---
  const originalContainer = document.createElement("div");
  originalContainer.className = "preview-sticky-container";
  originalPreviewImage.parentNode.insertBefore(
    originalContainer,
    originalPreviewImage
  );
  originalContainer.appendChild(originalPreviewImage);
  if (kanseiImage) {
    originalContainer.appendChild(kanseiImage);
  }

  const placeholder = document.createElement("div");
  placeholder.id = "preview-placeholder";
  originalContainer.parentNode.insertBefore(placeholder, originalContainer);

  let stickyClone = null;
  let scrollThreshold = 0;

  // Sync function to update sticky preview image
  window.syncStickyPreviewImage = function () {
    if (!stickyClone) return;
    // Find the preview image in both original and sticky
    const originalImg = originalContainer.querySelector('img[data-mkresult="true"]');
    const stickyImg = stickyClone.querySelector('img[data-mkresult="true"]');
    if (originalImg && stickyImg) {
      stickyImg.src = originalImg.src;
      // Copy other relevant attributes if needed
      stickyImg.alt = originalImg.alt;
      stickyImg.className = originalImg.className;
      stickyImg.style = originalImg.style.cssText;
    }
  };

  // --- CORE FUNCTIONS ---
  function calculateScrollThreshold() {
    scrollThreshold = placeholder.offsetTop;
  }

  function destroyStickyClone() {
    if (stickyClone) {
      stickyClone.remove();
      stickyClone = null;
      originalContainer.classList.remove("original-is-hidden");
    }
  }

  function isSettingsPanelOpen() {
    return document.body.classList.contains("settings-panel-open");
  }

  /**
   * Handles scroll events to show/hide the sticky clone on mobile.
   */
  function handleScroll() {
    const isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
    if (!isMobile || isSettingsPanelOpen()) {
      destroyStickyClone();
      return;
    }

    const scrollY = window.scrollY;
    const threshold = scrollThreshold + SCROLL_BUFFER_PX;

    if (scrollY > threshold && !stickyClone) {
      stickyClone = originalContainer.cloneNode(true);
      stickyClone.classList.add("is-sticky");
      document.body.appendChild(stickyClone);
      originalContainer.classList.add("original-is-hidden");
      window.syncStickyPreviewImage();
    } else if (scrollY <= threshold && stickyClone) {
      destroyStickyClone();
    }
  }

  /**
   * Handles window resize to reposition elements appropriately.
   */
  function handleResize() {
    destroyStickyClone();

    const isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;

    if (isMobile) {
      if (originalContainer.parentNode !== placeholder.parentNode) {
        placeholder.parentNode.insertBefore(
          originalContainer,
          placeholder.nextSibling
        );
      }
    } else {
      if (originalContainer.parentNode !== layoutContainer) {
        layoutContainer.insertBefore(
          originalContainer,
          layoutContainer.firstChild
        );
      }
    }

    // Force browser reflow
    void placeholder.offsetHeight;

    calculateScrollThreshold();
    handleScroll();
  }

  // --- EXECUTION ---
  function init() {
    handleResize(); // Run once on load to set the correct initial position.
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    // Also run on window load as a final fallback for complex layouts.
    window.addEventListener("load", handleResize);
  }

  // Wait for the DOM to be fully loaded before running the script.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // If DOM is already ready, run immediately.
    init();
  }
});