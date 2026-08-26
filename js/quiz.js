/* The ten-bout quiz. */
(function (global) {
  "use strict";

  var ROUNDS = 10;
  var CHOICES = 4;

  /* Score bands, awarded as a banzuke rank. */
  var RANKS = [
    { min: 10, ja: "横綱", en: "Yokozuna", line: "perfect" },
    { min: 8,  ja: "大関", en: "Ozeki",     line: "strong" },
    { min: 6,  ja: "関脇", en: "Sekiwake",  line: "even" },
    { min: 4,  ja: "小結", en: "Komusubi",  line: "even" },
    { min: 2,  ja: "前頭", en: "Maegashira", line: "weak" },
    { min: 0,  ja: "序ノ口", en: "Jonokuchi", line: "weak" }
  ];

  var el = {};
  var all = [];
  var pool = [];
  var division = "all";
  var mode = "name";        // "name": portrait -> four names. "face": name -> four portraits.
  var rounds = [];
  var index = 0;
  var score = 0;
  var answered = false;

  function $(id) { return document.getElementById(id); }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = (Math.random() * (i + 1)) | 0;
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function applyDivision() {
    pool = division === "all" ? all : all.filter(function (r) {
      return r.division === division;
    });
    el.poolCount.textContent = pool.length;
  }

  /* ---------- building a game ---------- */

  function buildRounds() {
    var picks = shuffle(pool).slice(0, ROUNDS);
    return picks.map(function (answer) {
      var others = shuffle(pool.filter(function (r) {
        return r.id !== answer.id;
      })).slice(0, CHOICES - 1);
      return { answer: answer, options: shuffle(others.concat([answer])), chosen: null };
    });
  }

  function show(screen) {
    ["screenStart", "screenQuiz", "screenResult"].forEach(function (id) {
      $(id).classList.toggle("is-active", id === screen);
    });
  }

  function startGame() {
    if (pool.length < CHOICES) return;
    rounds = buildRounds();
    index = 0;
    score = 0;
    Confetti.stop();
    el.roundTotal.textContent = rounds.length;
    buildTawara();
    show("screenQuiz");
    renderRound();
    global.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildTawara() {
    el.tawara.innerHTML = "";
    for (var i = 0; i < rounds.length; i++) {
      el.tawara.appendChild(document.createElement("li"));
    }
  }

  function paintTawara() {
    var marks = el.tawara.children;
    for (var i = 0; i < marks.length; i++) {
      var round = rounds[i];
      marks[i].className = "";
      if (round.chosen) {
        marks[i].classList.add(round.chosen.id === round.answer.id ? "is-hit" : "is-miss");
      } else if (i === index) {
        marks[i].classList.add("is-now");
      }
    }
  }

  /* ---------- one round ---------- */

  /** A portrait cropped to head and shoulders, with this wrestler's own zoom. */
  function croppedPortrait(rikishi, alt) {
    var img = document.createElement("img");
    // Some wrestlers wear their shikona high on the mawashi; show less of them.
    img.style.setProperty("--portrait-zoom", rikishi.portraitZoom || 1);
    img.src = rikishi.image;
    img.alt = alt || "";
    img.decoding = "async";
    return img;
  }

  function choiceButton(option, i, extraClass) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "choice" + (extraClass ? " " + extraClass : "");
    button.dataset.id = option.id;

    var num = document.createElement("span");
    num.className = "choice__num";
    num.textContent = i + 1;
    button.appendChild(num);

    button.addEventListener("click", function () { choose(option, button); });
    return button;
  }

  function renderRound() {
    var round = rounds[index];
    answered = false;

    el.roundNow.textContent = index + 1;
    el.scoreNow.textContent = score;
    paintTawara();
    el.verdict.hidden = true;

    el.promptPortrait.hidden = mode !== "name";
    el.promptName.hidden = mode !== "face";
    el.choices.classList.toggle("choices--faces", mode === "face");
    el.choices.innerHTML = "";

    if (mode === "name") renderNameRound(round);
    else renderFaceRound(round);

    // Warm the next round's images so the reveal is instant.
    var next = rounds[index + 1];
    if (next) (mode === "name" ? [next.answer] : next.options).forEach(function (r) {
      new Image().src = r.image;
    });
  }

  /** Portrait up top, four names to choose from. */
  function renderNameRound(round) {
    var lang = I18N.lang;

    el.portraitFrame.classList.remove("is-shown");
    el.portraitImg.alt = "";
    el.portraitImg.style.setProperty("--portrait-zoom", round.answer.portraitZoom || 1);
    el.portraitImg.src = round.answer.image;
    if (el.portraitImg.complete) revealPortrait();

    round.options.forEach(function (option, i) {
      var button = choiceButton(option, i);

      var main = document.createElement("span");
      main.className = "choice__main";
      main.textContent = SumoData.nameOf(option, lang);

      var sub = document.createElement("span");
      sub.className = "choice__sub";
      sub.textContent = SumoData.subNameOf(option, lang);

      button.append(main, sub);
      el.choices.appendChild(button);
    });
  }

  /** Name up top, four portraits to choose from. */
  function renderFaceRound(round) {
    paintNamePrompt(round.answer);

    round.options.forEach(function (option, i) {
      var button = choiceButton(option, i, "choice--face");
      var window_ = document.createElement("span");
      window_.className = "choice__window portrait-crop";
      window_.appendChild(croppedPortrait(option));
      button.appendChild(window_);
      el.choices.appendChild(button);
    });
  }

  function paintNamePrompt(rikishi) {
    var lang = I18N.lang;
    el.promptNameMain.textContent = SumoData.nameOf(rikishi, lang);
    el.promptNameSub.textContent = SumoData.subNameOf(rikishi, lang);
  }

  function revealPortrait() {
    el.portraitFrame.classList.add("is-shown");
  }

  function choose(option, button) {
    if (answered) return;
    answered = true;

    var round = rounds[index];
    var correct = option.id === round.answer.id;
    round.chosen = option;
    if (correct) score++;

    el.choices.querySelectorAll(".choice").forEach(function (node) {
      node.disabled = true;
      if (node.dataset.id === round.answer.id) node.classList.add("is-right");
      else if (node === button) node.classList.add("is-wrong");
      else node.classList.add("is-dim");
    });

    el.scoreNow.textContent = score;
    paintTawara();
    showVerdict(correct, round.answer);
  }

  function showVerdict(correct, answer) {
    var lang = I18N.lang;
    el.verdictMark.className = "verdict__mark " + (correct ? "is-right" : "is-wrong");
    el.verdictMark.textContent = I18N.t(correct ? "markRight" : "markWrong");

    el.verdictText.textContent = "";
    var lead = document.createElement("b");
    lead.textContent = SumoData.nameOf(answer, lang);
    // In guess-the-face the name is already the prompt, so naming it again reads oddly.
    var prefix = !correct && mode === "name" ? I18N.t("answerIs") + " " : "";
    el.verdictText.append(
      prefix,
      lead,
      " — " + I18N.tf(
        "andHe",
        SumoData.rankLabel(answer, lang),
        SumoData.stableOf(answer, lang),
        SumoData.birthplaceOf(answer, lang)
      )
    );

    el.nextBtn.textContent = I18N.t(index === rounds.length - 1 ? "finishBtn" : "nextBtn");
    el.verdict.hidden = false;
    el.nextBtn.focus({ preventScroll: true });
  }

  function next() {
    if (index < rounds.length - 1) {
      index++;
      renderRound();
    } else {
      finish();
    }
  }

  /* ---------- result ---------- */

  function bandFor(value) {
    for (var i = 0; i < RANKS.length; i++) {
      if (value >= RANKS[i].min) return RANKS[i];
    }
    return RANKS[RANKS.length - 1];
  }

  function finish() {
    show("screenResult");
    renderResult();
    global.scrollTo({ top: 0, behavior: "smooth" });
    if (score === rounds.length) Confetti.start();
  }

  function renderResult() {
    var lang = I18N.lang;
    var band = bandFor(score);

    el.finalScore.textContent = score;
    el.rankJa.textContent = band.ja;
    el.rankEn.textContent = band.en;
    el.resultLine.textContent = I18N.t(band.line);

    el.review.innerHTML = "";
    rounds.forEach(function (round) {
      var correct = round.chosen && round.chosen.id === round.answer.id;
      var item = document.createElement("li");
      var row = document.createElement("button");
      row.type = "button";
      row.className = "review__row";

      var thumb = document.createElement("img");
      thumb.className = "review__thumb";
      thumb.src = round.answer.image;
      thumb.alt = "";
      thumb.loading = "lazy";

      var name = document.createElement("span");
      name.className = "review__name";
      name.textContent = SumoData.nameOf(round.answer, lang);
      var sub = document.createElement("small");
      sub.textContent = SumoData.subNameOf(round.answer, lang) + " · " +
        SumoData.rankLabel(round.answer, lang);
      name.appendChild(sub);

      if (!correct && round.chosen) {
        var yours = document.createElement("small");
        yours.className = "review__yours";
        yours.textContent = I18N.t("youSaid") + ": " + SumoData.nameOf(round.chosen, lang);
        name.appendChild(yours);
      }

      var mark = document.createElement("span");
      mark.className = "review__mark " + (correct ? "is-right" : "is-wrong");
      mark.textContent = correct ? "◯" : "✕";

      var open = document.createElement("span");
      open.className = "review__open";
      open.textContent = "›";
      open.setAttribute("aria-hidden", "true");

      row.append(thumb, name, mark, open);
      row.addEventListener("click", function () { SumoCard.open(round.answer, row); });
      item.appendChild(row);
      el.review.appendChild(item);
    });
  }

  /* ---------- wiring ---------- */

  function bind() {
    el.startBtn.addEventListener("click", startGame);
    el.nextBtn.addEventListener("click", next);
    el.againBtn.addEventListener("click", function () {
      Confetti.stop();
      show("screenStart");
      global.scrollTo({ top: 0, behavior: "smooth" });
    });
    el.portraitImg.addEventListener("load", revealPortrait);

    el.modePicker.addEventListener("click", function (event) {
      var button = event.target.closest(".segmented__btn");
      if (!button) return;
      mode = button.dataset.mode;
      el.modePicker.querySelectorAll(".segmented__btn").forEach(function (node) {
        node.classList.toggle("is-active", node === button);
      });
      paintModeNote();
    });

    el.divisionPicker.addEventListener("click", function (event) {
      var button = event.target.closest(".segmented__btn");
      if (!button) return;
      division = button.dataset.division;
      el.divisionPicker.querySelectorAll(".segmented__btn").forEach(function (node) {
        node.classList.toggle("is-active", node === button);
      });
      applyDivision();
    });

    // Keys 1-4 answer, Enter/Space advances.
    document.addEventListener("keydown", function (event) {
      if (!$("screenQuiz").classList.contains("is-active")) return;
      if (!answered && event.key >= "1" && event.key <= String(CHOICES)) {
        var buttons = el.choices.querySelectorAll(".choice");
        var target = buttons[parseInt(event.key, 10) - 1];
        if (target) { target.click(); event.preventDefault(); }
      } else if (answered && (event.key === "Enter" || event.key === " ")) {
        next();
        event.preventDefault();
      }
    });

    // Re-render in place when the language flips mid-game.
    I18N.onChange(function () {
      paintModeNote();
      if ($("screenQuiz").classList.contains("is-active")) {
        var round = rounds[index];
        if (answered) {
          renderRoundTranslated(round);
        } else {
          renderRound();
        }
      } else if ($("screenResult").classList.contains("is-active")) {
        renderResult();
      }
    });
  }

  /** Re-label an already-answered round without discarding its verdict. */
  function renderRoundTranslated(round) {
    var lang = I18N.lang;
    if (mode === "face") {
      paintNamePrompt(round.answer);          // the portraits themselves need no relabelling
    } else {
      el.choices.querySelectorAll(".choice").forEach(function (node) {
        var option = round.options.find(function (o) { return o.id === node.dataset.id; });
        if (!option) return;
        node.querySelector(".choice__main").textContent = SumoData.nameOf(option, lang);
        node.querySelector(".choice__sub").textContent = SumoData.subNameOf(option, lang);
      });
    }
    showVerdict(round.chosen.id === round.answer.id, round.answer);
  }

  function paintModeNote() {
    el.modeNote.textContent = I18N.t(mode === "face" ? "modeNoteFace" : "modeNoteName");
  }

  function init() {
    I18N.init();
    SumoCard.init();
    ["poolCount", "startBtn", "modePicker", "modeNote", "divisionPicker", "tawara",
     "roundNow", "roundTotal", "scoreNow", "promptPortrait", "portraitImg",
     "promptName", "promptNameMain", "promptNameSub", "choices", "verdict",
     "verdictMark", "verdictText", "nextBtn", "finalScore", "rankJa", "rankEn",
     "resultLine", "review", "againBtn", "loading"].forEach(function (id) {
      el[id] = $(id);
    });
    el.portraitFrame = document.querySelector(".portrait__frame");

    SumoData.load().then(function (wrestlers) {
      all = wrestlers;
      applyDivision();
      paintModeNote();
      el.loading.hidden = true;
      bind();
    }).catch(function (error) {
      el.loading.textContent = I18N.t("loadError");
      console.error(error);
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})(window);
