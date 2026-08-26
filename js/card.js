/* The rikishi card — a full profile in a modal sheet.
   Shared by the directory and the quiz's end-of-game bout list. */
(function (global) {
  "use strict";

  var sheet, scrim, closeButton, body;
  var openRikishi = null;
  var lastFocus = null;

  /* ---------- the card itself ---------- */

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

  /** "May 22, 1999 (27)" — the age the Japanese page shows, for the English one. */
  function birthdayEn(rikishi) {
    var age = SumoData.ageOf(rikishi);
    return rikishi.birthday + (age === null ? "" : " (" + age + ")");
  }

  function honours(rikishi, lang) {
    var section = document.createElement("div");
    section.className = "honours";

    var title = document.createElement("h3");
    title.className = "section-title";
    title.textContent = I18N.t("honoursTitle");
    section.appendChild(title);

    var keys = Object.keys(rikishi.awards || {});
    if (!keys.length) {
      var none = document.createElement("p");
      none.className = "honours__none";
      none.textContent = I18N.t("noHonours");
      section.appendChild(none);
      return section;
    }

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
    section.appendChild(list);
    return section;
  }

  /** The whole card, as a fragment. */
  function render(rikishi, lang) {
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

    var link = document.createElement("a");
    link.className = "detail__link";
    link.href = lang === "ja" ? rikishi.profileUrlJa : rikishi.profileUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = I18N.t("officialLink");

    frag.append(top, honours(rikishi, lang), link);
    return frag;
  }

  /* ---------- the sheet around it ---------- */

  function paint() {
    body.innerHTML = "";
    body.appendChild(render(openRikishi, I18N.lang));
  }

  function open(rikishi, trigger) {
    if (!sheet) return;
    openRikishi = rikishi;
    lastFocus = trigger || null;
    paint();
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function close() {
    if (!sheet || sheet.hidden) return;
    openRikishi = null;
    sheet.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  /** Wire up the sheet markup; safe to call on a page without it. */
  function init() {
    sheet = document.getElementById("sheet");
    if (!sheet) return;
    scrim = document.getElementById("sheetScrim");
    closeButton = document.getElementById("sheetClose");
    body = document.getElementById("sheetBody");

    scrim.addEventListener("click", close);
    closeButton.addEventListener("click", close);
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
    I18N.onChange(function () {
      if (openRikishi) paint();
    });
  }

  global.SumoCard = { init: init, open: open, close: close, render: render };
})(window);
