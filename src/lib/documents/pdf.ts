/**
 * Création de PDF sur l'appareil (pdf-lib, JavaScript pur : iOS, Android et web) :
 *  - un document multipage à partir des pages numérisées (JPEG) ;
 *  - un dossier d'export : page d'index + documents choisis (PDF fusionnés, images insérées) + résumés éventuels.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

export interface JpegPage { bytes: Uint8Array; width: number; height: number }

const A4 = { w: 595.28, h: 841.89 };

/** Une page PDF par image, à la taille A4, image centrée sans déformation. */
export async function pdfFromJpegs(pages: JpegPage[], title?: string): Promise<Uint8Array> {
  if (!pages.length) throw new Error('no_pages');
  const doc = await PDFDocument.create();
  if (title) doc.setTitle(title);
  doc.setProducer('Toi & Moi');
  doc.setCreator('Toi & Moi');
  for (const p of pages) {
    const img = await doc.embedJpg(p.bytes);
    const landscape = p.width > p.height;
    const pw = landscape ? A4.h : A4.w, ph = landscape ? A4.w : A4.h;
    const page = doc.addPage([pw, ph]);
    const s = Math.min((pw - 24) / p.width, (ph - 24) / p.height);
    const w = p.width * s, h = p.height * s;
    page.drawImage(img, { x: (pw - w) / 2, y: (ph - h) / 2, width: w, height: h });
  }
  return doc.save();
}

export async function pdfPageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(bytes, { ignoreEncryption: true })).getPageCount();
}

/** Les polices standard du PDF (WinAnsi) ne couvrent pas tout l'Unicode : remplacements sûrs. */
export function winAnsiSafe(s: string): string {
  return s
    .replace(/[‘’ʼ]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
    .replace(/ | /g, ' ').replace(/µ/g, 'µ').replace(/[^\x20-\x7E -ÿŒœ€\n]/g, '?');
}

function wrap(text: string, font: PDFFont, size: number, max: number): string[] {
  const out: string[] = [];
  for (const para of winAnsiSafe(text).split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const tryLine = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(tryLine, size) > max && line) { out.push(line); line = word; } else line = tryLine;
    }
    out.push(line);
  }
  return out;
}

export interface ExportItem {
  title: string;
  meta: string; // catégorie · date · profil
  mime: string;
  bytes: Uint8Array | null; // null : fichier indisponible (signalé dans l'index)
  summary?: string | null;
}
export interface ExportLabels { heading: string; generated: string; notice: string; missing: string; summaryOf: string; summaryNotice: string }

/** Dossier PDF : index, puis chaque document (et son résumé si demandé). */
export async function buildExportPdf(items: ExportItem[], labels: ExportLabels): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  out.setTitle(labels.heading);
  out.setProducer('Toi & Moi');
  const font = await out.embedFont(StandardFonts.Helvetica);
  const bold = await out.embedFont(StandardFonts.HelveticaBold);
  const writer = () => {
    let page = out.addPage([A4.w, A4.h]);
    let y = A4.h - 56;
    const line = (txt: string, f: PDFFont, size: number, color = rgb(0.1, 0.08, 0.15)) => {
      for (const l of wrap(txt, f, size, A4.w - 112)) {
        if (y < 56) { page = out.addPage([A4.w, A4.h]); y = A4.h - 56; }
        page.drawText(l, { x: 56, y, size, font: f, color });
        y -= size * 1.45;
      }
    };
    return { line, gap: (n: number) => { y -= n; } };
  };
  // Index
  const idx = writer();
  idx.line(labels.heading, bold, 18);
  idx.line(labels.generated, font, 10, rgb(0.4, 0.38, 0.45));
  idx.gap(8);
  idx.line(labels.notice, font, 9.5, rgb(0.4, 0.38, 0.45));
  idx.gap(14);
  items.forEach((it, i) => {
    idx.line(`${i + 1}. ${it.title}`, bold, 11.5);
    idx.line(`${it.meta}${it.bytes ? '' : ` — ${labels.missing}`}`, font, 10, rgb(0.35, 0.33, 0.4));
    idx.gap(6);
  });
  // Documents
  for (const it of items) {
    if (it.bytes) {
      if (it.mime === 'application/pdf') {
        const src = await PDFDocument.load(it.bytes, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      } else if (it.mime === 'image/jpeg' || it.mime === 'image/png') {
        const img = it.mime === 'image/png' ? await out.embedPng(it.bytes) : await out.embedJpg(it.bytes);
        const page = out.addPage([A4.w, A4.h]);
        const s = Math.min((A4.w - 48) / img.width, (A4.h - 48) / img.height);
        page.drawImage(img, { x: (A4.w - img.width * s) / 2, y: (A4.h - img.height * s) / 2, width: img.width * s, height: img.height * s });
      }
    }
    if (it.summary) {
      const w = writer();
      w.line(`${labels.summaryOf} ${it.title}`, bold, 14);
      w.line(labels.summaryNotice, font, 9.5, rgb(0.4, 0.38, 0.45));
      w.gap(10);
      w.line(it.summary, font, 10.5);
    }
  }
  return out.save();
}
