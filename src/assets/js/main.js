// Small enhancements: mobile menu, illustrations, People filter, Publications search.
// The site works without JavaScript; these only add filtering.
(function () {
  // When the site is shown inside another page (e.g. a preview frame), the outer
  // page keeps its scroll position between pages. Start each newly opened page
  // at the top; back/forward and #links keep their normal behaviour.
  if (window.self !== window.top && !location.hash) {
    const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
    if (!nav || nav.type === "navigate") {
      window.scrollTo(0, 0);
      document.documentElement.scrollIntoView({ block: "start" });
    }
  }

  // Mobile menu
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Animated illustrations: start playing right away, then pause the ones that are
  // off screen to save battery. The visibility check watches each picture's HTML
  // wrapper (some mobile browsers don't report visibility for SVG elements).
  const illus = document.querySelectorAll(".illus");
  illus.forEach((el) => el.classList.add("is-playing"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        const svg = e.target.matches(".illus") ? e.target : e.target.querySelector(".illus");
        if (svg) svg.classList.toggle("is-playing", e.isIntersecting);
      }),
      { threshold: 0, rootMargin: "100px 0px" }
    );
    illus.forEach((el) => io.observe(el.parentElement || el));
  }

  // Copy-to-clipboard buttons (e.g. email address on the Join us page)
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        // fallback for older browsers / restricted frames
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
        ta.remove();
      }
      const msg = btn.querySelector(".copy-msg");
      if (msg) msg.textContent = ok ? "Copied" : "Copy failed";
      btn.classList.add("copied");
      clearTimeout(btn._t);
      btn._t = setTimeout(() => btn.classList.remove("copied"), 1600);
    });
  });

  // People: Dry / Wet filter
  const filterButtons = document.querySelectorAll(".filter button");
  if (filterButtons.length) {
    const groups = document.querySelectorAll(".member-group:not(.pi-group)"); // PI always shown
    const empty = document.querySelector(".filter-empty");
    filterButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        const f = btn.dataset.filter;
        filterButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
        let shown = 0;
        groups.forEach((g) => {
          let n = 0;
          g.querySelectorAll(".member").forEach((m) => {
            const t = m.dataset.track;
            const ok = f === "all" || t === f || t === "both";
            m.hidden = !ok;
            if (ok) n++;
          });
          g.hidden = n === 0;
          const count = g.querySelector(".member-count");
          if (count) count.textContent = n;
          shown += n;
        });
        if (empty) empty.hidden = shown > 0;
      })
    );
  }

  // Publications: search + "selected only"
  const search = document.getElementById("pub-search");
  if (search) {
    const selected = document.getElementById("pub-selected");
    const count = document.getElementById("pub-count");
    const empty = document.getElementById("pub-empty");
    const years = document.querySelectorAll(".pub-year");
    const total = document.querySelectorAll(".pub-year .pub").length;
    const run = () => {
      const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      let shown = 0;
      years.forEach((y) => {
        let n = 0;
        y.querySelectorAll(".pub").forEach((p) => {
          const text = p.dataset.search;
          const ok = terms.every((t) => text.includes(t)) && (!selected.checked || p.dataset.selected === "true");
          p.hidden = !ok;
          if (ok) n++;
        });
        y.hidden = n === 0;
        shown += n;
      });
      count.textContent = shown === total ? `${total} publications` : `${shown} of ${total} publications`;
      empty.hidden = shown > 0;
    };
    search.addEventListener("input", run);
    selected.addEventListener("change", run);
  }
})();
