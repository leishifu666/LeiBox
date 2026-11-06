import siteAssets from '@/data/site-motion.json';
const FONT_STYLESHEET_ID = "leibox-chinese-fonts";
const FONT_STYLESHEET_URL = siteAssets.chineseFontStylesheet;

export function loadChineseFonts(document: Document) {
  if (document.getElementById(FONT_STYLESHEET_ID)) return;
  const link = document.createElement("link");
  link.id = FONT_STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = FONT_STYLESHEET_URL;
  document.head.appendChild(link);
}

// Resolve the saved language before Chinese server-rendered text can request fonts.
// The provider repeats the check after hydration and when switching languages.
export const FONT_BOOTSTRAP_SCRIPT = `(function(){var locale="zh";try{locale=localStorage.getItem("leibox:locale")==="en"?"en":"zh";}catch{}document.documentElement.lang=locale==="en"?"en":"zh-CN";document.documentElement.dataset.locale=locale;if(locale==="zh"){var link=document.createElement("link");link.id=${JSON.stringify(FONT_STYLESHEET_ID)};link.rel="stylesheet";link.href=${JSON.stringify(FONT_STYLESHEET_URL)};document.head.appendChild(link);}})();`;
