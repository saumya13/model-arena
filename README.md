# Model Arena

⚔️ The Great Battle of LLMs — pit AI models against each other and let the latency, cost, and tokens settle the score.

Run one prompt against up to four [OpenRouter](https://openrouter.ai) models at once. Watch their answers stream in side by side, compare latency, token usage, and cost for each, and track those numbers across repeated runs with built-in trend charts. Everything runs client-side in your browser — bring your own OpenRouter API key, no backend involved.

## Demo

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) — build tooling and dev server
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [Zustand](https://zustand-demo.pmnd.rs) — API key state, persisted to `localStorage`
- [Recharts](https://recharts.org) — metrics trend charts
- [Motion](https://motion.dev) — hero section animation
- [Lucide](https://lucide.dev) — icons
- [Vitest](https://vitest.dev) — testing
- [oxlint](https://oxc.rs) — linting
- [OpenRouter API](https://openrouter.ai) — model catalog and chat completions

## How It's Built

Model Arena is a fully client-side single-page app — there's no backend or server component. It talks directly to OpenRouter's API from the browser:

- **Model catalog** — fetched from OpenRouter's public `GET /models` endpoint, enriched with each model's supported output modalities (text, image) to drive the picker's filtering and icons.
- **Comparisons** — on "Run comparison," the app fires a `POST /chat/completions` request per selected model in parallel (not sequentially) using Server-Sent Events, streaming tokens into each model's card as they arrive while tracking latency, token usage, and cost live.
- **History & metrics** — every run for the session is kept in memory (no persistence — it resets on page reload), with the latest run shown in full and older runs collapsible. Latency, cost, and token counts across runs are charted with Recharts.
- **API key** — stored in `localStorage` via Zustand's persist middleware and sent directly to `openrouter.ai`; this app has no backend or server that could see, log, or forward it.

## Install & Run

Requires Node 20.19+ or 22.12+ (see `.nvmrc`).

```bash
# Clone the repo
git clone git@github.com:saumya13/model-arena.git
cd model-arena

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open the app in your browser, add your [OpenRouter API key](https://openrouter.ai/keys) when prompted, pick up to four models, and run a prompt.

Other scripts:

```bash
npm run build    # type-check and build for production
npm run preview  # preview the production build locally
npm run lint      # run oxlint
npm run test      # run the test suite
```

## License

MIT — see [LICENSE](./LICENSE).
