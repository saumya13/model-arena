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
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded border border-secondary px-3 py-1.5 text-sm font-semibold text-secondary transition hover:bg-secondary-tint sm:inline"
          >
            Source
          </a>
          <ApiKeyBadge onClick={() => setModalOpen(true)} />
        </div>
      </div>

      {modalOpen && <ApiKeyModal onClose={() => setModalOpen(false)} />}
    </header>
  );
}
