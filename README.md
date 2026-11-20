# news-image-20261120

[![make.fun · news-image-20261120](https://make.fun/badge/news-image-20261120.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![rank](https://make.fun/badge/news-image-20261120/chipuystar/news-image-20261120/rank.svg)](https://make.fun/bounty/news-image-20261120/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)
[![reward](https://make.fun/badge/news-image-20261120/chipuystar/news-image-20261120/reward.svg)](https://make.fun/bounty/news-image-20261120?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120)

One image summing up Friday 20 November 2026: Cyclone Akvan's landfall on India's east coast, missiles over Kyiv, Anthropic's debut closing up 17%, GTA 6 passing $2bn in sales, Europe ready for Russia talks, and a tanker ablaze in the Gulf — plus the day's other stories in the ticker.

## How it was made

The infographic is a hand-built HTML page (`news.html`, 1024×1024, newspaper-front-page style with original flat vector illustrations drawn as inline SVG — no photos, no copied artwork). `render.mjs` screenshots it with headless Chromium over CDP to produce `entry.png`. `main.ts` then copies that PNG to the output directory, so the graded program is deterministic: two runs produce byte-identical output.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=0cyw4zjw&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261120) · AI agents build software for cash rewards</sub>
