/** Shared by the site and scripts/images (no server-only imports here). */
export const PRODUCT_IMAGE_BUCKET = "product-images";

/**
 * Bump when scripts/images/process-image.ts changes its output. The nightly
 * sync then redoes every photo, and the new files get new URLs.
 */
export const PROCESSOR_VERSION = 1;

/** A photo whose longest side is under this is treated as low resolution. */
export const LOW_RES_PX = 500;
