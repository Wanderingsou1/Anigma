import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Anigma — Unlock the Anime Universe",
  description: "Stream thousands of anime in HD. Discover new series, watch your favorites, and explore every genre. Anigma is your ultimate anime destination.",
  keywords: ["anime", "streaming", "watch anime", "anigma", "HD anime", "anime online"],
  openGraph: {
    title: "Anigma — Unlock the Anime Universe",
    description: "Stream thousands of anime in HD for free.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#08080f] text-[#f1f1f9] antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
