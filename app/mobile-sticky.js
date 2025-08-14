document.addEventListener("DOMContentLoaded", function () {
  const originalPreviewImage = document.querySelector(
    'img[data-mkresult="true"]'
  );
  const layoutContainer = document.querySelector(".main-layout-container");
  const mobileMaxWidth = 768;

  if (!originalPreviewImage || !layoutContainer) {
    console.error("Sticky Preview: Required elements not found.");
    return;
  }

  // 1. Create the container and placeholder
  const originalContainer = document.createElement("div");
  originalContainer.className = "preview-sticky-container";
  originalPreviewImage.parentNode.insertBefore(
    originalContainer,
    originalPreviewImage
  );
  originalContainer.appendChild(originalPreviewImage);

  const placeholder = document.createElement("div");
  placeholder.id = "preview-placeholder";
  originalContainer.parentNode.insertBefore(placeholder, originalContainer);

  let stickyClone = null;
  let scrollThreshold = 0;

  // Sync function to update sticky preview image
  window.syncStickyPreviewImage = function() {
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

  // 2. Define Core Functions
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

  function handleScroll() {
    // This function now ONLY handles the mobile clone-and-stick behavior.
    const isMobile = window.innerWidth <= mobileMaxWidth;
    if (!isMobile) {
      // If we're not on mobile, ensure any old clone is gone.
      destroyStickyClone();
      return;
    }

    const scrollY = window.scrollY;

    // --- MOBILE STICKY THRESHOLD ---
    // Change the '+ xxx' value below to make the sticky image appear sooner or later.
    // Higher numbers mean you have to scroll further down before it appears.
    if (scrollY > scrollThreshold + 10 && !stickyClone) {
      stickyClone = originalContainer.cloneNode(true);
      stickyClone.classList.add("is-sticky");
      document.body.appendChild(stickyClone);
      originalContainer.classList.add("original-is-hidden");
      // Sync immediately on creation
      window.syncStickyPreviewImage();
    } else if (scrollY <= scrollThreshold + 10 && stickyClone) {
      destroyStickyClone();
    }
  }

  function handleResize() {
    destroyStickyClone();

    const isMobile = window.innerWidth <= mobileMaxWidth;

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

    const _ = placeholder.offsetHeight; // This line forces the browser to reflow.

    calculateScrollThreshold();
    handleScroll(); // Re-run scroll check to apply the new threshold immediately.
  }

  // 3. Core Logic Execution
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