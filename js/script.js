/* Shared interactions for Putri Nusantara */
(() => {
  const body = document.body;
  const loader = document.getElementById("site-loader");
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.querySelector(".primary-nav");
  const scrollTopButton = document.querySelector(".scroll-top");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const closeMenu = () => {
    if (!menuToggle || !primaryNav) return;
    menuToggle.classList.remove("is-open");
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka navigasi");
    body.classList.remove("menu-open");
  };

  const openMenu = () => {
    if (!menuToggle || !primaryNav) return;
    menuToggle.classList.add("is-open");
    primaryNav.classList.add("is-open");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Tutup navigasi");
    body.classList.add("menu-open");
  };

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      primaryNav.classList.contains("is-open") ? closeMenu() : openMenu();
    });

    // Tombol "Ajukan Permintaan" dikecualikan supaya tidak menutup menu sebelum modal sempat kebuka.
    primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  // Smooth-scroll local links without hijacking normal page navigation.
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      closeMenu();
    });
  });

  if (scrollTopButton) {
    const toggleScrollTop = () => {
      scrollTopButton.classList.toggle("is-visible", window.scrollY > 500);
    };

    window.addEventListener("scroll", toggleScrollTop, { passive: true });
    toggleScrollTop();
    scrollTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    });
  }

  // The reveal observer only alters elements after JavaScript is known to be running.
  const revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
    document.documentElement.classList.add("reveal-ready");
    if ("IntersectionObserver" in window && !reducedMotion) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -28px" }
      );
      revealItems.forEach((item) => revealObserver.observe(item));
    } else {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }
  }

  // Compact ripple that respects pointer position and keeps links usable.
  if (!reducedMotion) {
    document.querySelectorAll(".button").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        ripple.className = "ripple";
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        button.querySelector(".ripple")?.remove();
        button.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
      });
    });
  }

  // A minimal parallax treatment on the home hero image.
  const heroImage = document.querySelector("[data-parallax]");
  if (heroImage && !reducedMotion) {
    let frameRequested = false;
    const updateParallax = () => {
      const hero = heroImage.closest(".hero");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const offset = Math.max(-22, Math.min(22, -rect.top * 0.055));
      heroImage.style.transform = `translate3d(0, ${offset}px, 0) scale(1.04)`;
      frameRequested = false;
    };
    window.addEventListener("scroll", () => {
      if (!frameRequested) {
        window.requestAnimationFrame(updateParallax);
        frameRequested = true;
      }
    }, { passive: true });
    updateParallax();
  }

  // ---------------------------------------------------------------------
  // Slider "perjalanan kopi" di beranda: bibit -> kebun -> proses perawatan.
  // Crossfade otomatis, bisa dinavigasi lewat panah, dot, atau swipe.
  // ---------------------------------------------------------------------
  const originSlider = document.getElementById("originSlider");
  if (originSlider) {
    const slides = [...originSlider.querySelectorAll(".slide")];
    const dots = [...originSlider.querySelectorAll(".dot")];
    const captionText = originSlider.querySelector(".slide-caption-text");
    const prevButton = originSlider.querySelector("[data-slider-prev]");
    const nextButton = originSlider.querySelector("[data-slider-next]");
    const autoplayDelay = Number(originSlider.dataset.autoplay) || 5000;
    let activeIndex = 0;
    let autoplayTimer = null;

    const goToSlide = (index) => {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === activeIndex));
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === activeIndex);
        dot.setAttribute("aria-selected", String(i === activeIndex));
      });
      if (captionText) captionText.textContent = slides[activeIndex].dataset.caption || "";
    };

    const nextSlide = () => goToSlide(activeIndex + 1);
    const prevSlide = () => goToSlide(activeIndex - 1);

    const stopAutoplay = () => { if (autoplayTimer) window.clearInterval(autoplayTimer); };
    const startAutoplay = () => {
      if (reducedMotion || slides.length < 2) return;
      stopAutoplay();
      autoplayTimer = window.setInterval(nextSlide, autoplayDelay);
    };

    nextButton?.addEventListener("click", () => { nextSlide(); startAutoplay(); });
    prevButton?.addEventListener("click", () => { prevSlide(); startAutoplay(); });
    dots.forEach((dot, i) => dot.addEventListener("click", () => { goToSlide(i); startAutoplay(); }));

    // Pause saat kursor/keyboard fokus di area slider, lanjut lagi setelah ditinggal.
    originSlider.addEventListener("mouseenter", stopAutoplay);
    originSlider.addEventListener("mouseleave", startAutoplay);
    originSlider.addEventListener("focusin", stopAutoplay);
    originSlider.addEventListener("focusout", startAutoplay);

    // Swipe ringan untuk layar sentuh.
    let touchStartX = 0;
    originSlider.addEventListener("pointerdown", (event) => { touchStartX = event.clientX; });
    originSlider.addEventListener("pointerup", (event) => {
      const delta = event.clientX - touchStartX;
      if (Math.abs(delta) < 40) return;
      delta > 0 ? prevSlide() : nextSlide();
      startAutoplay();
    });

    goToSlide(0);
    startAutoplay();
  }

  // ---------------------------------------------------------------------
  // Modal form permintaan (dipicu dari tombol navbar). Tidak ada backend,
  // jadi submit akan membuka aplikasi email pengunjung dengan isi form
  // yang sudah terisi otomatis, ditujukan ke email Putri Nusantara.
  // ---------------------------------------------------------------------
  const requestModal = document.getElementById("requestModal");
  const requestForm = document.getElementById("requestForm");
  const requestNote = document.getElementById("requestModalNote");
  const openRequestTriggers = document.querySelectorAll("[data-open-request]");
  const closeRequestTriggers = document.querySelectorAll("[data-close-request]");
  let lastFocusedBeforeModal = null;

  const openRequestModal = () => {
    if (!requestModal) return;
    closeMenu();
    lastFocusedBeforeModal = document.activeElement;
    requestModal.classList.add("is-open");
    requestModal.setAttribute("aria-hidden", "false");
    body.classList.add("menu-open");
    window.setTimeout(() => document.getElementById("reqName")?.focus(), 200);
  };

  const closeRequestModal = () => {
    if (!requestModal) return;
    requestModal.classList.remove("is-open");
    requestModal.setAttribute("aria-hidden", "true");
    body.classList.remove("menu-open");
    lastFocusedBeforeModal?.focus();
  };

  openRequestTriggers.forEach((trigger) => trigger.addEventListener("click", openRequestModal));
  closeRequestTriggers.forEach((trigger) => trigger.addEventListener("click", closeRequestModal));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && requestModal?.classList.contains("is-open")) closeRequestModal();
  });

  if (requestForm) {
    requestForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = requestForm.name.value.trim();
      const email = requestForm.email.value.trim();
      const message = requestForm.message.value.trim();

      if (!name || !email || !message) {
        if (requestNote) requestNote.textContent = "Mohon lengkapi semua kolom terlebih dahulu.";
        return;
      }

      const subject = encodeURIComponent(`Permintaan dari ${name}`);
      const emailBody = encodeURIComponent(`${message}\n\nBalas ke: ${email}`);
      window.location.href = `mailto:mirzatiji87@gmail.com?subject=${subject}&body=${emailBody}`;

      if (requestNote) requestNote.textContent = "Membuka aplikasi email kamu…";
      window.setTimeout(() => {
        requestForm.reset();
        closeRequestModal();
        if (requestNote) requestNote.textContent = "";
      }, 1200);
    });
  }

  // Let the first paint settle before the loader fades away.
  window.addEventListener("load", () => {
    window.setTimeout(() => loader?.classList.add("is-hidden"), reducedMotion ? 0 : 320);
  });

  // Prevent a stuck loader if an external font or map never completes.
  window.setTimeout(() => loader?.classList.add("is-hidden"), 2400);
})();
/* Putri Nusantara — Multi-language switcher (ID default, EN toggle) */
(() => {
  const STORAGE_KEY = "putri-nusantara-lang";

  const en = {
    "nav.beranda": "Home",
    "nav.about": "About Us",
    "nav.product": "Products",
    "nav.contact": "Contact",
    "nav.request": "Make a Request",

    "index.hero.eyebrow": "From Nusantara to the world",
    "index.hero.title": "Welcome to <em>Putri Nusantara</em>",
    "index.hero.kicker": "Premium Indonesian Coffee Export Company",
    "index.hero.copy": "Bringing the finest character of Indonesian coffee from selected farms to global partners, with measured quality and lasting relationships.",
    "index.hero.explore": "Explore Products <span aria-hidden=\"true\">↗</span>",
    "index.hero.contact": "Contact Us <span aria-hidden=\"true\">→</span>",
    "index.hero.scroll": "Scroll to discover",

    "index.badge.label": "Indonesian<br />origin",

    "index.intro.eyebrow": "About Us",
    "index.intro.title": "Rooted in origin.<br /><em>Ready for the world.</em>",
    "index.intro.p1": "Putri Nusantara is an Indonesian coffee export company committed to bringing high-quality green beans from local farmers to international markets.",
    "index.intro.p2": "We care for every stage of the coffee's journey — from origin selection, quality curation, to export readiness — grounded in quality, trust, and sustainability.",
    "index.intro.trust1": "<strong>Curated origins</strong><br />Connected to selected farms and communities.",
    "index.intro.trust2": "<strong>Export mindset</strong><br />Every lot is prepared with attention to detail.",
    "index.intro.link": "Meet Putri Nusantara <span aria-hidden=\"true\">→</span>",

    "footer.tagline": "Premium Indonesian coffee, thoughtfully sourced for the global market.",
    "footer.copyright": "Copyright © 2026 Putri Nusantara. All Rights Reserved.",
    "footer.backtotop": "Back to top <span aria-hidden=\"true\">↑</span>",

    "modal.eyebrow": "Make a Request",
    "modal.title": "Tell us what you need",
    "modal.lead": "Fill out this short form — your request will open directly in your email app, addressed to our team.",
    "modal.label.name": "Name",
    "modal.label.email": "Email",
    "modal.label.message": "Request",
    "modal.submit": "Send Request <span aria-hidden=\"true\">→</span>",

    "about.breadcrumb": "About Us",
    "about.hero.eyebrow": "Our story",
    "about.hero.title": "About <em>Putri Nusantara</em>",
    "about.hero.lead": "A trusted bridge between Indonesia's remarkable coffee origins and the world's most discerning buyers.",
    "about.story.eyebrow": "Who we are",
    "about.story.title": "A better export journey starts at <em>the origin.</em>",
    "about.story.p1": "Putri Nusantara introduces the richness of Indonesian coffee through carefully selected green beans. We build relationships that grow together with farmers, processing partners, and international buyers.",
    "about.story.p2": "With attention to consistency, transparency, and export readiness, we care for every lot so its distinct origin character reaches its destination.",
    "about.story.signature": "<strong>Putri Nusantara</strong><br />Indonesian Coffee Export Company",
    "about.origin.card": "<strong>Indonesia</strong><br />A landscape of distinct coffee origins.",
    "about.values.eyebrow": "What guides us",
    "about.values.title": "Built around enduring <em>values.</em>",
    "about.values.desc": "These four principles guide how we select, process, and introduce Indonesian coffee to the world market.",
    "about.value1.title": "Trusted Sources",
    "about.value1.desc": "Selected directly from the best local farmers with maintained quality standards.",
    "about.value2.title": "Hygienic Process",
    "about.value2.desc": "Processed through a clean, safe production system that meets operational standards.",
    "about.value3.title": "Quality Assurance",
    "about.value3.desc": "Every product goes through inspection and curation to ensure the best quality.",
    "about.value4.title": "Sustainable Partnership",
    "about.value4.desc": "Supporting farmers' welfare through fair, transparent, and sustainable business practices.",
    "about.gallery.eyebrow": "Behind the beans",
    "about.gallery.title": "From nursery to <em>an ever-growing garden.</em>",
    "about.gallery.desc": "A glimpse of the field process — how every seedling is cared for before becoming export-ready coffee.",
    "about.quote": "We believe the strongest coffee partnerships are made with clarity, care, and a shared respect for origin.",

    "product.breadcrumb": "Products",
    "product.hero.eyebrow": "Curated green coffee",
    "product.hero.title": "Our <em>Products</em>",
    "product.hero.lead": "Distinct Indonesian green beans selected with an export-ready attention to quality, profile, and consistency.",
    "product.intro.eyebrow": "Selection",
    "product.intro.title": "A green bean portfolio with a <em>clear point of view.</em>",
    "product.intro.desc": "Every lot is an invitation to explore the distinct character of Indonesian coffee. Contact our team for origin, availability, and the latest lot specifications.",
    "product.type": "Green Coffee",
    "product.card1.desc": "A bold character with full body, chosen to provide a consistent foundation for espresso and bold-leaning blends alike.",
    "product.card2.desc": "A selected Arabica lot with aromatic complexity, lively acidity, and an elegant origin character for specialty and premium blend needs.",
    "product.spec.origin": "Origin",
    "product.spec.process": "Process",
    "product.spec.profile": "Profile",
    "product.spec.availability": "Availability",
    "product.card1.profile": "Bold · Full body",
    "product.card2.profile": "Complex · Refined",
    "product.availability": "By inquiry",
    "product.link": "Request details <span aria-hidden=\"true\">→</span>",
    "product.note.eyebrow": "Made for your program",
    "product.note.title": "Looking for a tailored coffee profile?",
    "product.note.cta": "Talk to our team <span aria-hidden=\"true\">→</span>",

    "contact.breadcrumb": "Contact",
    "contact.hero.eyebrow": "Let's connect",
    "contact.hero.title": "Contact <em>Us</em>",
    "contact.hero.lead": "Let's start a conversation about your coffee needs. We're ready to help you find the right lot for your market.",
    "contact.card.phone.label": "Phone Number",
    "contact.card.phone.note": "Available by appointment",
    "contact.card.address.label": "Address",
    "contact.card.address.note": "Serving partners worldwide",
    "contact.map.eyebrow": "Find us",
    "contact.map.title": "From Indonesia, <em>to the world.</em>",
    "contact.closing.eyebrow": "Partnerships start here",
    "contact.closing.desc": "For lot availability, specifications, or partnership discussions, please email our team.",
    "contact.closing.link": "Send an email <span aria-hidden=\"true\">→</span>"
  };

  const originals = new WeakMap();

  const applyLanguage = (lang) => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!originals.has(el)) originals.set(el, el.innerHTML);
      el.innerHTML = lang === "en" && en[key] ? en[key] : originals.get(el);
    });

    document.documentElement.setAttribute("lang", lang);

    document.querySelectorAll("[data-lang-option]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.langOption === lang);
    });

    const currentLabel = document.querySelector("[data-lang-current]");
    if (currentLabel) currentLabel.textContent = lang.toUpperCase();
  };

  const setLanguage = (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    applyLanguage(lang);
  };

  const buildSwitcher = () => {
    const wrap = document.createElement("div");
    wrap.className = "lang-switcher";
    wrap.innerHTML = `
      <button type="button" class="lang-switcher-toggle" aria-haspopup="true" aria-expanded="false" aria-label="Ganti bahasa">
        <span class="lang-globe" aria-hidden="true">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.5 2.6 4 5.8 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.8-4-9s1.5-6.4 4-9Z"></path></svg>
        </span>
        <span data-lang-current>ID</span>
        <span class="lang-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="lang-switcher-menu" role="menu">
        <button type="button" class="lang-switcher-option" role="menuitem" data-lang-option="id">Bahasa Indonesia</button>
        <button type="button" class="lang-switcher-option" role="menuitem" data-lang-option="en">English</button>
      </div>
    `;
    document.body.appendChild(wrap);

    const toggleBtn = wrap.querySelector(".lang-switcher-toggle");
    toggleBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = wrap.classList.toggle("is-open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
    });

    wrap.querySelectorAll("[data-lang-option]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setLanguage(btn.dataset.langOption);
        wrap.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (event) => {
      if (!wrap.contains(event.target)) {
        wrap.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    buildSwitcher();
    applyLanguage(localStorage.getItem(STORAGE_KEY) || "id");
  });
})();