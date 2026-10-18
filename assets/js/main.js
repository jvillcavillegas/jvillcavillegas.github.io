/* main.js — language switch, theme, navigation, profile links, ORCID & GitHub feeds, copy buttons */
(function () {
  "use strict";
  var CFG = window.SITE_CONFIG || {};
  var root = document.documentElement;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage disabled */ } }
  };

  // ---------------- Language ----------------
  function lang() { return root.getAttribute("lang") === "es" ? "es" : "en"; }
  function applyLang(l) {
    root.setAttribute("lang", l);
    var t = document.querySelector("title[data-en]");
    if (t) document.title = t.getAttribute("data-" + l) || document.title;
    document.querySelectorAll("[data-i18n-attrs]").forEach(function (el) {
      el.getAttribute("data-i18n-attrs").split(",").forEach(function (a) {
        a = a.trim();
        var v = el.getAttribute("data-" + a + "-" + l);
        if (v !== null) el.setAttribute(a, v);
      });
    });
    var sw = document.querySelector(".lang-switch");
    if (sw) {
      sw.setAttribute("aria-label", l === "en" ? "Cambiar a español" : "Switch to English");
      sw.setAttribute("aria-pressed", l === "es" ? "true" : "false");
    }
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: l } }));
  }
  function setLang(l) {
    store.set("jlv-lang", l);
    applyLang(l);
    // keep ?lang= in the address bar in sync, so shared links open in the same language
    try {
      var u = new URL(location.href);
      if (u.searchParams.has("lang")) { u.searchParams.set("lang", l); history.replaceState(null, "", u); }
    } catch (e) { /* old browser */ }
  }
  window.SiteLang = { get: lang, set: setLang };

  // ---------------- Theme ----------------
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    store.set("jlv-theme", t);
    var btn = document.querySelector(".theme-toggle");
    if (btn) btn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
  }

  // ---------------- Toast ----------------
  var toastEl;
  function toast(msgEn, msgEs) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast"; toastEl.setAttribute("role", "status"); toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = lang() === "es" ? (msgEs || msgEn) : msgEn;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }
  function copyText(text) {
    var done = function () { toast("Copied to clipboard", "Copiado al portapapeles"); };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done);
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }
  window.UI = { toast: toast, copy: copyText };

  // ---------------- Profile links ----------------
  var ICONS = {
    orcid: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#a6ce39"/><path fill="#fff" d="M8.2 7.2a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zM7.5 8.6h1.4v9.2H7.5zM10.7 8.6h3.7c3.5 0 5 2.5 5 4.6 0 2.3-1.8 4.6-5 4.6h-3.7zm1.4 7.9h2.2c3.1 0 3.6-2.3 3.6-3.3 0-1.7-1.1-3.3-3.6-3.3h-2.2z"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.95 1.32-1.95 2.7V21h-4z"/></svg>',
    scholar: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3 1 9.5l4 2.35V17c0 2 3.1 4 7 4s7-2 7-4v-5.15l4-2.35zm0 2.3 7.2 4.2L12 13.7 4.8 9.5z"/></svg>',
    researchgate: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm4.3 4.2c-1.5 0-2.3.9-2.3 2.3v5c0 1.4.8 2.3 2.3 2.3h.3v-1.2h-.2c-.7 0-1-.4-1-1.2v-4.8c0-.8.3-1.2 1-1.2.8 0 1.1.4 1.1 1.2v7.2h1.3v-3.4h.9l1.7 3.4h1.4l-1.9-3.7c.8-.3 1.2-1 1.2-2V9.5c0-1.4-.8-2.3-2.3-2.3zm2.4 1.2h.8c.7 0 1 .4 1 1.2v1.4c0 .8-.3 1.2-1 1.2h-.8z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"/></svg>'
  };
  function email() { return CFG.emailUser && CFG.emailDomain ? CFG.emailUser + "@" + CFG.emailDomain : ""; }
  function renderLinks() {
    var links = [];
    if (CFG.orcid) links.push({ k: "orcid", href: "https://orcid.org/" + CFG.orcid, en: "ORCID", es: "ORCID" });
    if (email()) links.push({ k: "email", href: "mailto:" + email(), en: "Email", es: "Correo" });
    if (CFG.linkedin) links.push({ k: "linkedin", href: CFG.linkedin, en: "LinkedIn", es: "LinkedIn" });
    if (CFG.scholar) links.push({ k: "scholar", href: CFG.scholar, en: "Google Scholar", es: "Google Académico" });
    if (CFG.researchgate) links.push({ k: "researchgate", href: CFG.researchgate, en: "ResearchGate", es: "ResearchGate" });
    if (CFG.github) links.push({ k: "github", href: "https://github.com/" + CFG.github, en: "GitHub", es: "GitHub" });
    document.querySelectorAll("[data-profile-links]").forEach(function (ul) {
      ul.innerHTML = links.map(function (l) {
        var ext = l.k === "email" ? "" : ' target="_blank" rel="noopener me"';
        return '<li><a href="' + l.href + '"' + ext + '>' + ICONS[l.k] +
          '<span data-l="en">' + l.en + '</span><span data-l="es">' + l.es + "</span></a></li>";
      }).join("");
    });
    document.querySelectorAll("[data-email]").forEach(function (a) {
      var e = email(); if (!e) return;
      a.href = "mailto:" + e; a.textContent = e;
    });
  }

  // ---------------- ORCID works ----------------
  function orcidWorks() {
    if (!CFG.orcid) return Promise.reject(new Error("no orcid"));
    return fetch("https://pub.orcid.org/v3.0/" + CFG.orcid + "/works", { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var seen = {};
        return (data.group || []).map(function (g) {
          var w = (g["work-summary"] || [])[0] || {};
          var ids = (w["external-ids"] && w["external-ids"]["external-id"]) || [];
          var doi = ids.filter(function (x) { return (x["external-id-type"] || "").toLowerCase() === "doi"; })[0];
          return {
            title: w.title && w.title.title ? w.title.title.value : "",
            year: w["publication-date"] && w["publication-date"].year ? +w["publication-date"].year.value : 0,
            journal: w["journal-title"] ? w["journal-title"].value : "",
            type: w.type || "",
            doi: doi ? doi["external-id-value"] : "",
            url: w.url ? w.url.value : ""
          };
        }).filter(function (w) {
          var key = w.title.toLowerCase().replace(/\W+/g, "");
          if (!key || seen[key]) return false; seen[key] = 1; return true;
        }).sort(function (a, b) { return b.year - a.year; });
      });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function renderPubs() {
    var list = document.getElementById("pubs");
    var status = document.getElementById("pubs-status");
    var count = document.querySelectorAll("[data-orcid-count]");
    if (!list && !count.length) return;
    orcidWorks().then(function (works) {
      count.forEach(function (el) { el.textContent = works.length; });
      if (!list) return;
      if (!works.length) throw new Error("empty");
      list.innerHTML = works.map(function (w) {
        var link = w.doi ? "https://doi.org/" + w.doi : w.url;
        return "<li><div class=\"t\">" + esc(w.title) + "</div><div class=\"m\">" +
          [w.journal ? "<em>" + esc(w.journal) + "</em>" : "", w.year || ""].filter(Boolean).join(", ") +
          (link ? ' <a class="doi" href="' + esc(link) + '" target="_blank" rel="noopener">' + (w.doi ? "doi:" + esc(w.doi) : "link") + "</a>" : "") +
          "</div></li>";
      }).join("");
      if (status) status.innerHTML = '<span data-l="en">' + works.length + ' records, loaded live from ORCID.</span><span data-l="es">' + works.length + " registros, cargados en vivo desde ORCID.</span>";
    }).catch(function () {
      count.forEach(function (el) { el.textContent = "10+"; });
      if (status) status.innerHTML = '<span data-l="en">The live list could not load. See the full record on </span><span data-l="es">No se pudo cargar la lista en vivo. Consulta el registro completo en </span><a href="https://orcid.org/' + esc(CFG.orcid) + '" target="_blank" rel="noopener">ORCID</a>.';
    });
  }

  // ---------------- GitHub repositories ----------------
  function renderRepos() {
    var box = document.getElementById("gh-repos");
    if (!box) return;
    var section = box.closest("[data-gh-section]");
    if (!CFG.github) { if (section) section.hidden = true; return; }
    fetch("https://api.github.com/users/" + encodeURIComponent(CFG.github) + "/repos?sort=updated&per_page=12")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (repos) {
        repos = repos.filter(function (r) { return !r.fork; });
        if (!repos.length) { if (section) section.hidden = true; return; }
        box.innerHTML = repos.map(function (r) {
          return '<article class="download"><h3><a href="' + esc(r.html_url) + '" target="_blank" rel="noopener">' + esc(r.name) + "</a></h3>" +
            "<p>" + esc(r.description || "") + "</p><small class=\"muted\">" + esc(r.language || "") + (r.stargazers_count ? " · ★ " + r.stargazers_count : "") + "</small></article>";
        }).join("");
      }).catch(function () { if (section) section.hidden = true; });
  }

  // ---------------- Code blocks: copy buttons ----------------
  function codeCopy() {
    document.querySelectorAll(".code").forEach(function (box) {
      if (box.querySelector(".copy")) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "copy";
      b.innerHTML = '<span data-l="en">Copy</span><span data-l="es">Copiar</span>';
      b.addEventListener("click", function () { copyText(box.querySelector("pre").innerText); });
      box.appendChild(b);
    });
  }

  // ---------------- Forest plot entrance (once) ----------------
  function forestAnim() {
    var f = document.querySelector(".forest");
    if (!f) return;
    f.querySelectorAll(".ci").forEach(function (l) {
      var len = Math.abs(+l.getAttribute("x2") - +l.getAttribute("x1")) + 2;
      l.style.setProperty("--len", len);
    });
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { f.classList.add("animate"); io.disconnect(); } });
    }, { threshold: .25 });
    io.observe(f);
  }

  // ---------------- Init ----------------
  document.addEventListener("DOMContentLoaded", function () {
    applyLang(lang());
    var sw = document.querySelector(".lang-switch");
    if (sw) sw.addEventListener("click", function () { setLang(lang() === "en" ? "es" : "en"); });
    var th = document.querySelector(".theme-toggle");
    if (th) {
      th.setAttribute("aria-pressed", root.getAttribute("data-theme") === "dark" ? "true" : "false");
      th.addEventListener("click", function () { setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark"); });
    }
    var mt = document.querySelector(".menu-toggle"), nav = document.getElementById("site-nav");
    if (mt && nav) mt.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      mt.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
    renderLinks();
    renderPubs();
    renderRepos();
    codeCopy();
    forestAnim();
  });
})();
