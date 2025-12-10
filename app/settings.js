/**
 * @fileoverview Settings module for Makemon Character Maker+
 * Handles theme switching, background management, and settings panel UI.
 */

// --- CONSTANTS ---
const VALID_THEMES = ["light", "dark", "amoled"];
const DEFAULT_THEME = "light";
const BODY_CLASS_PREFIX = "theme-";
const SETTINGS_MOBILE_BREAKPOINT = 900;

const backgroundImages = [
    "Makemon/bg.png",
    "Makemon/bg2.png",
    "Makemon/bg3.webp",
];
let currentBackgroundIndex = 0;

// --- SAFE STORAGE UTILITY ---
const safeStorage = {
    get: (key, fallback = null) => {
        try {
            return localStorage.getItem(key) ?? fallback;
        } catch {
            return fallback;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.error(`Failed to save ${key} to localStorage:`, e);
        }
    }
};

/**
 * Cycles to the next background image with crossfade animation.
 */
function cycleBackground() {
    const changeBgButton = document.getElementById("changeBgButton");
    if (changeBgButton?.disabled) return;

    changeBgButton.disabled = true;

    const body = document.body;
    const bgContainer1 = document.getElementById("background-container-1");
    const bgContainer2 = document.getElementById("background-container-2");

    currentBackgroundIndex = (currentBackgroundIndex + 1) % backgroundImages.length;
    safeStorage.set("selectedBackgroundIndex", currentBackgroundIndex.toString());

    const newImageUrl = `url('${backgroundImages[currentBackgroundIndex]}')`;
    bgContainer2.style.backgroundImage = newImageUrl;

    const handleFadeOutEnd = () => {
        changeBgButton.disabled = false;
    };

    const handleFadeInEnd = (event) => {
        if (event.propertyName !== "opacity") return;
        bgContainer1.style.backgroundImage = newImageUrl;
        body.classList.remove("is-crossfading");
        bgContainer2.addEventListener("transitionend", handleFadeOutEnd, { once: true });
    };

    body.classList.add("is-crossfading");
    bgContainer2.addEventListener("transitionend", handleFadeInEnd, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
    // --- THEME MANAGEMENT ---
    const themeButtons = {
        light: document.getElementById("theme-light"),
        dark: document.getElementById("theme-dark"),
        amoled: document.getElementById("theme-amoled"),
    };

    function setTheme(themeName) {
        if (!VALID_THEMES.includes(themeName)) {
            console.error(`Invalid theme: ${themeName}. Defaulting to ${DEFAULT_THEME}.`);
            themeName = DEFAULT_THEME;
        }

        VALID_THEMES.forEach((theme) => {
            document.body.classList.remove(BODY_CLASS_PREFIX + theme);
            themeButtons[theme]?.classList.remove("theme-selected");
        });

        document.body.classList.add(BODY_CLASS_PREFIX + themeName);
        themeButtons[themeName]?.classList.add("theme-selected");
        safeStorage.set("selectedTheme", themeName);
    }

    Object.entries(themeButtons).forEach(([themeKey, button]) => {
        button?.addEventListener("click", () => setTheme(themeKey));
    });

    const savedTheme = safeStorage.get("selectedTheme", DEFAULT_THEME);
    setTheme(VALID_THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME);

    // --- VISUAL EFFECTS TOGGLES ---
    const bodyElement = document.body;

    // Frosted Glass Toggle
    const toggleFrostedGlassButton = document.getElementById("toggleFrostedGlassButton");
    if (toggleFrostedGlassButton) {
        const updateFrostedGlassButtonState = () => {
            toggleFrostedGlassButton.classList.toggle(
                "theme-selected",
                bodyElement.classList.contains("frosted-content-active")
            );
        };

        if (safeStorage.get("contentStyleFrosted") === "true") {
            bodyElement.classList.add("frosted-content-active");
        }
        updateFrostedGlassButtonState();

        toggleFrostedGlassButton.addEventListener("click", () => {
            bodyElement.classList.toggle("frosted-content-active");
            updateFrostedGlassButtonState();
            safeStorage.set(
                "contentStyleFrosted",
                bodyElement.classList.contains("frosted-content-active") ? "true" : "false"
            );
        });
    }

    // Background Blur Toggle
    const toggleBlurButton = document.getElementById("toggleBlurButton");
    if (toggleBlurButton) {
        const updateBlurButtonState = () => {
            toggleBlurButton.classList.toggle(
                "theme-selected",
                !bodyElement.classList.contains("background-blur-disabled")
            );
        };

        if (safeStorage.get("backgroundBlurDisabled") === "true") {
            bodyElement.classList.add("background-blur-disabled");
        }
        updateBlurButtonState();

        toggleBlurButton.addEventListener("click", () => {
            bodyElement.classList.toggle("background-blur-disabled");
            updateBlurButtonState();
            safeStorage.set(
                "backgroundBlurDisabled",
                bodyElement.classList.contains("background-blur-disabled") ? "true" : "false"
            );
        });
    }

    // --- BACKGROUND CHANGER ---
    const changeBgButton = document.getElementById("changeBgButton");
    changeBgButton?.addEventListener("click", cycleBackground);

    if (backgroundImages.length > 0) {
        const storedIndex = parseInt(safeStorage.get("selectedBackgroundIndex", "0"), 10);
        currentBackgroundIndex = (storedIndex >= 0 && storedIndex < backgroundImages.length)
            ? storedIndex
            : 0;

        const initialImageUrl = `url('${backgroundImages[currentBackgroundIndex]}')`;
        document.getElementById("background-container-1").style.backgroundImage = initialImageUrl;
    }

    // --- SETTINGS PANEL UI ---
    const settingsPanel = document.getElementById("settings-panel");
    const toggleButtons = document.querySelectorAll('[data-settings-toggle="true"]');
    const desktopContainer = document.querySelector(".settings-floating-container");
    const mobilePlaceholder = document.getElementById("settings-panel-placeholder");

    if (!settingsPanel || !toggleButtons.length || !desktopContainer) {
        return;
    }

    let isPanelOpen = false;
    let lastToggleButton = null;
    let currentParent = settingsPanel.parentElement;

    const setToggleState = (expanded) => {
        toggleButtons.forEach((button) => {
            button.setAttribute("aria-expanded", expanded ? "true" : "false");
            button.setAttribute("data-expanded", expanded ? "true" : "false");
        });
    };

    const placePanel = () => {
        const isMobile = window.innerWidth <= SETTINGS_MOBILE_BREAKPOINT;
        if (isMobile && mobilePlaceholder && currentParent !== mobilePlaceholder) {
            mobilePlaceholder.appendChild(settingsPanel);
            currentParent = mobilePlaceholder;
        } else if (!isMobile && currentParent !== desktopContainer) {
            desktopContainer.appendChild(settingsPanel);
            currentParent = desktopContainer;
        }
    };

    const openPanel = () => {
        if (isPanelOpen) return;
        isPanelOpen = true;
        settingsPanel.classList.add("is-open");
        settingsPanel.setAttribute("aria-hidden", "false");
        setToggleState(true);
        bodyElement.classList.add("settings-panel-open");
        setTimeout(() => settingsPanel.focus(), 0);
        bodyElement.addEventListener("click", handleDocumentClick, true);
        document.addEventListener("keydown", handleEscape, true);
    };

    const closePanel = () => {
        if (!isPanelOpen) return;
        isPanelOpen = false;
        settingsPanel.classList.remove("is-open");
        settingsPanel.setAttribute("aria-hidden", "true");
        setToggleState(false);
        bodyElement.classList.remove("settings-panel-open");
        lastToggleButton?.focus();
        bodyElement.removeEventListener("click", handleDocumentClick, true);
        document.removeEventListener("keydown", handleEscape, true);
    };

    const togglePanel = () => isPanelOpen ? closePanel() : openPanel();

    const handleDocumentClick = (event) => {
        if (
            !settingsPanel.contains(event.target) &&
            !event.target.closest('[data-settings-toggle="true"]')
        ) {
            closePanel();
        }
    };

    const handleEscape = (event) => {
        if (event.key === "Escape") closePanel();
    };

    toggleButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            lastToggleButton = button;
            placePanel();
            togglePanel();
        });

        button.addEventListener("keydown", (event) => {
            if (event.key === "ArrowDown" && !isPanelOpen) {
                lastToggleButton = button;
                placePanel();
                openPanel();
            }
        });
    });

    placePanel();
    window.addEventListener("resize", placePanel);
});
