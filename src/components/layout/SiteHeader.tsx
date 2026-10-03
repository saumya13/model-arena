import { useState } from "react";
import { ApiKeyBadge } from "@/components/apikey/ApiKeyBadge";
import { ApiKeyModal } from "@/components/apikey/ApiKeyModal";

export function SiteHeader() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-2.5">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-semibold tracking-tight text-ink">
            model<span className="text-signal">/</span>arena
          </span>
          <span className="hidden font-mono text-[0.6875rem] uppercase tracking-widest text-secondary-strong  sm:inline">
            v1
          </span>
        </a>

        <div className="flex items-end gap-3">
          <a
            href="https://github.com/saumya13"
            target="_blank"
            rel="noreferrer"
            className="hidden self-center font-mono text-sm text-ink-soft transition hover:text-ink md:inline"
          >
            @saumya13
          </a>
          <a
            href="https://github.com/saumya13/model-arena"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded border border-secondary px-3 py-1.5 text-sm font-semibold text-secondary transition hover:bg-secondary-tint sm:inline-flex sm:items-center sm:gap-1.5"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            Source
          </a>
          <ApiKeyBadge onClick={() => setModalOpen(true)} />
        </div>
      </div>

      {modalOpen && <ApiKeyModal onClose={() => setModalOpen(false)} />}
    </header>
  );
}
