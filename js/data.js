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
    isTopRank: isTopRank,
    ageOf: ageOf,
    numberOf: numberOf,
    nameOf: nameOf,
    subNameOf: subNameOf,
    stableOf: stableOf,
    birthplaceOf: birthplaceOf
  };
})(window);
