/* Celebration shower for a perfect 10 — sakura petals, gold leaf and
   vermillion streamers, drawn straight onto a canvas (no libraries). */
(function (global) {
  "use strict";

  var COLORS = ["#f4b8c4", "#f7d6dd", "#b3372c", "#a8842f", "#d9b44a", "#23405e", "#faf4e6"];
  var DURATION = 6500;

  var canvas, ctx, pieces = [], raf = null, startedAt = 0, dpr = 1;

  function sizeCanvas() {
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = global.innerWidth * dpr;
    canvas.height = global.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makePiece(width, delayed) {
    return {
      x: Math.random() * width,
      y: delayed ? -Math.random() * global.innerHeight : -20 - Math.random() * 120,
      size: 6 + Math.random() * 9,
      // petals flutter and hang; leaf and streamers fall harder
      kind: Math.random() < 0.55 ? "petal" : (Math.random() < 0.6 ? "leaf" : "ribbon"),
      color: COLORS[(Math.random() * COLORS.length) | 0],
      vy: 1.1 + Math.random() * 1.9,
      vx: (Math.random() - 0.5) * 1.1,
      spin: (Math.random() - 0.5) * 0.14,
      angle: Math.random() * Math.PI * 2,
      sway: 0.6 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2
    };
  }

  function drawPetal(piece) {
    var s = piece.size;
    ctx.beginPath();
    ctx.moveTo(0, -s / 2);
    ctx.bezierCurveTo(s / 2, -s / 2, s / 2, s / 2, 0, s / 2);
    ctx.bezierCurveTo(-s / 2, s / 2, -s / 2, -s / 2, 0, -s / 2);
    ctx.fill();
  }

  function drawPiece(piece) {
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(piece.angle);
    ctx.fillStyle = piece.color;
    if (piece.kind === "petal") {
      drawPetal(piece);
    } else if (piece.kind === "leaf") {
      ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
    } else {
      ctx.fillRect(-piece.size / 6, -piece.size, piece.size / 3, piece.size * 2);
    }
    ctx.restore();
  }

  function frame(now) {
    var elapsed = now - startedAt;
    var width = global.innerWidth;
    var height = global.innerHeight;
    // Stop seeding replacements once the shower is winding down.
    var seeding = elapsed < DURATION - 2200;

    ctx.clearRect(0, 0, width, height);

    for (var i = 0; i < pieces.length; i++) {
      var piece = pieces[i];
      piece.phase += 0.05;
      piece.y += piece.vy;
      piece.x += piece.vx + Math.sin(piece.phase) * piece.sway * 0.5;
      piece.angle += piece.spin;

      if (piece.y > height + 30) {
        if (seeding) {
          pieces[i] = makePiece(width, false);
        } else {
          pieces.splice(i--, 1);
          continue;
        }
      }
      drawPiece(piece);
    }

    if (pieces.length && elapsed < DURATION + 4000) {
      raf = global.requestAnimationFrame(frame);
    } else {
      stop();
    }
  }

  function start() {
    canvas = document.getElementById("confetti");
    if (!canvas) return;
    if (global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    ctx = canvas.getContext("2d");
    sizeCanvas();
    global.addEventListener("resize", sizeCanvas);

    var count = global.innerWidth < 600 ? 90 : 170;
    pieces = [];
    for (var i = 0; i < count; i++) pieces.push(makePiece(global.innerWidth, true));

    canvas.classList.add("is-on");
    startedAt = global.performance.now();
    if (raf) global.cancelAnimationFrame(raf);
    raf = global.requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) global.cancelAnimationFrame(raf);
    raf = null;
    pieces = [];
    if (canvas) {
      canvas.classList.remove("is-on");
      ctx.clearRect(0, 0, global.innerWidth, global.innerHeight);
    }
  }

  global.Confetti = { start: start, stop: stop };
})(window);
