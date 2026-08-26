/* Bilingual strings + the language toggle shared by both pages. */
(function (global) {
  "use strict";

  var STORE_KEY = "sumoguesser.lang";

  var STRINGS = {
    en: {
      brandJa: "相撲当て",
      brandEn: "SUMO GUESSER",
      navQuiz: "Quiz",
      navExplore: "Rikishi",

      heroKicker: "Ten portraits. Four names each.",
      heroTitle: "Who is this rikishi?",
      heroLede: "Ten wrestlers are drawn at random from the current banzuke. Name each one from their official portrait and earn your rank.",
      chipPool: "rikishi in the pool",
      chipRounds: "rounds",
      chipChoices: "choices",
      divisionLabel: "Division",
      divAll: "All sekitori",
      divMakuuchi: "Makuuchi",
      divJuryo: "Juryo",
      startBtn: "Enter the ring",
      heroNote: "Portraits and data come from the Japan Sumo Association official site.",

      roundWord: "Bout",
      scoreWord: "Wins",
      portraitCap: "NAME THIS RIKISHI",
      nextBtn: "Next bout",
      finishBtn: "See the tally",
      markRight: "◯ Correct",
      markWrong: "✕ Wrong",
      answerIs: "This is",
      andHe: "%s of %s stable, %s.",

      resultKicker: "FINAL TALLY",
      tallyOf: "out of 10",
      reviewTitle: "Your bouts",
      againBtn: "Another basho",
      studyBtn: "Study the rikishi",
      youSaid: "you said",
      perfect: "A flawless record — zensho-yusho. Not one portrait fooled you.",
      strong: "A winning record with room at the top. The tsuna is within reach.",
      even: "A respectable showing. A few more bouts in the keiko-ba and you will climb.",
      weak: "The dohyo is unforgiving. Study the directory and come back.",

      loading: "Unrolling the banzuke…",
      loadError: "The banzuke could not be unrolled. Please reload the page.",

      dirTitle: "Rikishi directory",
      dirLede: "Every sekitori on the current banzuke — makuuchi and juryo — with the portrait the quiz draws from.",
      searchLabel: "Search",
      searchPlaceholder: "Search name, stable, birthplace…",
      sortLabel: "Sort",
      sortRank: "By banzuke rank",
      sortName: "By name",
      sortWeight: "By weight",
      sortHeight: "By height",
      sortAge: "By age",
      showing: "Showing %s of %s rikishi",
      noMatch: "No rikishi answers to that name.",

      fRank: "Rank",
      fHighest: "Highest rank",
      fStable: "Stable",
      fRealName: "Real name",
      fBirthday: "Born",
      fBirthplace: "From",
      fHeight: "Height",
      fWeight: "Weight",
      fTechnique: "Techniques",
      fDebut: "First dohyo",
      honoursTitle: "Honours",
      noHonours: "No titles or prizes recorded yet.",
      officialLink: "Official profile at sumo.or.jp →",

      footerCredit: "Portraits & profile data: Japan Sumo Association"
    },

    ja: {
      brandJa: "相撲当て",
      brandEn: "SUMO GUESSER",
      navQuiz: "力士当て",
      navExplore: "力士名鑑",

      heroKicker: "十番勝負・四択",
      heroTitle: "この力士は誰か",
      heroLede: "現在の番付から十人の力士を無作為に選びます。公式の写真を見て四股名を当て、あなたの番付を手にしてください。",
      chipPool: "人の力士",
      chipRounds: "番",
      chipChoices: "択",
      divisionLabel: "階級",
      divAll: "関取すべて",
      divMakuuchi: "幕内",
      divJuryo: "十両",
      startBtn: "土俵に上がる",
      heroNote: "写真・データは日本相撲協会公式サイトより。",

      roundWord: "第",
      scoreWord: "勝",
      portraitCap: "四股名を当てよ",
      nextBtn: "次の一番へ",
      finishBtn: "星取を見る",
      markRight: "◯ 正解",
      markWrong: "✕ 不正解",
      answerIs: "正解は",
      andHe: "%s・%s部屋・%s出身。",

      resultKicker: "星 取 表",
      tallyOf: "／十番",
      reviewTitle: "あなたの星取",
      againBtn: "もう一場所",
      studyBtn: "力士名鑑を見る",
      youSaid: "あなたの答え",
      perfect: "全勝優勝。一枚たりとも見誤らなかった見事な取り口です。",
      strong: "堂々の勝ち越し。綱はもう目の前です。",
      even: "まずまずの成績。稽古場でもう少し数をこなせば上がれます。",
      weak: "土俵は甘くありません。名鑑で顔を覚えて出直しましょう。",

      loading: "番付を広げています…",
      loadError: "番付を広げられませんでした。ページを再読み込みしてください。",

      dirTitle: "力士名鑑",
      dirLede: "現在の番付に名を連ねる幕内・十両の関取衆。出題に使う写真とともに。",
      searchLabel: "検索",
      searchPlaceholder: "四股名・部屋・出身地で探す…",
      sortLabel: "並べ替え",
      sortRank: "番付順",
      sortName: "四股名順",
      sortWeight: "体重順",
      sortHeight: "身長順",
      sortAge: "年齢順",
      showing: "%s人／全%s人",
      noMatch: "該当する力士はおりません。",

      fRank: "現在の番付",
      fHighest: "最高位",
      fStable: "所属部屋",
      fRealName: "本名",
      fBirthday: "生年月日",
      fBirthplace: "出身地",
      fHeight: "身長",
      fWeight: "体重",
      fTechnique: "得意技",
      fDebut: "初土俵",
      honoursTitle: "賞歴",
      noHonours: "記録された優勝・三賞はありません。",
      officialLink: "日本相撲協会の公式プロフィール →",

      footerCredit: "写真・データ：日本相撲協会"
    }
  };

  var current = "en";

  function detect() {
    var saved;
    try {
      saved = global.localStorage.getItem(STORE_KEY);
    } catch (err) {
      saved = null;
    }
    if (saved === "ja" || saved === "en") return saved;
    var nav = (global.navigator.language || "en").toLowerCase();
    return nav.indexOf("ja") === 0 ? "ja" : "en";
  }

  function t(key) {
    var table = STRINGS[current] || STRINGS.en;
    var value = table[key];
    if (value === undefined) value = STRINGS.en[key];
    return value === undefined ? key : value;
  }

  /** t() with %s placeholders filled from the remaining arguments. */
  function tf(key) {
    var args = Array.prototype.slice.call(arguments, 1);
    var i = 0;
    return t(key).replace(/%s/g, function () {
      return args[i++];
    });
  }

  function apply(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
    });
    document.documentElement.lang = current;
  }

  var listeners = [];

  function set(lang) {
    current = lang === "ja" ? "ja" : "en";
    try {
      global.localStorage.setItem(STORE_KEY, current);
    } catch (err) {
      /* private browsing — the choice just won't persist */
    }
    apply();
    syncToggle();
    listeners.forEach(function (fn) {
      fn(current);
    });
  }

  function syncToggle() {
    document.querySelectorAll(".lang-toggle__opt").forEach(function (opt) {
      opt.classList.toggle("is-active", opt.getAttribute("data-lang") === current);
    });
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function init() {
    current = detect();
    apply();
    syncToggle();
    var toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        set(current === "ja" ? "en" : "ja");
      });
    }
  }

  global.I18N = {
    init: init,
    apply: apply,
    set: set,
    onChange: onChange,
    t: t,
    tf: tf,
    get lang() {
      return current;
    }
  };
})(window);
