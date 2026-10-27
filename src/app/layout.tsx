import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import { ThemeFavicon } from "@/components/common/theme-favicon";
import { ThemeProvider } from "@/components/common/theme-provider";
import { UrlStateProvider } from "@/components/common/url-state-provider";
import { LanguageProvider } from "@/components/common/language-provider";
import { LogoTransitionProvider } from "@/components/common/logo-transition-provider";
import { ComponentEntryTransition } from "@/components/common/component-entry-transition";
import { SITE_URL } from "@/lib/site-url";
const DESCRIPTION =
  "LeiBox is a personal collection of UI inspiration, creative components, and practical design references for people and AI assistants.";

const ORIGIN_TRIAL_TOKEN =
  process.env.NEXT_PUBLIC_HTML_IN_CANVAS_OT_TOKEN ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "LeiBox — UI inspiration and component collection",
    template: "%s | LeiBox",
  },
  description: DESCRIPTION,
  applicationName: "LeiBox",
  authors: [{ name: "雷师傅", url: "https://github.com/leishifu666" }],
  creator: "LeiBox",
  keywords: [
    "component library",
    "react component library",
    "vue component library",
    "svelte component library",
    "webgl component library",
    "webgpu component library",
    "webgpu components",
    "vgpu",
    "wgsl shaders",
    "canvas components",
    "ui components",
    "canvas",
    "webgl",
    "webgpu",
    "html-in-canvas",
    "creative ui",
    "shader effects",
    "web animations",
    "react",
    "vue",
    "svelte",
    "shadcn registry",
  ],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "LeiBox",
    locale: "zh_CN",
    images: [{ url: "/leibox-og.png?v=ei-20261023", width: 1200, height: 630, alt: "LeiBox" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/leibox-og.png?v=ei-20261023"],
  },
  icons: {
    icon: [{ url: "/favicon.svg?v=leibox-white-20261022", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  other: {
    "font-attribution": "Chinese typeface: MiSans VF by Xiaomi. https://hyperos.mi.com/font/zh/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      {ORIGIN_TRIAL_TOKEN ? (
        <head>
          <meta httpEquiv="origin-trial" content={ORIGIN_TRIAL_TOKEN} />
        </head>
      ) : null}
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ThemeProvider>
          <ThemeFavicon />
          <LanguageProvider><UrlStateProvider><LogoTransitionProvider><ComponentEntryTransition>{children}</ComponentEntryTransition></LogoTransitionProvider></UrlStateProvider></LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
