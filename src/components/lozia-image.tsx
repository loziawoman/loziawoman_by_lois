import Image, { type ImageProps } from 'next/image';

type LoziaImageProps = Omit<ImageProps, 'src'> & { src?: string | null };

/**
 * next/image for LOZIA pages.
 *
 * - Files in /public go through Next's optimiser (resized, modern formats).
 * - Anything else (a hosted URL an admin typed in, or a recoloured data: image) is shown as-is, so no host allow-list is needed.
 * - A piece with no image renders nothing; its container already has a placeholder background.
 */
export function LoziaImage({ src, alt, ...props }: LoziaImageProps) {
  if (!src) return null;
  const optimisable = src.startsWith('/') && !src.startsWith('//');
  return <Image src={src} alt={alt} unoptimized={!optimisable} {...props} />;
}
