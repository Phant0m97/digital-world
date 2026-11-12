/** Public URL for a file in `public/`, respecting the GitHub Pages base. */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base}${path.replace(/^\//, "")}`;
}
