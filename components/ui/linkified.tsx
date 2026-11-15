import { Fragment } from "react";

const URL_PATTERN = /(https?:\/\/[^\s<>"']+)/g;
/** Punctuation that usually ends the sentence rather than the link. */
const TRAILING = /[.,;:!?)\]]+$/;

/** Splits text into plain parts and web links. */
export function splitLinks(text: string): { text: string; href?: string }[] {
  const parts: { text: string; href?: string }[] = [];
  for (const piece of text.split(URL_PATTERN)) {
    if (!piece) continue;
    if (!/^https?:\/\//.test(piece)) {
      parts.push({ text: piece });
      continue;
    }
    const tail = piece.match(TRAILING)?.[0] ?? "";
    const url = tail ? piece.slice(0, -tail.length) : piece;
    if (URL.canParse(url)) parts.push({ text: url, href: url });
    else parts.push({ text: url });
    if (tail) parts.push({ text: tail });
  }
  return parts;
}

/** Text written by staff, with any pasted web addresses turned into links. */
export function Linkified({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a key={i} href={part.href} target="_blank" rel="noopener noreferrer nofollow" className="break-words font-semibold text-gold underline underline-offset-2 hover:text-gold-light">
            {part.text}
          </a>
        ) : (
          <Fragment key={i}>{part.text}</Fragment>
        )
      )}
    </>
  );
}
