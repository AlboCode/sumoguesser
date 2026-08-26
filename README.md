# 相撲当て — Sumo Guesser

A quiz that shows you an official portrait of a sumo wrestler and asks you to name
him. Ten bouts, four choices each, and a banzuke rank at the end — hit all ten and
the sakura petals fall.

The whole thing is static HTML, CSS and vanilla JavaScript: no build step, no
dependencies, no framework.

## What's in it

**The quiz** (`index.html`) — ten rikishi drawn at random from the current banzuke,
four names per portrait. You can restrict the draw to makuuchi or juryo. Keys `1`–`4`
answer and `Enter` advances, if you'd rather not reach for the mouse. A perfect 10
sets off a canvas confetti shower of sakura petals, gold leaf and vermillion
streamers.

**The directory** (`rikishi.html`) — every sekitori on the current banzuke, searchable
by name, stable, birthplace or technique, and sortable by rank, name, weight, height
or age. Each card opens a profile: real name, birthday, measurements, signature
techniques, first dohyo, and championships and special prizes as vermillion seals.

**Both languages** — the whole interface, and every wrestler's name, switches between
Japanese and English from the header. Your choice is remembered.

## The data

Everything comes from the [Japan Sumo Association official site](https://www.sumo.or.jp/):
the banzuke listings, the bilingual profiles, and the 270×474 portraits (which carry
the JSA copyright mark).

`scripts/scrape.py` rebuilds `data/rikishi.json` and `assets/rikishi/*.jpg` from
scratch. It needs nothing but the Python standard library; with Pillow installed it
also strips the ~80 KB of camera metadata each portrait ships with, which takes the
image set from 7.7 MB down to 1.7 MB.

```sh
python3 scripts/scrape.py      # refresh after a new banzuke is announced
```

Portraits already on disk are left alone, so a refresh only fetches what's new.
Delete `assets/rikishi/` first if you want everything re-downloaded.

## Running it locally

Any static file server will do — the pages fetch `data/rikishi.json`, so opening
`index.html` straight off the filesystem won't work.

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Deploying

`.github/workflows/deploy.yml` publishes the repository root to GitHub Pages on every
push. It enables Pages itself on the first run, so there's nothing to click in the
repository settings.

## Layout

```
index.html          the quiz
rikishi.html        the directory
styles.css          the Edo-classic theme, shared by both pages
js/i18n.js          bilingual strings and the language toggle
js/data.js          loading and shaping the rikishi records
js/quiz.js          the ten-bout game
js/explore.js       directory filtering, sorting and the detail sheet
js/confetti.js      the perfect-score celebration
data/rikishi.json   scraped bilingual records
assets/rikishi/     portraits, one per rikishi
scripts/scrape.py   rebuilds the two above
```

## Credit

Portraits and profile data are the property of the Japan Sumo Association
(公益財団法人日本相撲協会). This is an unaffiliated fan project.
