/**
 * Whether any of the given links represents the current route.
 * Trailing slashes are ignored; nested routes (e.g. /employees/123)
 * keep their parent menu item active.
 */
export function isMenuActive(pathname: string, ...links: string[]): boolean {
  const current = pathname.replace(/\/+$/, "") || "/";

  return links.some((link) => {
    const target = link.replace(/\/+$/, "") || "/";
    return current === target || current.startsWith(`${target}/`);
  });
}
