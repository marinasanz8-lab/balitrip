import { useState } from "react";
import { SectionHeader } from "./shared";

/** Accepts either a bare embed URL or a full <iframe src="..."> snippet
 * (what Google My Maps' "share → embed" dialog gives you) and returns just
 * the URL. */
function extractEmbedUrl(input: string): string {
  const trimmed = input.trim();
  const iframeMatch = trimmed.match(/<iframe[^>]*\ssrc="([^"]+)"/i);
  return (iframeMatch ? iframeMatch[1] : trimmed).trim();
}

export function MapSection({
  mapEmbedUrl,
  setMapEmbedUrl,
}: {
  mapEmbedUrl?: string;
  setMapEmbedUrl: (v: string | undefined) => void;
}) {
  const [editing, setEditing] = useState(!mapEmbedUrl);
  const [draft, setDraft] = useState("");

  const save = () => {
    const url = extractEmbedUrl(draft);
    if (!url) return;
    setMapEmbedUrl(url);
    setDraft("");
    setEditing(false);
  };

  const cancel = () => {
    setDraft("");
    setEditing(false);
  };

  return (
    <section id="mapa" className="py-14 px-4 max-w-4xl mx-auto">
      <SectionHeader eyebrow="Ubicaciones" title="Mapa" />

      {mapEmbedUrl && !editing ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="aspect-[4/3] sm:aspect-video">
            <iframe src={mapEmbedUrl} className="w-full h-full" style={{ border: 0 }} loading="lazy" title="Mapa del viaje" />
          </div>
          <div className="p-3 flex justify-end">
            <button
              onClick={() => { setDraft(mapEmbedUrl); setEditing(true); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cambiar mapa
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Crea un mapa en{" "}
            <a href="https://www.google.com/maps/d/" target="_blank" rel="noopener noreferrer" className="text-info underline">
              Google My Maps
            </a>
            , pulsa Compartir → Insertar en mi sitio web, y pega aquí el código o el enlace.
          </p>
          <textarea
            className="w-full text-sm bg-muted rounded-xl px-3 py-2.5 outline-none placeholder:text-muted-foreground resize-y leading-relaxed"
            rows={3}
            placeholder='<iframe src="https://www.google.com/maps/d/embed?mid=..."></iframe>'
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={save} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity text-sm font-medium">
              Guardar
            </button>
            {mapEmbedUrl && (
              <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 transition-colors">
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
