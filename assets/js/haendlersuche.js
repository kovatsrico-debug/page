(function () {
  "use strict";

  var ADJACENCY = {
    wien: ["noe"],
    noe: ["wien", "ooe", "steiermark", "burgenland"],
    burgenland: ["noe", "steiermark"],
    ooe: ["noe", "salzburg", "steiermark"],
    salzburg: ["ooe", "tirol", "kaernten", "steiermark"],
    tirol: ["vorarlberg", "salzburg", "kaernten"],
    vorarlberg: ["tirol"],
    steiermark: ["ooe", "noe", "burgenland", "kaernten", "salzburg"],
    kaernten: ["tirol", "salzburg", "steiermark"]
  };

  var BUNDESLAND_LABELS = {
    wien: "Wien",
    noe: "Niederösterreich",
    burgenland: "Burgenland",
    ooe: "Oberösterreich",
    salzburg: "Salzburg",
    tirol: "Tirol",
    vorarlberg: "Vorarlberg",
    steiermark: "Steiermark",
    kaernten: "Kärnten"
  };

  function classifyPlz(raw) {
    var plz = String(raw || "").trim();
    if (!/^\d{4}$/.test(plz)) return null;
    var first = plz.charAt(0);
    var firstTwo = plz.slice(0, 2);
    switch (first) {
      case "1": return "wien";
      case "2": return "noe";
      case "3": return "noe";
      case "4": return "ooe";
      case "5": return "salzburg";
      case "6": return firstTwo === "67" || firstTwo === "68" || firstTwo === "69" ? "vorarlberg" : "tirol";
      case "7": return "burgenland";
      case "8": return "steiermark";
      case "9": return firstTwo === "99" ? "tirol" : "kaernten"; // 99xx = Lienz/Osttirol, postal exception
      default: return null;
    }
  }

  function mapsUrl(dealer) {
    var q = [dealer.strasse, dealer.plz + " " + dealer.ort, "Österreich"].join(", ");
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
  }

  function dealerCard(dealer, badge, primary) {
    var el = document.createElement("article");
    el.className = "dealer-card" + (primary ? " -primary" : "");
    el.innerHTML =
      '<div class="dealer-main">' +
        '<span class="dealer-badge">' + badge + '</span>' +
        "<h3>" + dealer.name + "</h3>" +
        '<p class="dealer-meta">' + dealer.strasse + ", " + dealer.plz + " " + dealer.ort + "</p>" +
        '<p class="dealer-meta">' + dealer.telefon + " · " + dealer.email + "</p>" +
      "</div>" +
      '<div class="dealer-actions">' +
        '<a class="btn btn-primary btn-sm" href="mailto:' + dealer.email + '?subject=' + encodeURIComponent("Anfrage über kord.at") + '">Anfrage senden</a>' +
        '<a class="btn btn-ghost btn-sm" href="tel:' + dealer.telefon.replace(/\s+/g, "") + '">Anrufen</a>' +
        '<a class="btn btn-ghost btn-sm" target="_blank" rel="noopener" href="' + mapsUrl(dealer) + '">Route planen</a>' +
      "</div>";
    return el;
  }

  function init() {
    var form = document.querySelector("[data-locator-form]");
    var input = document.querySelector("[data-locator-input]");
    var errorEl = document.querySelector("[data-locator-error]");
    var resultsEl = document.querySelector("[data-locator-results]");
    var resultsHead = document.querySelector("[data-locator-head]");
    var chipList = document.querySelector("[data-bl-chips]");
    var mapNodes = document.querySelectorAll(".bl-node");
    if (!form || !resultsEl) return;

    var dealersByBl = {};

    fetch("/assets/data/haendler.json")
      .then(function (res) { return res.json(); })
      .then(function (dealers) {
        dealers.forEach(function (d) { dealersByBl[d.bundeslandKey] = d; });
        buildChips();
        var params = new URLSearchParams(window.location.search);
        var plzParam = params.get("plz");
        if (plzParam) {
          input.value = plzParam;
          runSearch(plzParam);
        }
      })
      .catch(function () {
        resultsEl.innerHTML = '<div class="empty-state">Händlerdaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut oder rufen Sie uns unter +43 664 846 74 00 an.</div>';
      });

    function buildChips() {
      if (!chipList) return;
      Object.keys(BUNDESLAND_LABELS).forEach(function (key) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "bl-chip";
        chip.textContent = BUNDESLAND_LABELS[key];
        chip.dataset.bl = key;
        chip.addEventListener("click", function () { selectBundesland(key); });
        chipList.appendChild(chip);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      runSearch(input.value);
    });

    mapNodes.forEach(function (node) {
      node.addEventListener("click", function () {
        selectBundesland(node.dataset.bl);
      });
      node.setAttribute("tabindex", "0");
      node.setAttribute("role", "button");
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectBundesland(node.dataset.bl); }
      });
    });

    function runSearch(rawPlz) {
      var bl = classifyPlz(rawPlz);
      if (!bl) {
        errorEl.textContent = "Bitte geben Sie eine gültige 4-stellige österreichische Postleitzahl ein.";
        resultsEl.innerHTML = "";
        resultsHead.textContent = "";
        clearHighlights();
        return;
      }
      errorEl.textContent = "";
      selectBundesland(bl);
    }

    function selectBundesland(bl) {
      if (!BUNDESLAND_LABELS[bl]) return;
      clearHighlights();
      highlightNode(bl, "active");
      (ADJACENCY[bl] || []).forEach(function (n) { highlightNode(n, "neighbor"); });
      setActiveChip(bl);
      renderResults(bl);
    }

    function clearHighlights() {
      mapNodes.forEach(function (n) { n.classList.remove("active", "neighbor"); });
      if (chipList) chipList.querySelectorAll(".bl-chip").forEach(function (c) { c.classList.remove("active"); });
    }

    function highlightNode(bl, cls) {
      var node = document.querySelector('.bl-node[data-bl="' + bl + '"]');
      if (node) node.classList.add(cls);
    }

    function setActiveChip(bl) {
      if (!chipList) return;
      var chip = chipList.querySelector('.bl-chip[data-bl="' + bl + '"]');
      if (chip) chip.classList.add("active");
    }

    function renderResults(bl) {
      resultsEl.innerHTML = "";
      var primary = dealersByBl[bl];
      resultsHead.textContent = "Ihr Händlernetz für " + BUNDESLAND_LABELS[bl];
      if (primary) {
        resultsEl.appendChild(dealerCard(primary, "Ihr Händler", true));
      } else {
        var empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "Für " + BUNDESLAND_LABELS[bl] + " ist aktuell kein Händler hinterlegt. Kontaktieren Sie uns direkt: +43 664 846 74 00.";
        resultsEl.appendChild(empty);
      }
      (ADJACENCY[bl] || []).forEach(function (n) {
        var dealer = dealersByBl[n];
        if (dealer) resultsEl.appendChild(dealerCard(dealer, "Nachbarregion · " + BUNDESLAND_LABELS[n], false));
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
