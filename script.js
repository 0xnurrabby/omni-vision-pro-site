(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll progress + header ---------- */

  var progress = document.querySelector("[data-scroll-progress]");
  var header = document.querySelector("[data-header]");

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = pct + "%";
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */

  var menuButton = document.querySelector("[data-menu-button]");
  var mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      var open = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!open));
      mobileMenu.classList.toggle("is-open", !open);
    });
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menuButton.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("is-open");
      }
    });
  }

  /* ---------- reveal on scroll ---------- */

  var revealEls = document.querySelectorAll(".reveal");
  if (reduced) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10) * 80;
          setTimeout(function () { el.classList.add("is-visible"); }, delay);
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- animated counters ---------- */

  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduced && "IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var duration = 1100;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(eased * target));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { counterObserver.observe(el); });
  }

  /* ---------- copy buttons ---------- */

  var toast = document.querySelector("[data-copy-toast]");
  var toastTimer = null;

  function copyText(text, button) {
    function done(ok) {
      if (!button) return;
      var label = button.querySelector("[data-copy-label]");
      if (label) {
        var original = label.textContent;
        label.textContent = ok ? "Copied!" : "Failed";
        setTimeout(function () { label.textContent = original; }, 1600);
      }
      if (ok && toast) {
        toast.classList.add("is-visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 1800);
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallback(); });
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      done(ok);
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    copyText(btn.getAttribute("data-copy"), btn);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var btn = e.target.closest ? e.target.closest("[data-copy]") : null;
    if (!btn) return;
    e.preventDefault();
    copyText(btn.getAttribute("data-copy"), btn);
  });

  /* ---------- card cursor glow ---------- */

  if (!reduced && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".card, .tool-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - rect.left) + "px");
        card.style.setProperty("--my", (e.clientY - rect.top) + "px");
      });
    });
  }

  /* ---------- docs tabs ---------- */

  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-doc-tab]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-doc-panel]"));

  function activateTab(id) {
    var target = tabs.filter(function (t) { return t.getAttribute("data-doc-tab") === id; })[0];
    if (!target) return;
    tabs.forEach(function (t) {
      var active = t === target;
      t.setAttribute("aria-selected", String(active));
      t.setAttribute("tabindex", active ? "0" : "-1");
    });
    panels.forEach(function (p) {
      p.classList.toggle("is-active", p.getAttribute("data-doc-panel") === id);
      if (p.getAttribute("data-doc-panel") === id) p.hidden = false;
      else p.hidden = true;
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () { activateTab(tab.getAttribute("data-doc-tab")); });
    tab.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var idx = tabs.indexOf(tab);
      var next = e.key === "ArrowDown" || e.key === "ArrowRight" ? (idx + 1) % tabs.length : (idx - 1 + tabs.length) % tabs.length;
      activateTab(tabs[next].getAttribute("data-doc-tab"));
      tabs[next].focus();
    });
  });

  /* ---------- faq accordion ---------- */

  var faqButtons = document.querySelectorAll("[data-faq-button]");
  faqButtons.forEach(function (btn) {
    var item = btn.closest(".faq-item");
    var body = item.querySelector(".faq-body");
    function setOpen(open) {
      btn.setAttribute("aria-expanded", String(open));
      item.classList.toggle("is-open", open);
      body.style.maxHeight = open ? body.scrollHeight + "px" : "0";
    }
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      faqButtons.forEach(function (other) {
        var otherItem = other.closest(".faq-item");
        var otherBody = otherItem.querySelector(".faq-body");
        other.setAttribute("aria-expanded", "false");
        otherItem.classList.remove("is-open");
        otherBody.style.maxHeight = "0";
      });
      setOpen(!open);
    });
  });

  /* ---------- hero terminal demo ---------- */

  var demoEl = document.querySelector("[data-hero-demo]");
  var demoBody = document.querySelector("[data-demo-body]");
  var demoStatus = document.querySelector("[data-demo-status]");

  if (demoBody && !reduced) {
    var scenes = [
      {
        cmd: "npx --yes omni-vision-pro@latest setup --yes",
        lines: [
          { cls: "ok", text: "✓ detected Codex · OpenCode · Cursor" },
          { cls: "ok", text: "✓ runtime pinned · v1.2.0" },
          { cls: "ok", text: "✓ MCP config written · backups made" },
          { cls: "ok", text: "✓ 3 tools verified" }
        ],
        status: "setup complete · restart the client"
      },
      {
        cmd: "analyze_images → checkout.png",
        lines: [
          { text: "provider: local OCR" },
          { cls: "ok", text: "✓ text: \"Checkout · Total $49.90 · Pay now\"" },
          { cls: "key", text: "layout JSON → ready · index 1 of 3" }
        ],
        status: "analyzing · ordered batch · 3/3"
      },
      {
        cmd: "read_zip_context → project.zip",
        lines: [
          { cls: "ok", text: "✓ 12 files · 0 extractions · safe" },
          { cls: "ok", text: "✓ node_modules & secrets skipped" },
          { cls: "key", text: "virtual tree → ready" }
        ],
        status: "archive inspected in memory"
      },
      {
        cmd: "read_code_context → src/components",
        lines: [
          { cls: "ok", text: "✓ 34 files · 480 KB bounded" },
          { cls: "ok", text: "✓ symlinks & binaries skipped" },
          { cls: "key", text: "source context → ready" }
        ],
        status: "context handed off to your AI"
      }
    ];

    var sceneIndex = 0;
    var cmdEl = document.querySelector("[data-demo-cmd]");
    var cursorEl = document.querySelector(".demo-cursor");
    var outputEl = document.querySelector("[data-demo-output]");
    var paused = false;

    function typeLine(text, el, onDone) {
      var i = 0;
      el.textContent = "";
      function tick() {
        if (paused) return;
        i++;
        el.textContent = text.slice(0, i);
        if (i < text.length) setTimeout(tick, 22);
        else onDone();
      }
      setTimeout(tick, 300);
    }

    function runScene() {
      var scene = scenes[sceneIndex];
      outputEl.innerHTML = "";
      typeLine(scene.cmd, cmdEl, function () {
        setTimeout(function () {
          cursorEl.style.display = "none";
          var lineIndex = 0;
          function nextLine() {
            if (lineIndex >= scene.lines.length) {
              if (demoStatus) demoStatus.textContent = scene.status;
              setTimeout(function () {
                sceneIndex = (sceneIndex + 1) % scenes.length;
                cursorEl.style.display = "";
                cmdEl.textContent = "";
                runScene();
              }, 3400);
              return;
            }
            var line = scene.lines[lineIndex];
            var p = document.createElement("p");
            if (line.cls) p.className = line.cls;
            outputEl.appendChild(p);
            typeLine(line.text, p, function () {
              lineIndex++;
              setTimeout(nextLine, 420);
            });
          }
          nextLine();
        }, 500);
      });
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !paused) {
          paused = true;
          runScene();
          io.disconnect();
        }
      });
    }, { threshold: 0.35 });
    io.observe(demoEl || document.body);

    if (!demoEl) runScene();
  }
})();
