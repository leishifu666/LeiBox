// Estimated from the supplied 60fps recording, not the original author's code.
export const OTP_MOTION = {
  compactWidth: 202,
  expandedWidth: 374,
  verifiedWidth: 174,
  height: 74,
  openDuration: 0.58,
  collapseDuration: 0.42,
  focusDuration: 0.2,
  verifyDelay: 1550,
  errorDuration: 680,
  ease: "back.out(1.15)",
} as const;

// The same incorrect / correct sequence shown in the reference video.
export const OTP_REPLAY: readonly [number, string][] = [
  [1000, "2"], [1250, "21"], [1500, "213"],
  [1750, "2132"], [2000, "21321"], [2250, "213212"],
  [4850, "1"], [5100, "12"], [5350, "123"],
  [5600, "1234"], [5850, "12345"], [6100, "123456"],
];
