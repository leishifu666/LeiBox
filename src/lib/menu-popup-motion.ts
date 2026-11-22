import type { CSSProperties } from "react";

/** Shared light-rebound motion for the site's floating menus. */
export const MENU_POPUP_MOTION = {
  closed: { opacity: 0, y: -4, scale: 0.96 },
  open: { opacity: 1, y: 0, scale: 1 },
  enter: { duration: 0.28, ease: [0.34, 1.56, 0.64, 1] as const },
  exit: { duration: 0.16, ease: [0.4, 0, 1, 1] as const },
} as const;

export const MENU_POPUP_STYLE = {
  "--menu-open-duration": `${MENU_POPUP_MOTION.enter.duration}s`,
  "--menu-close-duration": `${MENU_POPUP_MOTION.exit.duration}s`,
  "--menu-open-ease": `cubic-bezier(${MENU_POPUP_MOTION.enter.ease.join(",")})`,
  "--menu-close-ease": `cubic-bezier(${MENU_POPUP_MOTION.exit.ease.join(",")})`,
  "--menu-offset": `${Math.abs(MENU_POPUP_MOTION.closed.y)}px`,
  "--menu-closed-scale": MENU_POPUP_MOTION.closed.scale,
} as CSSProperties;
