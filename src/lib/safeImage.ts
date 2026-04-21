/**
 * Validates that a string is a proper image URL/path and not something
 * that would crash React if accidentally used as a JSX element type.
 *
 * Guards against: InvalidCharacterError from document.createElement()
 * when a URL string is mistakenly passed as a React component/tag.
 */
export function isValidImageSrc(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  if (!src.trim()) return false;

  // Must start with /, http://, https://, or data:
  return (
    src.startsWith('/') ||
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:')
  );
}

/**
 * Returns a safe image src string or a fallback placeholder.
 * Prevents invalid URLs from reaching <Image /> or <img /> components.
 */
export function safeSrc(src: unknown, fallback = '/placeholder.png'): string {
  return isValidImageSrc(src) ? src : fallback;
}
