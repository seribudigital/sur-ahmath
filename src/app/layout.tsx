import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Sur'ahMath | Master Numerasi & Kecepatan Berhitung",
    template: "%s | Sur'ahMath",
  },
  description: "Platform adaptif latihan numerasi, perkalian, dan pembagian cepat berteknologi untuk siswa SD, SMP, SMA. Tingkatkan kecepatan dan akurasi berhitung secara interaktif.",
  keywords: ["numerasi", "matematika cepat", "perkalian", "pembagian", "surahmath", "latihan matematika interaktif", "edutech"],
  authors: [{ name: "MTs-MA Al-Khoir Cikande" }],
  openGraph: {
    title: "Sur'ahMath | Master Numerasi & Kecepatan Berhitung",
    description: "Platform adaptif latihan numerasi, perkalian, dan pembagian cepat berteknologi untuk siswa SD, SMP, SMA.",
    siteName: "Sur'ahMath",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
