const backgroundImages = [
  "../Makemon/bg.png", // Default background
  "../Makemon/bg2.png",
];
let currentBackgroundIndex = 0;

function cycleBackground() {
  const changeBgButton = document.getElementById("changeBgButton");
  if (changeBgButton.disabled) {
    return; // Animation is already in progress, do nothing.
  }
  changeBgButton.disabled = true; // Disable button immediately to prevent spam.

  const body = document.body;
  const bgContainer1 = document.getElementById("background-container-1");
  const bgContainer2 = document.getElementById("background-container-2");

  currentBackgroundIndex =
    (currentBackgroundIndex + 1) % backgroundImages.length;
  localStorage.setItem(
    "selectedBackgroundIndex",
    currentBackgroundIndex.toString()
  );
  const newImageUrl = `url('${backgroundImages[currentBackgroundIndex]}')`;

  // Set the new image on the top container (bgContainer2).
  bgContainer2.style.backgroundImage = newImageUrl;

  const handleFadeOutEnd = () => {
    // Step 3: The fade-out is complete. It's now safe to re-enable the button.
    changeBgButton.disabled = false;
  };

  const handleFadeInEnd = (event) => {
    // only act on the opacity transition.
    if (event.propertyName !== "opacity") return;

    // Step 1: The fade-in is complete. Update the bottom layer to the new image.
    bgContainer1.style.backgroundImage = newImageUrl;

    // Step 2: Start the fade-out by removing the class. This triggers a new transition.
    body.classList.remove("is-crossfading");

    // Listen for the fade-out to finish before re-enabling the button.
    bgContainer2.addEventListener("transitionend", handleFadeOutEnd, {
      once: true,
    });
  };

  // Add the class to start the fade-in animation.
  body.classList.add("is-crossfading");

  // Listen for the fade-in to finish.
  bgContainer2.addEventListener("transitionend", handleFadeInEnd, {
    once: true,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const themeButtons = {
    light: document.getElementById("theme-light"),
    dark: document.getElementById("theme-dark"),
    amoled: document.getElementById("theme-amoled"),
  };

  const validThemes = ["light", "dark", "amoled"];
  const bodyClassPrefix = "theme-"; // e.g. body will have class 'theme-light'

  function setTheme(themeName) {
    if (!validThemes.includes(themeName)) {
      console.error(`Invalid theme: ${themeName}. Defaulting to light.`);
      themeName = "light";
    }

    // Remove any existing theme classes from body
    validThemes.forEach((theme) => {
      document.body.classList.remove(bodyClassPrefix + theme);
    });

    // Add new theme class to body
    document.body.classList.add(bodyClassPrefix + themeName);

    // Update button selected state
    validThemes.forEach((theme) => {
      if (themeButtons[theme]) {
        themeButtons[theme].classList.remove("theme-selected");
      }
    });
    if (themeButtons[themeName]) {
      themeButtons[themeName].classList.add("theme-selected");
    }

    // Save theme to localStorage
    try {
      localStorage.setItem("selectedTheme", themeName);
    } catch (e) {
      console.error("Failed to save theme to localStorage:", e);
    }
  }

  // Add event listeners to theme buttons
  Object.keys(themeButtons).forEach((themeKey) => {
    if (themeButtons[themeKey]) {
      themeButtons[themeKey].addEventListener("click", () =>
        setTheme(themeKey)
      );
    }
  });

  // Load saved theme or default to light
  let savedTheme = "light"; // Default theme
  try {
    const storedTheme = localStorage.getItem("selectedTheme");
    if (storedTheme && validThemes.includes(storedTheme)) {
      savedTheme = storedTheme;
    }
  } catch (e) {
    console.error("Failed to load theme from localStorage:", e);
  }
  setTheme(savedTheme);

  // Content Style Toggle
  const toggleFrostedGlassButton = document.getElementById(
    "toggleFrostedGlassButton"
  );
  const bodyElement = document.body;

  if (toggleFrostedGlassButton) {
    const updateFrostedGlassButtonState = () => {
      if (bodyElement.classList.contains("frosted-content-active")) {
        toggleFrostedGlassButton.classList.add("theme-selected");
      } else {
        toggleFrostedGlassButton.classList.remove("theme-selected");
      }
    };

    // Load saved preference for content style
    const isContentFrosted =
      localStorage.getItem("contentStyleFrosted") === "true";
    if (isContentFrosted) {
      bodyElement.classList.add("frosted-content-active");
    }
    updateFrostedGlassButtonState(); // Set initial state

    toggleFrostedGlassButton.addEventListener("click", () => {
      bodyElement.classList.toggle("frosted-content-active");
      updateFrostedGlassButtonState(); // Update on click

      // Save preference
      if (bodyElement.classList.contains("frosted-content-active")) {
        localStorage.setItem("contentStyleFrosted", "true");
      } else {
        localStorage.setItem("contentStyleFrosted", "false");
      }
    });
  }

  // Background Blur Toggle
  const toggleBlurButton = document.getElementById("toggleBlurButton");
  if (toggleBlurButton) {
    const updateBlurButtonState = () => {
      // The button is "selected" when blur is on (when the 'background-blur-disabled' class is not present).
      if (!bodyElement.classList.contains("background-blur-disabled")) {
        toggleBlurButton.classList.add("theme-selected");
      } else {
        toggleBlurButton.classList.remove("theme-selected");
      }
    };

    // Load saved preference for blur
    const isBlurDisabled =
      localStorage.getItem("backgroundBlurDisabled") === "true";
    if (isBlurDisabled) {
      bodyElement.classList.add("background-blur-disabled");
    }
    updateBlurButtonState(); // Set initial state on page load

    toggleBlurButton.addEventListener("click", () => {
      bodyElement.classList.toggle("background-blur-disabled");
      updateBlurButtonState(); // Update button state on click

      // Save preference
      if (bodyElement.classList.contains("background-blur-disabled")) {
        localStorage.setItem("backgroundBlurDisabled", "true");
      } else {
        localStorage.setItem("backgroundBlurDisabled", "false");
      }
    });
  }

  // --- Background Changer ---
  const changeBgButton = document.getElementById("changeBgButton");
  if (changeBgButton) {
    changeBgButton.addEventListener("click", cycleBackground);
  } else {
    console.warn(
      'Change background button with ID "changeBgButton" not found.'
    );
  }

  // Load initial background
  if (backgroundImages.length > 0) {
    let savedIndex = 0; // Default to the first image
    try {
      const storedIndex = localStorage.getItem("selectedBackgroundIndex");
      if (storedIndex !== null) {
        const parsedIndex = parseInt(storedIndex, 10);
        // Validate the parsed index
        if (
          !isNaN(parsedIndex) &&
          parsedIndex >= 0 &&
          parsedIndex < backgroundImages.length
        ) {
          savedIndex = parsedIndex;
        }
      }
    } catch (e) {
      console.error(
        "Failed to load or parse background index from localStorage:",
        e
      );
    }

    currentBackgroundIndex = savedIndex;
    const initialImageUrl = `url('${backgroundImages[currentBackgroundIndex]}')`;
    document.getElementById("background-container-1").style.backgroundImage =
      initialImageUrl;
  }
});