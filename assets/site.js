(function () {
  "use strict";

  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------------
     Quantity scaling
     ------------------------------------------------------------------ */
  var GLYPH = { "½":.5, "⅓":1/3, "⅔":2/3, "¼":.25, "¾":.75, "⅛":.125, "⅜":.375, "⅝":.625, "⅞":.875 };
  var LEAD = /^(\d+\s*[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\s+\d+\/\d+|\d+\/\d+|[½⅓⅔¼¾⅛⅜⅝⅞]|\d*\.\d+|\d+)(\s|$)/;

  function parseQty(t) {
    t = t.trim();
    var m = t.match(/^(\d+)\s*([½⅓⅔¼¾⅛⅜⅝⅞])$/);
    if (m) return +m[1] + GLYPH[m[2]];
    if (GLYPH[t] !== undefined) return GLYPH[t];
    m = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (m) return +m[1] + +m[2] / +m[3];
    m = t.match(/^(\d+)\/(\d+)$/);
    if (m) return +m[1] / +m[2];
    return parseFloat(t);
  }

  var FRACS = [[1,2,"½"],[1,3,"⅓"],[2,3,"⅔"],[1,4,"¼"],[3,4,"¾"],[1,8,"⅛"],[3,8,"⅜"],[5,8,"⅝"],[7,8,"⅞"]];

  function formatQty(n) {
    if (!isFinite(n) || n <= 0) return "";
    var whole = Math.floor(n + 1e-9), rem = n - whole, best = null;
    FRACS.forEach(function (f) {
      var d = Math.abs(rem - f[0] / f[1]);
      if (d < 0.035 && (!best || d < best.d)) best = { d: d, g: f[2] };
    });
    if (rem < 0.035) return String(whole);
    if (best) return whole ? whole + best.g : best.g;
    return String(Math.round(n * 100) / 100);
  }

  /* ------------------------------------------------------------------
     Recipe page: columns, checkable lines, scaler
     ------------------------------------------------------------------ */
  var article = document.querySelector(".recipe");
  var prose = article && article.querySelector(".prose");

  if (prose) {
    // Group the rendered Markdown by <h2>
    var groups = [], current = null;
    Array.prototype.slice.call(prose.children).forEach(function (el) {
      if (el.tagName === "H2") { current = { head: el, nodes: [] }; groups.push(current); }
      else if (current) { current.nodes.push(el); }
      else { current = { head: null, nodes: [el] }; groups.push(current); }
    });

    var ingredientGroup = groups.filter(function (g) {
      return g.head && /ingredient/i.test(g.head.textContent);
    })[0];

    if (ingredientGroup && groups.length > 1) {
      var cols = document.createElement("div");
      cols.className = "cols";
      var left = document.createElement("div");
      left.className = "col-left";
      var right = document.createElement("div");
      right.className = "col-right";
      cols.appendChild(left);
      cols.appendChild(right);

      groups.forEach(function (g) {
        var target = g === ingredientGroup ? left : right;
        if (g.head) target.appendChild(g.head);
        g.nodes.forEach(function (n) { target.appendChild(n); });
      });
      prose.appendChild(cols);
    }

    // Ingredients become checkable, with their quantity remembered for scaling
    // Every list under the Ingredients heading counts — sub-recipes get their own.
    var ingLists = ingredientGroup
      ? ingredientGroup.nodes.filter(function (n) { return n.tagName === "UL"; })
      : [];
    var ingItems = [];

    ingLists.forEach(function (ingList) {
      ingList.classList.add("checklist");
      Array.prototype.slice.call(ingList.children).forEach(function (li) {
        ingItems.push(li);
        li.dataset.original = li.textContent.trim();
        li.innerHTML = '<button class="check" aria-pressed="false"><span class="box"></span><span class="txt">' +
          li.innerHTML + "</span></button>";
      });
    });

    // Method steps become checkable
    groups.forEach(function (g) {
      if (g === ingredientGroup) return;
      g.nodes.forEach(function (n) {
        if (n.tagName !== "OL") return;
        n.classList.add("steps");
        Array.prototype.slice.call(n.children).forEach(function (li) {
          li.innerHTML = '<button class="check" aria-pressed="false"><span class="box"></span><span class="txt">' +
            li.innerHTML + "</span></button>";
        });
      });
    });

    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".check");
      if (!b) return;
      b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
    });

    // Servings scaler
    var base = parseFloat(article.dataset.servings);
    if (ingLists.length && isFinite(base) && base > 0) {
      var servings = base;
      var step = base >= 4 ? 2 : 1;
      var label = function (n) { return n + (n === 1 ? " serving" : " servings"); };

      var scaler = document.createElement("div");
      scaler.className = "scaler";
      scaler.innerHTML = '<button type="button" data-d="-1" aria-label="Fewer servings">–</button>' +
        "<output>" + label(base) + "</output>" +
        '<button type="button" data-d="1" aria-label="More servings">+</button>';
      ingLists[0].parentNode.insertBefore(scaler, ingLists[0]);

      var out = scaler.querySelector("output");
      var factField = document.getElementById("servings");

      var apply = function () {
        var factor = servings / base;
        ingItems.forEach(function (li) {
          var text = li.dataset.original || "";
          var txt = li.querySelector(".txt");
          var m = text.match(LEAD);
          if (!m) return;
          var n = parseQty(m[1]);
          if (!isFinite(n)) return;
          var q = formatQty(n * factor);
          if (!q) return;
          var rest = text.slice(m[1].length).replace(/^\s+/, "");
          txt.innerHTML = '<span class="qty">' + escape(q) + "</span> " + escape(rest);
        });
        out.textContent = label(servings);
        if (factField) factField.textContent = label(servings);
      };

      apply();

      scaler.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b) return;
        var next = servings + (+b.dataset.d) * step;
        if (next < 1) return;
        servings = next;
        apply();
      });
    }
  }

  /* ------------------------------------------------------------------
     Search
     ------------------------------------------------------------------ */
  var input = document.getElementById("search");
  var results = document.getElementById("results");
  var main = document.getElementById("main");
  var indexEl = document.getElementById("search-index");

  if (input && results && main && indexEl) {
    var INDEX = [];
    try { INDEX = JSON.parse(indexEl.textContent); } catch (err) { INDEX = []; }

    var esc = escape;

    var run = function () {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        results.hidden = true;
        results.innerHTML = "";
        main.hidden = false;
        return;
      }
      var hits = INDEX.filter(function (r) {
        return (r.t + " " + r.s + " " + r.sec + " " + r.x).toLowerCase().indexOf(q) > -1;
      });
      main.hidden = true;
      results.hidden = false;
      results.innerHTML = "<h2>" + hits.length + (hits.length === 1 ? " recipe" : " recipes") + " matching “" + esc(input.value.trim()) + "”</h2>" +
        (hits.length
          ? '<ul class="index">' + hits.map(function (r) {
              return '<li><a href="' + esc(r.u) + '"><span class="row"><span class="name">' + esc(r.t) +
                '</span><span class="dots"></span><span class="meta">' + esc(r.sec) + "</span></span>" +
                (r.s ? '<span class="sub">' + esc(r.s) + "</span>" : "") + "</a></li>";
            }).join("") + "</ul>"
          : '<p class="empty">Nothing yet. Try an ingredient instead of a dish name.</p>');
    };

    input.addEventListener("input", run);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { input.value = ""; run(); input.blur(); }
    });
    if (input.value) run();
  }
})();
