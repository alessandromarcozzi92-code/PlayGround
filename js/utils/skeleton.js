/**
 * Skeleton loading utilities.
 *
 * Provides helpers to manage the `.skeleton` shimmer placeholder class
 * on image wrappers. The class is removed once the image finishes loading.
 *
 * @module utils/skeleton
 */

/**
 * Binds a load listener on an image to remove the `.skeleton` class
 * from its closest skeleton-bearing ancestor.
 *
 * @param {HTMLImageElement|null} img - The image element.
 */
export const bindSkeletonRemoval = (img) => {
  if (!img) return;
  img.addEventListener('load', () => {
    img.closest('.skeleton')?.classList.remove('skeleton');
  }, { once: true });
};
