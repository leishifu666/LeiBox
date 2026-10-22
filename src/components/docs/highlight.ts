import {
  codeToHtml,
  type BundledLanguage,
  type ThemeRegistration,
} from "shiki";

function monochrome(
  name: string,
  colors: {
    base: string;
    strong: string;
    muted: string;
    faint: string;
    bg: string;
  },
): ThemeRegistration {
  const { base, strong, muted, faint, bg } = colors;
  return {
    name,
    type: name.endsWith("dark") ? "dark" : "light",
    colors: {
      "editor.background": bg,
      "editor.foreground": base,
    },
    settings: [
      { settings: { foreground: base } },
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: faint },
      },
      {
        scope: [
          "string",
          "string.template",
          "punctuation.definition.string",
          "constant.numeric",
          "constant.language",
          "constant.character",
        ],
        settings: { foreground: muted },
      },
      {
        scope: [
          "keyword",
          "storage.type",
          "storage.modifier",
          "keyword.control",
          "keyword.operator.new",
          "keyword.operator.expression",
        ],
        settings: { foreground: strong },
      },
      {
        scope: [
          "entity.name.function",
          "entity.name.type",
          "entity.name.class",
          "entity.name.tag",
          "support.function",
          "support.class",
          "support.type",
        ],
        settings: { foreground: strong },
      },
      {
        scope: [
          "punctuation",
          "meta.brace",
          "keyword.operator",
          "punctuation.definition.tag",
        ],
        settings: { foreground: muted },
      },
      {
        scope: [
          "variable",
          "variable.parameter",
          "entity.other.attribute-name",
          "support.variable",
        ],
        settings: { foreground: base },
      },
    ],
  };
}

const monoLight = monochrome("canvas-mono-light", {
  base: "#404040",
  strong: "#0a0a0a",
  muted: "#737373",
  faint: "#a3a3a3",
  bg: "#ffffff",
});

const monoDark = monochrome("canvas-mono-dark", {
  base: "#b3b3b3",
  strong: "#fafafa",
  muted: "#8a8a8a",
  faint: "#595959",
  bg: "#0a0a0a",
});

export async function highlight(source: string, lang: BundledLanguage) {
  return codeToHtml(source, {
    lang,
    themes: {
      light: monoLight,
      dark: monoDark,
    },
    defaultColor: false,
  });
}
