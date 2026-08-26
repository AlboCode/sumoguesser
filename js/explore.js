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
    button.addEventListener("click", function () { openSheet(rikishi, button); });
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

  /* ---------- detail sheet ---------- */

  function fact(label, value) {
    if (!value) return null;
    var row = document.createElement("li");
    var key = document.createElement("span");
    key.className = "facts__k";
    key.textContent = label;
    var val = document.createElement("span");
    val.className = "facts__v";
    val.textContent = value;
    row.append(key, val);
    return row;
  }

  function detailBody(rikishi) {
    var lang = I18N.lang;
    var frag = document.createDocumentFragment();

    var top = document.createElement("div");
    top.className = "detail__top";

    var figure = document.createElement("div");
    figure.className = "detail__img";
    var img = document.createElement("img");
    img.src = rikishi.image;
    img.alt = SumoData.nameOf(rikishi, lang);
    figure.appendChild(img);

    var head = document.createElement("div");
    head.className = "detail__head";

    var rank = document.createElement("span");
    rank.className = "detail__rank" + (SumoData.isTopRank(rikishi) ? " is-top" : "");
    rank.textContent = SumoData.rankLabel(rikishi, lang);

    var name = document.createElement("h2");
    name.className = "detail__name";
    name.id = "sheetName";
    name.textContent = SumoData.nameOf(rikishi, lang);

    var reading = document.createElement("p");
    reading.className = "detail__reading";
    reading.textContent = lang === "ja"
      ? (rikishi.reading || "") + "　" + rikishi.name
      : (rikishi.nameJa || "") + (rikishi.reading ? " · " + rikishi.reading : "");

    var facts = document.createElement("ul");
    facts.className = "facts";
    [
      [I18N.t("fHighest"), SumoData.highestRank(rikishi, lang)],
      [I18N.t("fStable"), SumoData.stableOf(rikishi, lang)],
      [I18N.t("fRealName"), lang === "ja" ? rikishi.realNameJa : rikishi.realName],
      [I18N.t("fBirthday"), lang === "ja" ? rikishi.birthdayJa : birthdayEn(rikishi)],
      [I18N.t("fBirthplace"), SumoData.birthplaceOf(rikishi, lang)],
      [I18N.t("fHeight"), rikishi.height],
      [I18N.t("fWeight"), rikishi.weight],
      [I18N.t("fTechnique"), lang === "ja" ? rikishi.techniqueJa : rikishi.technique],
      [I18N.t("fDebut"), SumoData.debut(rikishi, lang)]
    ].forEach(function (pair) {
      var row = fact(pair[0], pair[1]);
      if (row) facts.appendChild(row);
    });

    head.append(rank, name, reading, facts);
    top.append(figure, head);

    var honours = document.createElement("div");
    honours.className = "honours";
    var title = document.createElement("h3");
    title.className = "section-title";
    title.textContent = I18N.t("honoursTitle");
    honours.appendChild(title);

    var keys = Object.keys(rikishi.awards || {});
    if (keys.length) {
      var list = document.createElement("ul");
      list.className = "honours__list";
      keys.forEach(function (key) {
        var award = rikishi.awards[key];
        var badge = document.createElement("li");
        badge.className = "honour";
        var count = document.createElement("b");
        count.textContent = award.count;
        badge.append(document.createTextNode(lang === "ja" ? award.ja : award.en), count);
        list.appendChild(badge);
      });
      honours.appendChild(list);
    } else {
      var none = document.createElement("p");
      none.className = "honours__none";
      none.textContent = I18N.t("noHonours");
      honours.appendChild(none);
    }

    var link = document.createElement("a");
    link.className = "detail__link";
    link.href = lang === "ja" ? rikishi.profileUrlJa : rikishi.profileUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = I18N.t("officialLink");

    frag.append(top, honours, link);
    return frag;
  }

  /** "May 22, 1999 (27)" — the age the Japanese page shows, for the English one. */
  function birthdayEn(rikishi) {
    var age = SumoData.ageOf(rikishi);
    return rikishi.birthday + (age === null ? "" : " (" + age + ")");
  }

  var openRikishi = null;

  function openSheet(rikishi, trigger) {
    openRikishi = rikishi;
    lastFocus = trigger || null;
    el.sheetBody.innerHTML = "";
    el.sheetBody.appendChild(detailBody(rikishi));
    el.sheet.hidden = false;
    document.body.style.overflow = "hidden";
    el.sheetClose.focus();
  }

  function closeSheet() {
    openRikishi = null;
    el.sheet.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
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

    el.sheetScrim.addEventListener("click", closeSheet);
    el.sheetClose.addEventListener("click", closeSheet);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !el.sheet.hidden) closeSheet();
    });

    I18N.onChange(function () {
      render();
      if (openRikishi) {
        el.sheetBody.innerHTML = "";
        el.sheetBody.appendChild(detailBody(openRikishi));
      }
    });
  }

  function init() {
    I18N.init();
    ["search", "dirDivision", "sort", "roster", "empty", "resultCount",
     "sheet", "sheetScrim", "sheetClose", "sheetBody"].forEach(function (id) {
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
