function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function startBackground() {
    if (prefersReducedMotion()) return;

    const canvas = document.getElementById("bg");
    if (!canvas) return;

    if (canvas.dataset.started === "1") return;
    canvas.dataset.started = "1";

    canvas.classList.add("is-visible");

    const ctx = canvas.getContext("2d");
    const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resize() {
        canvas.width = Math.floor(window.innerWidth * DPR);
        canvas.height = Math.floor(window.innerHeight * DPR);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    const streaks = [];

    function spawn() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const x = Math.random() * w + w * 0.2;
        const y = Math.random() * h * 0.7;

        const len = 60 + Math.random() * 140;
        const speed = 8 + Math.random() * 10;

        const angle = (Math.PI * 3) / 4 + (Math.random() - 0.5) * 0.25;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        const alpha = 0.07 + Math.random() * 0.13;
        const width = 1 + Math.random() * 2;

        streaks.push({ x, y, vx, vy, len, alpha, width });
        if (streaks.length > 90) streaks.shift();
    }

    setInterval(() => {
        if (Math.random() < 0.85) spawn();
    }, 120);

    function draw() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        ctx.fillStyle = "rgba(245, 247, 255, 0.55)";
        ctx.fillRect(0, 0, w, h);

        for (const s of streaks) {
            const x2 = s.x - (s.vx * s.len) / 10;
            const y2 = s.y - (s.vy * s.len) / 10;

            ctx.lineWidth = s.width;
            ctx.strokeStyle = `rgba(40, 40, 60, ${s.alpha})`;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            s.x += s.vx;
            s.y += s.vy;
            s.alpha *= 0.992;
        }

        for (let i = streaks.length - 1; i >= 0; i--) {
            const s = streaks[i];
            if (s.x < -300 || s.y > h + 300 || s.alpha < 0.01) {
                streaks.splice(i, 1);
            }
        }

        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
}

