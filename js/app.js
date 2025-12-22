if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  return res.json();
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function renderServices() {
  const services = await loadJSON("data/services.json");
  const servicesList = document.getElementById("services-list");
  if (!servicesList) return;

  servicesList.innerHTML = "";

  services.forEach((s) => {
    const name = escapeHTML(s.name);
    const desc = escapeHTML(s.description);
    const duration = escapeHTML(s.durationLabel);
    const price = escapeHTML(s.price);

    servicesList.insertAdjacentHTML(
      "beforeend",
      `
      <article class="card">
        <h3>${name}</h3>
        <p>${desc}</p>

        <div class="card-meta">
          <span class="badge">${duration}</span>
          <span class="price">${price}</span>
        </div>
      </article>
    `
    );
  });
}

async function renderReviews() {
  const reviews = await loadJSON("data/reviews.json");
  const reviewsList = document.getElementById("reviews-list");

  reviewsList.innerHTML = "";

  reviews.forEach((r) => {
    const text = escapeHTML(r.text);
    const author = escapeHTML(r.author);

    reviewsList.insertAdjacentHTML(
      "beforeend",
      `
      <blockquote>
        <p>${text}</p>
        <footer>— ${author}</footer>
      </blockquote>
    `
    );
  });
}

function setupMobileNav() {
  const btn = document.querySelector(".nav-toggle");
  const links = document.getElementById("nav-links");

  if (!btn || !links) return;

  function openMenu() {
    links.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    document.body.classList.add("no-scroll");
  }

  function closeMenu() {
    links.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("no-scroll");
  }

  function isMobile() {
    return window.matchMedia("(max-width: 720px)").matches;
  }

  btn.addEventListener("click", () => {
    const open = links.classList.contains("is-open");
    if (open) closeMenu();
    else openMenu();
  });

  // Закрывать меню при клике на пункт
  links.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (isMobile()) closeMenu();
  });

  // Закрывать при клике вне меню
  document.addEventListener("click", (e) => {
    if (!isMobile()) return;
    if (!links.classList.contains("is-open")) return;

    const clickedInsideNav = e.target.closest(".nav");
    if (!clickedInsideNav) closeMenu();
  });

  // Закрывать по Esc
  document.addEventListener("keydown", (e) => {
    if (!isMobile()) return;
    if (!links.classList.contains("is-open")) return;
    if (e.key === "Escape") closeMenu();
  });

  // Если развернули экран — убрать мобильное состояние
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeMenu();
    }
  });
}

async function renderGallery() {
  const items = await loadJSON("data/gallery.json");

  const filtersEl = document.getElementById("gallery-filters");
  const gridEl = document.getElementById("gallery-grid");

  if (!filtersEl || !gridEl) return;

  const tags = Array.from(new Set(items.map((i) => i.tag)));
  const allTags = ["todo", ...tags];

  let activeTag = "todo";
  let visible = items.slice();
  let currentIndex = 0;

  function label(tag) {
    if (tag === "todo") return "Todo";
    // Можно позже сделать красивее
    return tag.charAt(0).toUpperCase() + tag.slice(1);
  }

  function renderFilters() {
    filtersEl.innerHTML = allTags
      .map(
        (tag) => `
      <button class="filter-btn ${
        tag === activeTag ? "is-active" : ""
      }" data-tag="${tag}" type="button">
        ${label(tag)}
      </button>
    `
      )
      .join("");
  }

  function renderGrid() {
    gridEl.innerHTML = visible
      .map(
        (it, idx) => `
      <div class="gallery-item" data-idx="${idx}" role="button" tabindex="0" aria-label="Abrir imagen">
        <img src="${it.src}" alt="${escapeHTML(it.alt)}" loading="lazy" />
        <div class="gallery-tag">${escapeHTML(label(it.tag))}</div>
      </div>
    `
      )
      .join("");
  }

  function applyFilter(tag) {
    activeTag = tag;
    visible =
      tag === "todo" ? items.slice() : items.filter((i) => i.tag === tag);
    currentIndex = 0;
    renderFilters();
    renderGrid();
  }

  // Lightbox logic
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lightbox-img");
  const lbClose = document.getElementById("lightbox-close");
  const lbPrev = document.getElementById("lightbox-prev");
  const lbNext = document.getElementById("lightbox-next");

  function openLightbox(idx) {
    currentIndex = idx;
    const it = visible[currentIndex];
    if (!it) return;

    lbImg.src = it.src;
    lbImg.alt = it.alt || "";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lbImg.src = "";
  }

  function prev() {
    if (!visible.length) return;
    currentIndex = (currentIndex - 1 + visible.length) % visible.length;
    openLightbox(currentIndex);
  }

  function next() {
    if (!visible.length) return;
    currentIndex = (currentIndex + 1) % visible.length;
    openLightbox(currentIndex);
  }

  // events
  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    applyFilter(btn.dataset.tag);
  });

  gridEl.addEventListener("click", (e) => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    openLightbox(Number(item.dataset.idx));
  });

  gridEl.addEventListener("keydown", (e) => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(Number(item.dataset.idx));
    }
  });

  lbClose.addEventListener("click", closeLightbox);
  lbPrev.addEventListener("click", prev);
  lbNext.addEventListener("click", next);

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  // init
  renderFilters();
  renderGrid();
}

function setupScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  if (!navLinks.length) return;

  const pairs = navLinks
    .map((a) => {
      const hash = a.getAttribute("href");
      if (!hash || !hash.startsWith("#")) return null;
      const el = document.querySelector(hash);
      return el ? { a, el, id: el.id } : null;
    })
    .filter(Boolean);

  if (!pairs.length) return;

  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.remove("is-active"));
    const active = navLinks.find((a) => a.getAttribute("href") === `#${id}`);
    if (active) active.classList.add("is-active");
  };

  // Подсветка сразу при клике (устраняет неверный пункт после бургер-меню)
  navLinks.forEach((a) => {
    a.addEventListener("click", () => {
      const hash = a.getAttribute("href");
      if (hash && hash.startsWith("#")) setActive(hash.slice(1));
    });
  });

  // “Линия активации” чуть ниже sticky header
  // Верхняя граница: ниже хедера, нижняя: почти весь экран “вырезаем”
  const observer = new IntersectionObserver(
    (entries) => {
      const hit = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

      if (hit?.target?.id) setActive(hit.target.id);
    },
    {
      root: null,
      rootMargin: "-110px 0px -75% 0px",
      threshold: 0,
    }
  );

  pairs.forEach(({ el }) => observer.observe(el));

  // Инициализация
  const current = window.location.hash?.slice(1);
  if (current) setActive(current);
  else setActive(pairs[0].id);
}

(async function init() {
  try {
    const hash = window.location.hash;

    if (hash)
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );

    await renderServices();
    await renderReviews();
    await renderGallery();

    setupMobileNav();
    setupScrollSpy();

    if (hash) {
      // Вернем hash в URL (чтобы было красиво и работал “back”)
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search + hash
      );

      const target = document.querySelector(hash);
      if (target) {
        // Скроллим к элементу
        target.scrollIntoView({ behavior: "auto", block: "start" });

        // Компенсация sticky header (если нужно)
        const header = document.querySelector(".header");
        const headerH = header ? header.offsetHeight : 0;
        window.scrollBy(0, -(headerH + 12));
      }
    }
  } catch (err) {
    console.error(err);
  }
})();
