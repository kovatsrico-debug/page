(function () {
  "use strict";

  function initNavToggle() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".main-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem("kord-theme");
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(value) {
    try {
      localStorage.setItem("kord-theme", value);
    } catch (e) {
      /* private mode / blocked storage: theme just won't persist */
    }
  }

  function initThemeToggle() {
    var root = document.documentElement;
    var stored = getStoredTheme();
    if (stored === "light" || stored === "dark") {
      root.setAttribute("data-theme", stored);
    }
    var btn = document.querySelector(".theme-toggle");
    if (!btn) return;
    updateThemeIcon(btn, root);
    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var isDark = current ? current === "dark" : prefersDark;
      var next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      setStoredTheme(next);
      updateThemeIcon(btn, root);
    });
  }

  function updateThemeIcon(btn, root) {
    var current = root.getAttribute("data-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = current ? current === "dark" : prefersDark;
    btn.setAttribute("aria-label", isDark ? "Helles Design aktivieren" : "Dunkles Design aktivieren");
    btn.innerHTML = isDark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/></svg>';
  }

  function initReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  function initFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) el.textContent = new Date().getFullYear();
  }

  function initHeroPlz() {
    var forms = document.querySelectorAll("[data-hero-plz-form]");
    forms.forEach(function (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var input = form.querySelector("input");
        var plz = (input.value || "").trim();
        var url = "haendlersuche/";
        if (plz) url += "?plz=" + encodeURIComponent(plz);
        window.location.href = url;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initThemeToggle();
    initReveal();
    initFooterYear();
    initHeroPlz();
  });
})();