function setupOrbit() {
    const orbit = document.getElementById("orbit");
    const scene = document.getElementById("orbitScene");
    if (!orbit || !scene) return;

    const orbitEpochKey = "orbitEpoch";
    let orbitEpoch = Number(sessionStorage.getItem(orbitEpochKey));
    if (!orbitEpoch) {
        orbitEpoch = Date.now();
        sessionStorage.setItem(orbitEpochKey, String(orbitEpoch));
    }

    const videoIds = [
        "JT7jlgqqSuU",
        "zJFXuLmmEvY",
        "TZJUg9_QVy8",
    ];

    function thumbUrl(id) {
        return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }

    // 球面っぽく散らす（ゴールデンスパイラル）
    function spherePoint(i, n) {
        const offset = 2 / n;
        const inc = Math.PI * (3 - Math.sqrt(5));
        const y = i * offset - 1 + offset / 2; // -1..1
        const r = Math.sqrt(1 - y * y);
        const phi = i * inc;
        return { x: Math.cos(phi) * r, y, z: Math.sin(phi) * r };
    }

    // 画面に合わせて半径/速度を調整（レスポンシブ）
    function calcParams() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const R = Math.max(160, Math.min(340, Math.floor(w * 0.22)));
        const yScale = Math.max(0.52, Math.min(0.70, h / 1000));
        const speed = w < 768 ? 0.00018 : 0.00022;
        const tiltX = w < 768 ? -8 : -10;
        const tiltY = w < 768 ? 14 : 18;
        const baseZ = w < 768 ? 24 : 40;

        return { R, yScale, speed, tiltX, tiltY, baseZ };
    }

    orbit.innerHTML = "";

    const items = videoIds.map((id) => {
        const a = document.createElement("a");
        a.className = "orbit-item";
        a.href = `https://www.youtube.com/watch?v=${id}`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.setAttribute("aria-label", "Open YouTube in new tab");

        const img = document.createElement("img");
        img.src = thumbUrl(id);
        img.alt = "YouTube thumbnail";

        a.appendChild(img);
        orbit.appendChild(a);
        return a;
    });

    const reduced = prefersReducedMotion();

    function render(now) {
        const { R, yScale, speed, tiltX, tiltY, baseZ } = calcParams();
        const t = reduced ? 0 : (Date.now() - orbitEpoch) * speed;

        orbit.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${baseZ}px)`;

        const n = items.length;

        for (let i = 0; i < n; i++) {
            const p = spherePoint(i, n);

            const a = t;
            const x = p.x * Math.cos(a) - p.z * Math.sin(a);
            const z = p.x * Math.sin(a) + p.z * Math.cos(a);
            const y = p.y;

            const px = x * R;
            const py = y * (R * yScale);
            const pz = z * R;

            const depth01 = (pz + R) / (2 * R); // 0..1
            const scale = 0.76 + depth01 * 0.36;
            const alpha = 0.40 + depth01 * 0.60;

            const el = items[i];
            el.style.transform =
                `translate3d(${px}px, ${py}px, ${pz}px) translate(-50%, -50%) scale(${scale})`;
            el.style.opacity = `${alpha}`;
            el.style.zIndex = `${Math.floor(depth01 * 1000)}`;
            el.style.filter = `blur(${(1 - depth01) * 0.9}px)`;
        }

        if (!reduced) requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    window.addEventListener("resize", () => {
        if (reduced) requestAnimationFrame(render);
    });
}

window.addEventListener("load", () => {
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }

    window.scrollTo(0, 0);

    const hero = document.querySelector(".hero");
    const home = document.querySelector(".home");
    if (!home) {
        startBackground();
        return;
    }

    if (!hero) {
        setTimeout(() => {
            home.classList.add("is-visible");
        }, 120);
        startBackground();
        return;
    }

    const hasSeenWelcome = sessionStorage.getItem("seenWelcome") === "1";
    const hasSeenHomeReveal = sessionStorage.getItem("seenHomeReveal") === "1";

    if (hasSeenWelcome) {
        if (hasSeenHomeReveal) {
            document.documentElement.classList.add("home-no-anim");
        }
        sessionStorage.setItem("seenHomeReveal", "1");
        document.documentElement.classList.remove("welcome-active");
        hero.style.display = "none";
        home.classList.add("is-visible");
        startBackground();
        setupOrbit();
        return;
    }

    sessionStorage.setItem("seenWelcome", "1");
    document.body.classList.add("is-locked");
    document.documentElement.classList.add("welcome-active");

    hero.classList.add("is-visible");

    setTimeout(() => {
        hero.classList.add("is-hidden");
    }, 2500);

    setTimeout(() => {
        hero.style.display = "none";
        home.classList.add("is-visible");
        document.body.classList.remove("is-locked");
        document.documentElement.classList.remove("welcome-active");
        window.scrollTo(0, 0);

        startBackground();
        setupOrbit();
        sessionStorage.setItem("seenHomeReveal", "1");
    }, 3700);
});

/* =======================
   Mobile hamburger menu
   ======================= */
(() => {
    const btn = document.getElementById("hamburger");
    const nav = document.getElementById("globalNav");
    const backdrop = document.getElementById("navBackdrop");
    if (!btn || !nav || !backdrop) return;

    const mq = window.matchMedia("(max-width: 820px)");

    const setBackdropHidden = (hidden) => {
        if (hidden) backdrop.setAttribute("hidden", "");
        else backdrop.removeAttribute("hidden");
    };

    const syncA11y = () => {
        const isOpen = document.body.classList.contains("menu-open");
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        btn.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    };

    const closeMenu = () => {
        document.body.classList.remove("menu-open");
        setBackdropHidden(true);
        syncA11y();
    };

    const openMenu = () => {
        document.body.classList.add("menu-open");
        setBackdropHidden(false);
        syncA11y();
    };

    const toggleMenu = () => {
        const isOpen = document.body.classList.contains("menu-open");
        isOpen ? closeMenu() : openMenu();
    };

    btn.addEventListener("click", toggleMenu);
    backdrop.addEventListener("click", closeMenu);

    nav.addEventListener("click", (e) => {
        const a = e.target.closest("a");
        if (!a) return;
        closeMenu();
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeMenu();
    });

    mq.addEventListener("change", (e) => {
        if (!e.matches) closeMenu();
    });

    closeMenu();
})();

/* =======================
  Info pagination
   ======================= */
(() => {
    const list = document.querySelector(".info-list");
    if (!list) return;

    const items = Array.from(list.querySelectorAll(".info-item"));
    const pagination = document.querySelector(".info-pagination");
    if (!pagination || items.length === 0) return;

    const perPage = 5;
    const totalPages = Math.ceil(items.length / perPage);

    const createButton = (label, page, isCurrent = false) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = label;
        btn.dataset.page = String(page);
        if (isCurrent) btn.setAttribute("aria-current", "page");
        return btn;
    };

    const renderButtons = (current) => {
        pagination.innerHTML = "";
        pagination.appendChild(createButton("PREV", Math.max(1, current - 1)));

        for (let i = 1; i <= totalPages; i += 1) {
            pagination.appendChild(createButton(String(i), i, i === current));
        }

        pagination.appendChild(createButton("NEXT", Math.min(totalPages, current + 1)));
    };

    const updateItems = (current) => {
        items.forEach((item, index) => {
            const visible = index >= (current - 1) * perPage && index < current * perPage;
            item.style.display = visible ? "" : "none";
            item.classList.remove("is-first-visible");
        });

        const firstVisible = items.find((item) => item.style.display !== "none");
        if (firstVisible) firstVisible.classList.add("is-first-visible");
    };

    const goTo = (page) => {
        const current = Math.max(1, Math.min(totalPages, page));
        renderButtons(current);
        updateItems(current);
    };

    pagination.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const page = Number(btn.dataset.page);
        if (!page) return;
        goTo(page);
    });

    goTo(1);
})();

/* =======================
   Sync info list on index
   ======================= */
(() => {
    const list = document.querySelector(".info-list[data-info-source]");
    if (!list) return;

    const source = list.dataset.infoSource;
    if (!source) return;

    fetch(source)
        .then((res) => {
            if (!res.ok) throw new Error("Failed to load info source");
            return res.text();
        })
        .then((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            const items = Array.from(doc.querySelectorAll(".info-list .info-item")).slice(0, 3);
            if (items.length === 0) return;

            list.innerHTML = "";
            items.forEach((item) => {
                list.appendChild(item.cloneNode(true));
            });
        })
        .catch(() => {
            // Keep existing markup as a fallback when fetch is blocked (e.g., file://).
        });
})();
