/* omni-vision-pro site — interactions, animations & smooth page transitions */
(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var transitionBusy = false;

  /* ---------- helpers ---------- */

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

  function stripHash(url) { return url.split("#")[0]; }
  function currentPath() {
    var p = window.location.pathname;
    if (p === "/" || p === "" || /\/index\.html$/.test(p)) return "index.html";
    var last = p.split("/").pop() || "index.html";
    return /\.html$/.test(last) ? last : last + ".html";
  }

  /* ---------- init page (runs on load & after each transition) ---------- */

  function initPage() {
    var nav = $("#nav");

    /* active nav link */
    var page = currentPath();
    $$(".nav-links a[data-page], .nav-cta a[data-page], .footer-cols a[data-page]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-page") === (page === "docs.html" ? "docs" : "home"));
    });

    /* nav on scroll */
    function onScroll() {
      if (!nav) return;
      if (window.scrollY > 24) nav.classList.add("scrolled");
      else nav.classList.remove("scrolled");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* reveal on scroll */
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

    /* stat counters */
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

    /* copy to clipboard */
    var checkSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M20 6 9 17l-5-5"/></svg>';

    $$(".copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        copyText(btn.getAttribute("data-copy"), function () { flashBtn(btn); });
      });
    });

    function copyBtnFlash(btn) {
      if (btn.classList.contains("copied")) return;
      var orig = btn.innerHTML;
      btn.classList.add("copied");
      btn.innerHTML = checkSVG;
      setTimeout(function () { btn.classList.remove("copied"); btn.innerHTML = orig; }, 1600);
    }

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

    function flashBtn(btn) {
      var label = btn.getAttribute("data-copied");
      if (label) {
        var orig = btn.innerHTML;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg><span>' + label + "</span>";
        btn.classList.add("copied");
        setTimeout(function () { btn.innerHTML = orig; btn.classList.remove("copied"); }, 2200);
        return;
      }
      copyBtnFlash(btn);
    }

    /* docs tabs */
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

    /* terminal typing */
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

    /* footer year */
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

  /* ---------- page transitions ---------- */

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  function swapContent(url) {
    return fetch(url, { headers: { "X-Requested-With": "page-transition" } })
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
        initPage();
        return url;
      });
  }

  function navigate(url) {
    if (transitionBusy) return;
    transitionBusy = true;
    var hash = null;
    var i = url.indexOf("#");
    if (i !== -1) { hash = url.slice(i + 1); url = url.slice(0, i); }
    if (!url || url === window.location.pathname) {
      enterPage(hash);
      transitionBusy = false;
      return;
    }

    document.body.classList.add("transition-leave");
    setTimeout(function () {
      swapContent(url)
        .then(function () {
          history.pushState({}, "", hash ? url + "#" + hash : url);
          document.body.classList.remove("transition-leave");
          enterPage(hash);
          transitionBusy = false;
        })
        .catch(function () {
          document.body.classList.remove("transition-leave");
          transitionBusy = false;
          window.location.href = url + (hash ? "#" + hash : "");
        });
    }, 470);
  }

  /* internal link interception */
  document.addEventListener("click", function (e) {
    if (reduced || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest("a");
    if (!a || a.hasAttribute("target") || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if (!href) return;
    if (href.charAt(0) === "#") {
      e.preventDefault();
      var el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (href.indexOf("://") !== -1 && href.indexOf(window.location.origin) !== 0) return;
    var url = href;
    var hashIndex = url.indexOf("#");
    var pathPart = stripHash(url);
    if (pathPart === currentPath()) {
      if (hashIndex !== -1) {
        e.preventDefault();
        var t = document.getElementById(url.slice(hashIndex + 1));
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    e.preventDefault();
    navigate(url);
  });

  /* back / forward */
  window.addEventListener("popstate", function () {
    if (transitionBusy) return;
    transitionBusy = true;
    var url = stripHash(window.location.href);
    swapContent(url)
      .then(function () {
        enterPage(window.location.hash ? window.location.hash.slice(1) : null);
        transitionBusy = false;
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
