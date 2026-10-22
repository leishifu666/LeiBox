import type { Metadata } from "next";

import { CelebrateClient } from "@/components/celebrate/celebrate-client";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export const metadata: Metadata = {
  title: "Use Canvas UI to celebrate open source",
  description:
    "Turn any GitHub repository's star count into a short animated video, rendered live in your browser with Canvas UI.",
  alternates: { canonical: "/celebrate" },
  openGraph: {
    title: "Use Canvas UI to celebrate open source",
    description:
      "Turn any GitHub repository's star count into a short animated video, rendered live in your browser with Canvas UI.",
    url: "/celebrate",
    images: [
      {
        url: "/og-celebrate.png",
        width: 1200,
        height: 630,
        alt: "A Canvas UI star milestone card reading 4,000 Stars on GitHub, wrapped in flames.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-celebrate.png"],
  },
};

export default function CelebratePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <CelebrateClient />
      </main>
      <Footer />
    </>
  );
}
