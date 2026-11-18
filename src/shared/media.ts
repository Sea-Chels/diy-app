import CSS from './media.css?raw';

/** A breakpoint from media.css, so scripts switch layout at exactly the width the stylesheets do. */
export function media(name: string): MediaQueryList {
  const query = new RegExp(`@custom-media --${name} ([^;]+);`).exec(CSS)?.[1];
  if (!query) throw new Error(`media.css has no --${name}`);
  return matchMedia(query);
}
