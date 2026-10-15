import { Fragment } from "react";

/** Renders the inline marks content may use: **gras**, *italique* and `code`. Line breaks become <br>. */
export function Rich({ text, as: Tag = "span", className = "" }: { text: string; as?: "span" | "p" | "div"; className?: string }) {
  return <Tag className={`rich ${className}`}>{renderInline(text)}</Tag>;
}

export function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|(?<![\w*])\*[^\s*][^*\n]*?(?<=\S)\*(?![\w*])|\n)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i}>{p.slice(1, -1)}</code>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    if (p === "\n") return <br key={i} />;
    return <Fragment key={i}>{p}</Fragment>;
  });
}
