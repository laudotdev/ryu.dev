(() => {
    const root = document.documentElement;
    const themeToggle = document.getElementById("theme-toggle");
    const themeLabel = themeToggle?.querySelector(".theme-label");
    const musicToggle = document.getElementById("music-toggle");
    const musicStatus = document.getElementById("music-status");
    const music = document.getElementById("bg-music");

    function applyTheme(theme, persist = false) {
        const isDark = theme === "dark";
        root.dataset.theme = isDark ? "dark" : "light";

        if (themeToggle) {
            themeToggle.setAttribute("aria-pressed", String(isDark));
            themeToggle.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
        }

        if (themeLabel) {
            themeLabel.textContent = isDark ? "Light" : "Dark";
        }

        if (persist) {
            try {
                localStorage.setItem("ryu-theme", isDark ? "dark" : "light");
            } catch {
                // The theme remains usable when browser storage is unavailable.
            }
        }
    }

    let savedTheme = "light";
    try {
        const storedTheme = localStorage.getItem("ryu-theme");
        if (storedTheme === "dark" || storedTheme === "light") {
            savedTheme = storedTheme;
        }
    } catch {
        // Use the light default when browser storage is unavailable.
    }
    applyTheme(savedTheme);

    themeToggle?.addEventListener("click", () => {
        const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme, true);
    });

    function setMusicState(isPlaying) {
        musicToggle?.setAttribute("aria-pressed", String(isPlaying));
        musicToggle?.setAttribute("aria-label", isPlaying ? "Pause background music" : "Play background music");
    }

    musicToggle?.addEventListener("click", async () => {
        if (!music) {
            return;
        }

        if (music.paused) {
            try {
                await music.play();
                setMusicState(true);
                if (musicStatus) musicStatus.textContent = "Background music is playing.";
            } catch {
                setMusicState(false);
                if (musicStatus) musicStatus.textContent = "Background music could not be played.";
            }
            return;
        }

        music.pause();
        setMusicState(false);
        if (musicStatus) musicStatus.textContent = "Background music is paused.";
    });
})();
