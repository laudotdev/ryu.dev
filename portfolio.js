(() => {
    const root = document.documentElement;
    root.classList.add("js");
    const siteHeader = document.querySelector(".site-header");
    const themeToggle = document.getElementById("theme-toggle");
    const themeLabel = themeToggle?.querySelector(".theme-label");
    const navToggle = document.getElementById("nav-toggle");
    const siteNav = document.getElementById("main-nav");
    const headerInner = navToggle?.closest(".site-header-inner");
    const musicToggle = document.getElementById("music-toggle");
    const musicStatus = document.getElementById("music-status");
    const music = document.getElementById("bg-music");
    const certificateDialog = document.getElementById("certificate-dialog");
    const certificateOpen = document.querySelector(".certificate-open");
    const certificateClose = certificateDialog?.querySelector(".certificate-close");
    const emailLink = document.querySelector(".contact-email");
    const emailDialog = document.getElementById("email-dialog");
    const emailDialogClose = emailDialog?.querySelector(".email-dialog-close");
    const emailCopy = emailDialog?.querySelector(".email-copy");
    const emailAddress = emailDialog?.querySelector(".email-address");
    const emailCopyStatus = emailDialog?.querySelector(".email-copy-status");
    const contributionChart = document.getElementById("contribution-chart");
    const contributionTotal = document.getElementById("contribution-total");

    function updateHeaderOffset() {
        if (siteHeader) {
            root.style.setProperty("--site-header-height", `${siteHeader.getBoundingClientRect().height}px`);
        }
    }

    updateHeaderOffset();
    window.addEventListener("resize", updateHeaderOffset, { passive: true });
    if ("ResizeObserver" in window && siteHeader) {
        new ResizeObserver(updateHeaderOffset).observe(siteHeader);
    }

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

    function closeNavigation() {
        navToggle?.setAttribute("aria-expanded", "false");
        navToggle?.setAttribute("aria-label", "Open navigation");
        headerInner?.classList.remove("nav-open");
        updateHeaderOffset();
    }

    navToggle?.addEventListener("click", () => {
        const isOpen = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", String(!isOpen));
        navToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
        headerInner?.classList.toggle("nav-open", !isOpen);
        updateHeaderOffset();
    });

    siteNav?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeNavigation);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") {
            closeNavigation();
            navToggle.focus();
        }
    });

    window.matchMedia("(min-width: 721px)").addEventListener("change", (event) => {
        if (event.matches) closeNavigation();
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

    certificateOpen?.addEventListener("click", () => certificateDialog?.showModal());
    certificateClose?.addEventListener("click", () => certificateDialog?.close());
    certificateDialog?.addEventListener("click", (event) => {
        if (event.target === certificateDialog) {
            certificateDialog.close();
        }
    });

    // emailLink?.addEventListener("click", (event) => {
    //     event.preventDefault();
    //     emailDialog?.showModal();
    // });
    // emailDialogClose?.addEventListener("click", () => emailDialog?.close());
    // emailDialog?.addEventListener("click", (event) => {
    //     if (event.target === emailDialog) {
    //         emailDialog.close();
    //     }
    // });
    // emailCopy?.addEventListener("click", async () => {
    //     const address = emailAddress?.textContent.trim();
    //     if (!address || !emailCopyStatus) return;

    //     try {
    //         await navigator.clipboard.writeText(address);
    //         emailCopyStatus.textContent = "Email address copied.";
    //     } catch {
    //         emailCopyStatus.textContent = "Copy is unavailable here. Select the address above to copy it.";
    //     }
    // });

    async function loadContributionCalendar() {
        if (!contributionChart) return;

        const year = 2026;
        const svgNamespace = "http://www.w3.org/2000/svg";
        const createSvgElement = (name, attributes = {}) => {
            const element = document.createElementNS(svgNamespace, name);
            for (const [attribute, value] of Object.entries(attributes)) {
                element.setAttribute(attribute, String(value));
            }
            return element;
        };

        try {
            const response = await fetch(`https://github-contributions-api.jogruber.de/v4/laudotdev?y=${year}`, {
                headers: { Accept: "application/json" },
                referrerPolicy: "no-referrer"
            });
            if (!response.ok) throw new Error("Contribution service returned an error.");

            const data = await response.json();
            const days = data.contributions.filter((day) => day.date.startsWith(`${year}-`));
            if (days.length !== 365) throw new Error("Contribution data for the full year was unavailable.");

            const firstWeekday = new Date(Date.UTC(year, 0, 1)).getUTCDay();
            const weekCount = Math.ceil((firstWeekday + days.length) / 7);
            const cellSize = 10;
            const cellStep = 13;
            const left = 30;
            const top = 23;
            const now = new Date();
            const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const width = left + weekCount * cellStep + 4;
            const height = top + 7 * cellStep + 2;
            const svg = createSvgElement("svg", {
                viewBox: `0 0 ${width} ${height}`,
                role: "img",
                "aria-labelledby": "contribution-svg-title",
                focusable: "false"
            });
            const title = createSvgElement("title", { id: "contribution-svg-title" });
            title.textContent = `GitHub contributions for ${year}`;
            svg.append(title);

            const monthFormatter = new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" });
            for (let month = 0; month < 12; month += 1) {
                const daysBeforeMonth = Math.floor((Date.UTC(year, month, 1) - Date.UTC(year, 0, 1)) / 86400000);
                const monthColumn = Math.floor((firstWeekday + daysBeforeMonth) / 7);
                const monthLabel = createSvgElement("text", {
                    x: left + monthColumn * cellStep,
                    y: 14
                });
                monthLabel.textContent = monthFormatter.format(new Date(Date.UTC(year, month, 1)));
                svg.append(monthLabel);
            }

            days.forEach((day, index) => {
                const calendarOffset = firstWeekday + index;
                const level = Math.max(0, Math.min(4, Number(day.level) || 0));
                const isFuture = day.date > localToday;
                const cell = createSvgElement("rect", {
                    x: left + Math.floor(calendarOffset / 7) * cellStep,
                    y: top + (calendarOffset % 7) * cellStep,
                    width: cellSize,
                    height: cellSize,
                    rx: 2,
                    class: `contribution-cell ${isFuture ? "future" : `level-${level}`}`
                });
                const cellTitle = createSvgElement("title");
                const count = Number(day.count) || 0;
                cellTitle.textContent = isFuture
                    ? `${day.date}: this date has not happened yet`
                    : `${day.date}: ${count} ${count === 1 ? "contribution" : "contributions"}`;
                cell.append(cellTitle);
                svg.append(cell);
            });

            contributionChart.replaceChildren(svg);
            contributionChart.setAttribute("aria-busy", "false");

            const total = Number(data.total?.[String(year)]);
            const contributionCount = Number.isFinite(total)
                ? total
                : days.reduce((sum, day) => sum + (Number(day.count) || 0), 0);
            if (contributionTotal) {
                contributionTotal.textContent = `${new Intl.NumberFormat("en").format(contributionCount)} contributions in ${year} so far`;
            }
        } catch {
            const message = document.createElement("p");
            message.className = "contribution-status";
            message.textContent = "Contribution data is temporarily unavailable.";
            contributionChart.replaceChildren(message);
            contributionChart.setAttribute("aria-busy", "false");
            if (contributionTotal) contributionTotal.textContent = `See the ${year} contribution calendar on GitHub.`;
        }
    }

    loadContributionCalendar();
})();
