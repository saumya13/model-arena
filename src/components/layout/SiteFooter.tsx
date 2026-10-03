export function SiteFooter() {
  return (
    <footer className="border-t border-signal/20 bg-raised">
      <div className="mx-auto max-w-7xl px-5 py-6">
        <p className="max-w-3xl text-xs leading-relaxed text-ink-soft">
          Model Arena runs entirely in your browser. Your OpenRouter API key is
          stored in <code className="font-mono">localStorage</code> and sent
          directly to <code className="font-mono">openrouter.ai</code> — this
          app has no backend and no server that could see, log, or forward it.
        </p>
        <div className="mt-4 flex items-center gap-4 font-mono text-[0.6875rem] uppercase tracking-widest text-grey-600">
          <span>Built with React + OpenRouter</span>
          <span aria-hidden>·</span>
          <a
            href="https://openrouter.ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink-soft"
          >
            openrouter.ai
          </a>
        </div>
      </div>
    </footer>
  );
}
