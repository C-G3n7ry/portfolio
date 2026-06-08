/* ============================================================================
   g3n7ry.com — interactions
   Boot sequence · scroll reveals · cursor-tracked ember · live RSS pull
   No dependencies. Degrades gracefully (and honours reduced-motion).
   ========================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* — current year in footer — */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ─────────────────────── Boot sequence ─────────────────────── */
  const boot = $("#boot");
  const stream = $("#boot-stream");
  const skip = $("#boot-skip");
  const body = document.body;

  const finishBoot = () => {
    if (!body.hasAttribute("data-booting")) return;
    body.removeAttribute("data-booting");
    if (boot) {
      boot.addEventListener(
        "transitionend",
        () => boot.setAttribute("hidden", ""),
        { once: true }
      );
    }
  };

  const bootLines = [
    { t: "g3n7ry@console:~$ ./identity --load", cls: "" },
    { t: "  resolving entity ............ Christopher Gentry", cls: "" },
    { t: "  location .................... Rapid City, SD", cls: "" },
    { t: "  disciplines ................. [ writer, builder ]", cls: "" },
    { t: "  archive ..................... christopher-gentry.com", cls: "" },
    { t: "  status ...................... [ OK ]", cls: "ok" },
    { t: "  launching console", cls: "dimln" },
  ];

  const runBoot = () => {
    if (!boot || !stream) return finishBoot();

    // Respect reduced-motion: print everything at once, then dismiss quickly.
    if (reduceMotion) {
      stream.textContent = bootLines.map((l) => l.t).join("\n");
      setTimeout(finishBoot, 350);
      return;
    }

    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      setTimeout(finishBoot, 420);
    };

    let li = 0;
    const caret = document.createElement("span");
    caret.className = "boot__caret";

    const typeLine = () => {
      if (li >= bootLines.length) return end();
      const line = bootLines[li];
      const span = document.createElement("span");
      if (line.cls) span.className = line.cls;
      stream.appendChild(span);
      stream.appendChild(caret);

      let ci = 0;
      // first line types char-by-char; the rest stream faster for rhythm
      const speed = li === 0 ? 34 : 9;
      const tick = () => {
        span.textContent = line.t.slice(0, ci);
        ci += 1;
        if (ci <= line.t.length) {
          setTimeout(tick, speed + (li === 0 ? Math.random() * 26 : 0));
        } else {
          stream.appendChild(document.createTextNode("\n"));
          li += 1;
          setTimeout(typeLine, li === 1 ? 240 : 150);
        }
      };
      tick();
    };

    // safety: never trap the user behind the boot screen
    const failsafe = setTimeout(finishBoot, 6000);
    boot.addEventListener("transitionstart", () => clearTimeout(failsafe), { once: true });

    typeLine();
  };

  const dismiss = () => finishBoot();
  if (skip) skip.addEventListener("click", dismiss);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Escape") dismiss();
  });
  window.addEventListener("wheel", dismiss, { passive: true, once: true });
  window.addEventListener("touchmove", dismiss, { passive: true, once: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runBoot);
  } else {
    runBoot();
  }

  /* ─────────────────────── Scroll reveals ────────────────────── */
  const revealEls = Array.from(document.querySelectorAll("[data-reveal]"));
  revealEls.forEach((el, i) => {
    const d = el.dataset.delay;
    if (d) el.style.setProperty("--d", d);
    else el.style.setProperty("--d", String(i % 4));
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ───────────────── Cursor-tracked ember glow ───────────────── */
  const glow = $(".ember-glow");
  if (glow && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    let raf = 0;
    window.addEventListener("pointermove", (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        glow.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
        glow.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
        raf = 0;
      });
    });
  }

  /* ─────────────── Sticky topbar shadow on scroll ────────────── */
  const topbar = $(".topbar");
  if (topbar) {
    const onScroll = () => topbar.classList.toggle("is-stuck", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ──────────────── Live latest-post from the blog ───────────── */
  // Pulls the newest item from the Rapid City History RSS feed so this hub
  // always reflects the most recent writing. Fails silently to a sane default.
  const FEED = "https://christopher-gentry.com/rss.xml";
  const latestWrap = $("#latest");
  const latestLink = $("#latest-link");
  const latestTitle = $("#latest-title");
  const latestDate = $("#latest-date");
  const feedStatus = $("#feed-status");

  if (latestWrap) latestWrap.classList.add("is-loading");

  const markStale = () => {
    if (latestTitle) latestTitle.textContent = "Read the latest on the blog";
    if (latestWrap) latestWrap.classList.remove("is-loading");
    if (feedStatus) {
      feedStatus.classList.add("is-stale");
      feedStatus.childNodes[feedStatus.childNodes.length - 1].textContent = " archive";
    }
  };

  const fmtDate = (d) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(d);
    } catch {
      return "";
    }
  };

  if (latestWrap && "fetch" in window) {
    fetch(FEED, { mode: "cors" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((xml) => {
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        if (doc.querySelector("parsererror")) throw new Error("parse");
        const item = doc.querySelector("item");
        if (!item) throw new Error("empty");

        const title = (item.querySelector("title")?.textContent || "").trim();
        const link = (item.querySelector("link")?.textContent || "").trim();
        const pub = item.querySelector("pubDate")?.textContent;

        if (!title) throw new Error("notitle");

        if (latestTitle) latestTitle.textContent = title;
        if (link && latestLink) latestLink.href = link;
        if (pub && latestDate) {
          const d = new Date(pub);
          if (!Number.isNaN(d.getTime())) latestDate.textContent = fmtDate(d);
        }
        if (latestWrap) latestWrap.classList.remove("is-loading");
      })
      .catch(markStale);
  } else {
    markStale();
  }
})();
