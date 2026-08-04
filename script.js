/* omni-vision-pro site ... interactions, animations & smooth page transitions */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var transitionBusy = false;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */

  function canonical(pathOrHref) {
    var p = String(pathOrHref || "/");
    p = p.replace(/^https?:\/\/[^/]+/, "");
    var qi = p.indexOf("?");
    if (qi !== -1) p = p.slice(0, qi);
    var hi = p.indexOf("#");
    if (hi !== -1) p = p.slice(0, hi);
    if (p === "" || p === "/") return "index.html";
    var last = p.split("/").pop();
    if (!last) return "index.html";
    return /\.html$/.test(last) ? last : last + ".html";
  }
  function pageKey() { return canonical(window.location.href); }

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

  /* ---------- init page (runs on load & after each transition) ---------- */

  function initPage(keyOverride) {
    var nav = $("#nav");

    var key = (keyOverride || pageKey()).replace(/\.html$/, "");
    $$(".nav-links a[data-page], .nav-cta a[data-page], .footer-cols a[data-page], .menu-overlay a[data-page]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-page") === key);
    });

    function onScroll() {
      if (!nav) return;
      if (window.scrollY > 24) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

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

    var checkSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20 6 9 17l-5-5"/></svg>';

    function copyBtnFlash(btn) {
      if (btn.classList.contains("copied")) return;
      var orig = btn.innerHTML;
      btn.classList.add("copied");
      btn.innerHTML = checkSVG;
      setTimeout(function () { btn.classList.remove("copied"); btn.innerHTML = orig; }, 1600);
    }

    $$(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        copyText(btn.getAttribute("data-copy"), function () {
          var label = btn.getAttribute("data-copied");
          if (label) {
            var orig = btn.innerHTML;
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>' + label + "</span>";
            btn.classList.add("copied");
            setTimeout(function () { btn.innerHTML = orig; btn.classList.remove("copied"); }, 2200);
          } else {
            copyBtnFlash(btn);
          }
        });
      });
    });

    $$(".code-block").forEach(function (block) {
      var copyBtn = $(".code-copy", block);
      if (!copyBtn) return;
      copyBtn.addEventListener("click", function () {
        var text = block.getAttribute("data-copy");
        if (!text) text = block.textContent.replace(/^\s*\$\s?/, "").trim();
        copyText(text, function () {
          copyBtnFlash(copyBtn);
          block.classList.add("copied");
          setTimeout(function () { block.classList.remove("copied"); }, 1600);
        });
      });
    });

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

    var typing = $("#typingCmd");
    if (typing && !typing.dataset.started) {
      typing.dataset.started = "1";
      var script =
        "Use omni-vision-pro to analyze this screenshot. " +
        "Return the visible text, UI hierarchy, layout, colors, interactions, " +
        "accessibility issues, and reusable components.";
      var i = 0;
      function type() {
        if (i <= script.length) {
          typing.textContent = script.slice(0, i);
          i++;
          setTimeout(type, 30);
        }
      }
      setTimeout(type, 1400);
    }

    var yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  }

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

  /* ---------- mobile bloom menu ---------- */

  var menuTrigger = $("#menuTrigger");
  var menuOverlay = $("#menuOverlay");
  var menuClose = $("#menuClose");

  function closeMenu() {
    if (!menuOverlay || !document.body.classList.contains("menu-open")) return;
    document.body.classList.remove("menu-open");
    if (menuTrigger) menuTrigger.setAttribute("aria-expanded", "false");
    menuOverlay.setAttribute("aria-hidden", "true");
  }

  function burstParticles(x, y, colors, count) {
    if (!("animate" in document.createElement("span"))) return;
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "menu-burst";
      s.style.background = colors[i % colors.length];
      s.style.left = x + "px";
      s.style.top = y + "px";
      document.body.appendChild(s);
      var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      var dist = 60 + Math.random() * 150;
      var dx = Math.cos(ang) * dist;
      var dy = Math.sin(ang) * dist - 46;
      var anim = s.animate([
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: "translate(" + dx + "px," + dy + "px) scale(0)", opacity: 0 }
      ], { duration: 650 + Math.random() * 450, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" });
      anim.onfinish = function () { s.remove(); };
    }
  }

  if (menuTrigger && menuOverlay) {
    var fan = $(".menu-fan", menuOverlay);
    if (fan) {
      $$(".menu-card", fan).forEach(function (card, ci) {
        $$("a", card).forEach(function (a, i) {
          a.style.setProperty("--i", String(i));
        });
      });
    }

    menuTrigger.addEventListener("click", function () {
      document.body.classList.add("menu-open");
      menuTrigger.setAttribute("aria-expanded", "true");
      menuOverlay.setAttribute("aria-hidden", "false");
      var r = menuTrigger.getBoundingClientRect();
      burstParticles(r.left + r.width / 2, r.top + r.height / 2, ["#3b82f6", "#06b6d4", "#f59e0b"], 16);
    });

    if (menuClose) {
      menuClose.addEventListener("click", closeMenu);
      $$("a", menuOverlay).forEach(function (a) {
        a.addEventListener("click", closeMenu);
      });
      menuOverlay.addEventListener("click", function (e) {
        if (e.target === menuOverlay || e.target.classList.contains("menu-ring")) closeMenu();
      });
    }
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- page transitions ---------- */

  function enterPage(hash) {
    document.body.classList.add("transition-enter");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("transition-entered");
      });
    });
    setTimeout(function () {
      document.body.classList.remove("transition-enter", "transition-entered");
    }, 800);

    if (hash) {
      var el = document.getElementById(hash);
      if (el) {
        setTimeout(function () { el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }); }, 620);
        return;
      }
    }
    window.scrollTo(0, 0);
  }

  function swapContent(file, key) {
    return fetch(file, { headers: { "X-Requested-With": "page-transition" } })
      .then(function (res) {
        if (!res.ok) throw new Error("fetch failed " + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var newMain = doc.getElementById("page-root");
        if (!newMain) throw new Error("no page-root");
        document.getElementById("page-root").innerHTML = newMain.innerHTML;
        document.title = doc.title;
        var desc = doc.querySelector('meta[name="description"]');
        if (desc) {
          var cur = document.querySelector('meta[name="description"]');
          if (cur) cur.setAttribute("content", desc.getAttribute("content"));
        }
        initPage(key);
      });
  }

  function navigate(path, hash) {
    if (transitionBusy) return;
    transitionBusy = true;
    document.body.classList.add("transition-leave");
    setTimeout(function () {
      var file = canonical(path);
      swapContent(file, file)
        .then(function () {
          history.pushState({}, "", (path || "/") + hash);
          document.body.classList.remove("transition-leave");
          enterPage(hash ? hash.slice(1) : null);
          transitionBusy = false;
          closeMenu();
        })
        .catch(function () {
          document.body.classList.remove("transition-leave");
          transitionBusy = false;
          window.location.href = (path || "/") + hash;
        });
    }, 470);
  }

  /* internal link interception */
  document.addEventListener("click", function (e) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
    var a = e.target.closest("a");
    if (!a || a.hasAttribute("target") || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if (!href) return;
    if (href.indexOf("://") !== -1 && href.indexOf(window.location.origin) !== 0) return;

    var hi = href.indexOf("#");
    var hash = hi !== -1 ? href.slice(hi) : "";
    var path = hi !== -1 ? href.slice(0, hi) : href;
    if (path === "") path = "/";

    if (canonical(path) === pageKey()) {
      e.preventDefault();
      if (hash) {
        var el = document.getElementById(hash.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
          history.replaceState(null, "", hash);
        }
      } else {
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
        history.replaceState(null, "", path);
      }
      return;
    }
    e.preventDefault();
    navigate(path, hash);
  });

  /* back / forward */
  window.addEventListener("popstate", function () {
    if (transitionBusy) return;
    transitionBusy = true;
    var key = pageKey();
    swapContent(key, key)
      .then(function () {
        enterPage(window.location.hash ? window.location.hash.slice(1) : null);
        transitionBusy = false;
        closeMenu();
      })
      .catch(function () {
        transitionBusy = false;
        window.location.reload();
      });
  });

  /* first paint */
  initPage();
  if (!reduced) {
    document.body.classList.add("transition-enter");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("transition-entered");
      });
    });
    setTimeout(function () {
      document.body.classList.remove("transition-enter", "transition-entered");
    }, 800);
  } else {
    document.body.classList.add("transition-entered");
  }

  /* scroll to hash on hard load */
  if (window.location.hash) {
    var h = window.location.hash.slice(1);
    setTimeout(function () {
      var el = document.getElementById(h);
      if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
    }, reduced ? 50 : 700);
  }
})();
