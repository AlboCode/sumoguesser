/* Loading and shaping the rikishi records both pages share. */
(function (global) {
  "use strict";

  var DATA_URL = "data/rikishi.json";

  /* Banzuke order, highest first, so lists sort the way a real banzuke reads. */
  var RANK_ORDER = ["Yokozuna", "Ozeki", "Sekiwake", "Komusubi", "Maegashira", "Juryo"];

  var RANK_JA = {
    Yokozuna: "横綱",
    Ozeki: "大関",
    Sekiwake: "関脇",
    Komusubi: "小結",
    Maegashira: "前頭",
    Juryo: "十両"
  };

  /** Sortable weight for "Maegashira #7" style ranks: division first, then number. */
  function rankValue(rikishi) {
    var rank = rikishi.rank || "";
    var title = rank.replace(/#.*$/, "").trim();
    var index = RANK_ORDER.indexOf(title);
    var number = rank.match(/#(\d+)/);
    var side = /^West/.test(rikishi.banzukeRank) ? 0.5 : 0;
    return (index < 0 ? RANK_ORDER.length : index) * 100 +
      (number ? parseInt(number[1], 10) : 0) + side;
  }

  function isTopRank(rikishi) {
    return rankValue(rikishi) < 400; // yokozuna through komusubi
  }

  /** "May 22, 1999" -> age in whole years, or null when unparseable. */
  function ageOf(rikishi) {
    var born = new Date(rikishi.birthday);
    if (isNaN(born.getTime())) return null;
    var now = new Date();
    var age = now.getFullYear() - born.getFullYear();
    var monthDelta = now.getMonth() - born.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age--;
    return age;
  }

  function numberOf(value) {
    var match = String(value || "").match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }

  /** The full banzuke rank, side included: "East Yokozuna" / "東横綱". */
  function rankLabel(rikishi, lang) {
    if (lang === "ja") return rikishi.rankJa || rikishi.rank || "";
    return rikishi.banzukeRank || rikishi.rank || "";
  }

  /** Short rank badge — "M7" / "前7" — for the compact directory cards. */
  function rankBadge(rikishi, lang) {
    var rank = rikishi.rank || "";
    var title = rank.replace(/#.*$/, "").trim();
    var number = rank.match(/#(\d+)/);
    if (lang === "ja") {
      var ja = RANK_JA[title] || title;
      return number ? ja + number[1] : ja;
    }
    if (title === "Maegashira") return number ? "M" + number[1] : "M";
    if (title === "Juryo") return number ? "J" + number[1] : "J";
    return title;
  }

  function nameOf(rikishi, lang) {
    if (lang === "ja") return rikishi.nameJa || rikishi.name;
    return rikishi.name;
  }

  /** The second line under a name: the other script's version of it. */
  function subNameOf(rikishi, lang) {
    return lang === "ja" ? rikishi.name : rikishi.nameJa || "";
  }

  function stableOf(rikishi, lang) {
    return (lang === "ja" ? rikishi.stableJa : rikishi.stable) || rikishi.stable || "";
  }

  function birthplaceOf(rikishi, lang) {
    return (lang === "ja" ? rikishi.birthplaceJa : rikishi.birthplace) || rikishi.birthplace || "";
  }


  /* ---------- rendering the Japanese-only fields in English ---------- */

  var KANJI_DIGITS = {
    "〇": 0, "一": 1, "二": 2, "三": 3, "四": 4,
    "五": 5, "六": 6, "七": 7, "八": 8, "九": 9
  };

  /** Kanji numerals below 100: 七 -> 7, 十一 -> 11, 三十 -> 30. */
  function kanjiNumber(text) {
    if (!text) return NaN;
    if (text === "元") return 1;                       // 令和元年 is year 1
    var tens = text.indexOf("十");
    if (tens === -1) return KANJI_DIGITS[text];
    var high = tens === 0 ? 1 : KANJI_DIGITS[text.slice(0, tens)];
    var low = tens === text.length - 1 ? 0 : KANJI_DIGITS[text.slice(tens + 1)];
    return high * 10 + low;
  }

  var RANK_TITLES = [
    ["横綱", "Yokozuna"], ["大関", "Ozeki"], ["関脇", "Sekiwake"], ["小結", "Komusubi"],
    ["前頭", "Maegashira"], ["十両", "Juryo"], ["幕下", "Makushita"],
    ["三段目", "Sandanme"], ["序二段", "Jonidan"], ["序ノ口", "Jonokuchi"]
  ];

  /** "前頭七枚目" -> "Maegashira #7"; "十両筆頭" -> "Juryo #1". */
  function highestRank(rikishi, lang) {
    var raw = rikishi.highestRankJa || "";
    if (lang === "ja" || !raw) return raw;
    for (var i = 0; i < RANK_TITLES.length; i++) {
      var title = RANK_TITLES[i][0];
      if (raw.indexOf(title) !== 0) continue;
      var rest = raw.slice(title.length);
      if (!rest) return RANK_TITLES[i][1];
      if (rest === "筆頭") return RANK_TITLES[i][1] + " #1";
      var slot = rest.match(/^(.+)枚目$/);
      var number = slot ? kanjiNumber(slot[1]) : NaN;
      return RANK_TITLES[i][1] + (isNaN(number) ? "" : " #" + number);
    }
    return raw;
  }

  var ERA_BASE = { "明治": 1867, "大正": 1911, "昭和": 1925, "平成": 1988, "令和": 2018 };
  var MONTHS = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

  /** "平成三十年一月場所" -> "January 2018". */
  function debut(rikishi, lang) {
    var raw = rikishi.debutJa || "";
    if (lang === "ja" || !raw) return raw;
    var parts = raw.match(/^(明治|大正|昭和|平成|令和)(.+?)年(.+?)月場所$/);
    if (!parts) return raw;
    var year = ERA_BASE[parts[1]] + kanjiNumber(parts[2]);
    var month = MONTHS[kanjiNumber(parts[3]) - 1];
    return isNaN(year) || !month ? raw : month + " " + year;
  }

  function load() {
    return fetch(DATA_URL, { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        var wrestlers = (payload.wrestlers || []).filter(function (r) {
          return r.name && r.image;
        });
        wrestlers.sort(function (a, b) {
          return rankValue(a) - rankValue(b);
        });
        return wrestlers;
      });
  }

  global.SumoData = {
    load: load,
    rankValue: rankValue,
    rankLabel: rankLabel,
    rankBadge: rankBadge,
    highestRank: highestRank,
    debut: debut,
    isTopRank: isTopRank,
    ageOf: ageOf,
    numberOf: numberOf,
    nameOf: nameOf,
    subNameOf: subNameOf,
    stableOf: stableOf,
    birthplaceOf: birthplaceOf
  };
})(window);
