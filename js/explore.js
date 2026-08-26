/* The rikishi directory: filter, sort, and the detail sheet. */
(function (global) {
  "use strict";

  var el = {};
  var all = [];
  var division = "all";
  var query = "";
  var sortKey = "rank";
  var lastFocus = null;

  function $(id) { return document.getElementById(id); }

  /* ---------- filtering ---------- */

  function haystack(rikishi) {
    return [
      rikishi.name, rikishi.nameJa, rikishi.reading, rikishi.fullName,
      rikishi.realName, rikishi.realNameJa, rikishi.stable, rikishi.stableJa,
      rikishi.birthplace, rikishi.birthplaceJa, rikishi.rank, rikishi.rankJa,
      rikishi.technique, rikishi.techniqueJa
    ].join(" ").toLowerCase();
  }

  function visible() {
    var needle = query.trim().toLowerCase();
    var list = all.filter(function (rikishi) {
      if (division !== "all" && rikishi.division !== division) return false;
      return !needle || haystack(rikishi).indexOf(needle) !== -1;
    });

    var lang = I18N.lang;
    list.sort(function (a, b) {
      switch (sortKey) {
        case "name":
          return SumoData.nameOf(a, lang).localeCompare(SumoData.nameOf(b, lang), lang);
        case "weight":
          return SumoData.numberOf(b.weight) - SumoData.numberOf(a.weight);
        case "height":
          return SumoData.numberOf(b.height) - SumoData.numberOf(a.height);
        case "age":
          return (SumoData.ageOf(b) || 0) - (SumoData.ageOf(a) || 0);
        default:
          return SumoData.rankValue(a) - SumoData.rankValue(b);
      }
    });
    return list;
  }

  /* ---------- roster ---------- */

  function card(rikishi) {
    var lang = I18N.lang;
    var item = document.createElement("li");
    var button = document.createElement("button");
    button.type = "button";
    button.className = "card";

    var img = document.createElement("img");
    img.className = "card__img";
    img.src = rikishi.image;
    img.alt = SumoData.nameOf(rikishi, lang);
    img.loading = "lazy";
    img.decoding = "async";

    var body = document.createElement("div");
    body.className = "card__body";

    var rank = document.createElement("span");
    rank.className = "card__rank" + (SumoData.isTopRank(rikishi) ? " is-top" : "");
    rank.textContent = SumoData.rankBadge(rikishi, lang);

    var name = document.createElement("div");
    name.className = "card__name";
    name.textContent = SumoData.nameOf(rikishi, lang);

    var sub = document.createElement("div");
    sub.className = "card__sub";
    sub.textContent = SumoData.subNameOf(rikishi, lang);

    body.append(rank, name, sub);
    button.append(img, body);
    button.addEventListener("click", function () { SumoCard.open(rikishi, button); });
    item.appendChild(button);
    return item;
  }

  function render() {
    var list = visible();
    el.roster.innerHTML = "";
    list.forEach(function (rikishi) { el.roster.appendChild(card(rikishi)); });
    el.empty.hidden = list.length > 0;
    el.resultCount.textContent = I18N.tf("showing", list.length, all.length);
  }

  /* ---------- wiring ---------- */

  function bind() {
    el.search.addEventListener("input", function () {
      query = el.search.value;
      render();
    });

    el.dirDivision.addEventListener("click", function (event) {
      var button = event.target.closest(".segmented__btn");
      if (!button) return;
      division = button.dataset.division;
      el.dirDivision.querySelectorAll(".segmented__btn").forEach(function (node) {
        node.classList.toggle("is-active", node === button);
      });
      render();
    });

    el.sort.addEventListener("change", function () {
      sortKey = el.sort.value;
      render();
    });

    // The card manages its own sheet, including its own re-render on a language flip.
    I18N.onChange(render);
  }

  function init() {
    I18N.init();
    SumoCard.init();
    ["search", "dirDivision", "sort", "roster", "empty", "resultCount"].forEach(function (id) {
      el[id] = $(id);
    });

    SumoData.load().then(function (wrestlers) {
      all = wrestlers;
      render();
      bind();
    }).catch(function (error) {
      el.empty.hidden = false;
      el.empty.textContent = I18N.t("loadError");
      console.error(error);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
