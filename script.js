/* omni-vision-pro site — interactions & animations */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- nav on scroll ---------- */
  var nav = $("#nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 24) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- cursor glow ---------- */
  var glow = $(".cursor-glow");
  if (glow && window.matchMedia("(hover: hover)").matches) {
    var raf = null;
    window.addEventListener("mousemove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        glow.style.left = e.clientX + "px";
        glow.style.top = e.clientY + "px";
        raf = null;
      });
    }, { passive: true });
  }

  /* ---------- reveal on scroll ---------- */
  var revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) {
      var delay = el.getAttribute("data-reveal-delay");
      if (delay) el.style.setProperty("--d", delay + "ms");
      io.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- stat counters ---------- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    var dur = 1200, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    $$(".stat-num[data-count]").forEach(function (el) { countIO.observe(el); });
  }

  /* ---------- copy to clipboard ---------- */
  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }
  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* noop */ }
    document.body.removeChild(ta);
  }

  var checkSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20 6 9 17l-5-5"/></svg>';

  $$(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      copyText(btn.getAttribute("data-copy"), function () { flashBtn(btn); });
    });
  });

  $$(".code-block").forEach(function (block) {
    var copyBtn = $(".code-copy", block);
    if (!copyBtn) return;
    copyBtn.addEventListener("click", function () {
      var text = block.getAttribute("data-copy");
      if (!text) {
        text = block.textContent
          .replace(/^\s*\$\s?/, "")
          .trim();
      }
      copyText(text, function () { flashBtn(copyBtn); block.classList.add("copied"); setTimeout(function () { block.classList.remove("copied"); }, 1600); });
    });
  });

  function flashBtn(btn) {
    var label = btn.getAttribute("data-copied");
    var orig = btn.innerHTML;
    var wasCopyBtn = btn.classList.contains("code-copy");
    if (label && !wasCopyBtn) {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>' + label + "</span>";
      btn.classList.add("copied");
      setTimeout(function () { btn.innerHTML = orig; btn.classList.remove("copied"); }, 2200);
      return;
    }
    copyBtnFlash(btn);
  }

  function copyBtnFlash(btn) {
    if (!btn || btn.classList.contains("copied")) return;
    var orig = btn.innerHTML;
    btn.classList.add("copied");
    btn.innerHTML = checkSVG;
    setTimeout(function () { btn.classList.remove("copied"); btn.innerHTML = orig; }, 1600);
  }

  /* ---------- docs tabs ---------- */
  var tabs = $$(".docs-tab");
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var id = tab.getAttribute("data-tab");
        tabs.forEach(function (t) {
          t.classList.toggle("active", t === tab);
          t.setAttribute("aria-selected", t === tab ? "true" : "false");
        });
        $$(".docs-panel").forEach(function (panel) {
          panel.classList.toggle("active", panel.id === "panel-" + id);
        });
      });
    });
  }

  /* ---------- tool card spotlight ---------- */
  $$(".tool-card").forEach(function (card) {
    card.addEventListener("mousemove", function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- terminal typing ---------- */
  var typing = $("#typingCmd");
  if (typing) {
    var script =
      "Use omni-vision-pro to analyze this screenshot. " +
      "Return the visible text, UI hierarchy, layout, colors, interactions, " +
      "accessibility issues, and reusable components.";
    var i = 0;
    function type() {
      if (i <= script.length) {
        typing.textContent = script.slice(0, i);
        i++;
        setTimeout(type, 34);
      }
    }
    setTimeout(type, 1400);
  }

  /* ---------- footer year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
