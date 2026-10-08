/** Minimal allowlist sanitizer for rich-text HTML (no new dependency).
 * Strips script/style/iframe/object/embed/link, event handlers, and javascript: URLs. */
export function sanitizeAnnouncementHtml(dirty: string): string {
  if (!dirty) return "";
  try {
    const doc = new DOMParser().parseFromString(dirty, "text/html");
    const disallowed = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "LINK", "META", "BASE", "FORM", "INPUT", "BUTTON"]);
    doc.querySelectorAll("*").forEach((el) => {
      if (disallowed.has(el.tagName)) {
        el.remove();
        return;
      }
      for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith("on") || value.startsWith("javascript:")) {
          el.removeAttribute(attr.name);
        }
        if ((name === "href" || name === "src" || name === "xlink:href") && /^(javascript|data:text\/html|vbscript):/i.test(attr.value.trim())) {
          el.removeAttribute(attr.name);
        }
      }
      if (el.tagName === "A" && !(el as HTMLAnchorElement).getAttribute("rel")) {
        (el as HTMLAnchorElement).setAttribute("rel", "noopener noreferrer");
      }
    });
    return doc.body.innerHTML;
  } catch {
    return "";
  }
}
