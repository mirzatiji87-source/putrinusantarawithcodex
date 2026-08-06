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