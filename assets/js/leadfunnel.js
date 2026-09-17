(function () {
  "use strict";

  var TOTAL_STEPS = 4;
  var TYPE_LABELS = {
    fachhandel: "Fachhandel",
    tischlerei: "Tischlerei / Fensterbau",
    onlinehaendler: "Onlinehändler",
    sonstige: "Sonstiges"
  };
  var VOLUME_LABELS = {
    klein: "bis 20 Einheiten / Jahr",
    mittel: "20–100 Einheiten / Jahr",
    gross: "über 100 Einheiten / Jahr",
    unklar: "noch unklar"
  };
  var TIMEFRAME_LABELS = {
    sofort: "sofort",
    "3monate": "innerhalb 3 Monate",
    unklar: "noch offen"
  };
  var INTEREST_LABELS = {
    fenster: "Fenster-Systeme",
    tuer: "Tür-Systeme",
    plissee: "Plissee-Linie",
    pollenschutz: "Pollenschutz-Gewebe"
  };

  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function init() {
    var root = qs("[data-funnel]");
    if (!root) return;

    var state = { step: 1, data: { interessen: [] } };
    var steps = qsa(".funnel-step", root);
    var dots = qsa(".step-dot", root);
    var backBtn = qs("[data-funnel-back]", root);
    var nextBtn = qs("[data-funnel-next]", root);
    var submitBtn = qs("[data-funnel-submit]", root);

    function syncOptionCards() {
      qsa(".option-card", root).forEach(function (card) {
        var input = card.querySelector("input");
        card.classList.toggle("checked", !!(input && input.checked));
      });
    }
    root.addEventListener("change", syncOptionCards);

    function showStep(n) {
      steps.forEach(function (s) { s.classList.toggle("active", Number(s.dataset.step) === n); });
      dots.forEach(function (d, i) {
        d.classList.toggle("done", i + 1 < n);
        d.classList.toggle("active", i + 1 === n);
      });
      backBtn.style.visibility = n === 1 ? "hidden" : "visible";
      nextBtn.style.display = n === TOTAL_STEPS ? "none" : "inline-flex";
      submitBtn.style.display = n === TOTAL_STEPS ? "inline-flex" : "none";
      if (n === TOTAL_STEPS) renderSummary();
    }

    function setError(fieldName, message) {
      var el = qs('[data-error-for="' + fieldName + '"]', root);
      if (el) el.textContent = message || "";
    }

    function validateStep(n) {
      var ok = true;
      if (n === 1) {
        var typ = qs('input[name="typ"]:checked', root);
        if (!typ) { setError("typ", "Bitte wählen Sie eine Option."); ok = false; }
        else setError("typ", "");
      }
      if (n === 2) {
        [
          ["firma", "Bitte Firmennamen angeben."],
          ["ansprechpartner", "Bitte Ansprechpartner angeben."],
          ["ort", "Bitte Ort angeben."],
          ["telefon", "Bitte Telefonnummer angeben."]
        ].forEach(function (pair) {
          var input = qs('[name="' + pair[0] + '"]', root);
          if (!input.value.trim()) { setError(pair[0], pair[1]); ok = false; }
          else setError(pair[0], "");
        });
        var plz = qs('[name="plz"]', root);
        if (!/^\d{4}$/.test(plz.value.trim())) { setError("plz", "Bitte 4-stellige PLZ angeben."); ok = false; }
        else setError("plz", "");
        var email = qs('[name="email"]', root);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setError("email", "Bitte gültige E-Mail-Adresse angeben."); ok = false; }
        else setError("email", "");
      }
      if (n === 3) {
        var anyChecked = qsa('input[name="interesse"]:checked', root).length > 0;
        if (!anyChecked) { setError("interesse", "Bitte mindestens einen Produktbereich wählen."); ok = false; }
        else setError("interesse", "");
        var volumen = qs('[name="volumen"]', root);
        if (!volumen.value) { setError("volumen", "Bitte auswählen."); ok = false; }
        else setError("volumen", "");
        var zeitrahmen = qs('[name="zeitrahmen"]', root);
        if (!zeitrahmen.value) { setError("zeitrahmen", "Bitte auswählen."); ok = false; }
        else setError("zeitrahmen", "");
      }
      if (n === 4) {
        var consent = qs('[name="consent"]', root);
        if (!consent.checked) { setError("consent", "Bitte bestätigen Sie die Kontaktaufnahme."); ok = false; }
        else setError("consent", "");
      }
      return ok;
    }

    function collect() {
      var d = state.data;
      var typEl = qs('input[name="typ"]:checked', root);
      d.typ = typEl ? typEl.value : "";
      ["firma", "ansprechpartner", "plz", "ort", "telefon", "email", "nachricht"].forEach(function (name) {
        var el = qs('[name="' + name + '"]', root);
        if (el) d[name] = el.value.trim();
      });
      d.interessen = qsa('input[name="interesse"]:checked', root).map(function (i) { return i.value; });
      d.volumen = qs('[name="volumen"]', root).value;
      d.zeitrahmen = qs('[name="zeitrahmen"]', root).value;
      return d;
    }

    function renderSummary() {
      var d = collect();
      var rows = [
        ["Unternehmensart", TYPE_LABELS[d.typ] || "–"],
        ["Firma", d.firma],
        ["Ansprechpartner", d.ansprechpartner],
        ["Ort", d.plz + " " + d.ort],
        ["Telefon", d.telefon],
        ["E-Mail", d.email],
        ["Interesse", (d.interessen || []).map(function (i) { return INTEREST_LABELS[i]; }).join(", ") || "–"],
        ["Jahresvolumen", VOLUME_LABELS[d.volumen] || "–"],
        ["Zeitrahmen", TIMEFRAME_LABELS[d.zeitrahmen] || "–"]
      ];
      var list = qs("[data-summary-list]", root);
      list.innerHTML = rows.map(function (r) {
        return '<div class="summary-row"><dt>' + r[0] + "</dt><dd>" + (r[1] || "–") + "</dd></div>";
      }).join("");
    }

    function buildEmailText(d) {
      return [
        "Neue Partneranfrage über kord.at",
        "",
        "Unternehmensart: " + (TYPE_LABELS[d.typ] || "-"),
        "Firma: " + d.firma,
        "Ansprechpartner: " + d.ansprechpartner,
        "Adresse: " + d.plz + " " + d.ort,
        "Telefon: " + d.telefon,
        "E-Mail: " + d.email,
        "Interesse: " + (d.interessen || []).map(function (i) { return INTEREST_LABELS[i]; }).join(", "),
        "Geschätztes Jahresvolumen: " + (VOLUME_LABELS[d.volumen] || "-"),
        "Gewünschter Zeitrahmen: " + (TIMEFRAME_LABELS[d.zeitrahmen] || "-"),
        "",
        "Nachricht:",
        d.nachricht || "(keine)"
      ].join("\n");
    }

    backBtn.addEventListener("click", function () {
      if (state.step > 1) { state.step--; showStep(state.step); }
    });

    nextBtn.addEventListener("click", function () {
      if (!validateStep(state.step)) return;
      collect();
      if (state.step < TOTAL_STEPS) { state.step++; showStep(state.step); }
    });

    submitBtn.addEventListener("click", function () {
      if (!validateStep(4)) return;
      var d = collect();
      var text = buildEmailText(d);
      var mailto = "mailto:partner@kord.at?subject=" + encodeURIComponent("Neue Partneranfrage – " + d.firma) + "&body=" + encodeURIComponent(text);

      root.querySelector(".funnel-progress").style.display = "none";
      steps.forEach(function (s) { s.classList.remove("active"); });
      var success = qs("[data-funnel-success]", root);
      success.classList.add("active");
      qs("[data-summary-text]", success).textContent = text;
      backBtn.style.display = "none";
      nextBtn.style.display = "none";
      submitBtn.style.display = "none";

      window.location.href = mailto;

      var copyBtn = qs("[data-copy-btn]", success);
      copyBtn.addEventListener("click", function () {
        var box = qs("[data-summary-text]", success);
        var done = function () { copyBtn.textContent = "Kopiert ✓"; setTimeout(function () { copyBtn.textContent = "Text kopieren"; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(box.textContent).then(done).catch(function () { selectText(box); });
        } else {
          selectText(box);
        }
      });
    });

    function selectText(el) {
      var range = document.createRange();
      range.selectNodeContents(el);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }

    syncOptionCards();
    showStep(1);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
