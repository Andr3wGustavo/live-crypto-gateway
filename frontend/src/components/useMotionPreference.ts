"use client";

/**
 * One motion contract for the whole product.
 *
 * Motion is the rule, not an option: the campaign is a motion-led brand
 * experience, so the interface no longer exposes a pause switch. Consumers
 * still read `enabled` to gate imperative animation loops; it is always true.
 * Keeping the hook means the marketing landing and the product shell share a
 * single contract if a future release ever reintroduces a preference.
 */
export function useMotionPreference() {
  return { enabled: true, reduced: false, override: true as boolean | null };
}
