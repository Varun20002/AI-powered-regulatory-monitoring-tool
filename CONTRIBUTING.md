# Contributing to RegMonitor

Thanks for your interest! This is a small project and contributions of any size are welcome — typo fixes, new regulator scrapers, baseline templates for other jurisdictions, bug reports, all of it.

## Filing issues

Open an issue on GitHub with:

- **What you tried** (command, page, API call)
- **What you expected** vs. **what happened** (error message, screenshot if UI)
- **Environment**: Node version, deployment (local / Vercel), LLM provider
- **Repro steps** if you can produce them

For security issues, please **do not** open a public issue — email the maintainer instead.

## Dev setup

See [README.md → Quick start](./README.md#quick-start-5-min). One-liner once your `.env.local` is filled in:

```bash
npm install && npm run dev
```

## Pull requests

1. Fork and create a feature branch off `main`: `git checkout -b feat/my-change`.
2. Keep PRs focused — **one feature or fix per PR**.
3. Run before pushing:
   ```bash
   npm run lint
   npm run build
   ```
4. **Never commit secrets.** Real values belong in `.env.local` only — that file is gitignored. If you accidentally commit a key, rotate it immediately.
5. Update [README.md](./README.md) if you change setup steps, env vars, or public APIs.
6. Open the PR with a clear description of the problem and the change.

## Where help is most appreciated

- **New regulator scrapers** — see existing scrapers in [`src/lib/scrapers/`](src/lib/scrapers/) as templates. RSS-based scrapers (RBI, SEBI) are simplest; HTML-based (IFSCA) requires a `cheerio` selector.
- **Baseline templates** for other jurisdictions — drop a `samples/<jurisdiction>-baseline.json` next to the existing one.
- **More LLM provider presets** — small PRs to [`src/lib/minimax.ts`](src/lib/minimax.ts) that document `baseURL` + model for OpenAI / Groq / Ollama / etc.
- **Tests** — the project currently has none. Integration tests for the analyse pipeline would be the highest-leverage contribution.
- **Docs and screenshots** — if you stand the tool up successfully, dropping screenshots into `public/screenshots/` and linking them from the README helps everyone after you.

## Code style

- TypeScript strict mode is on — please don't widen types unnecessarily.
- Match the existing file structure (route handlers in `src/app/api/`, shared logic in `src/lib/`).
- Prefer narrow, well-named functions over big ones. Comments should explain *why*, not *what*.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
