import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GRID — Personal Life OS",
  description: "Your sovereign life operating system. Habits, missions, body intelligence, and AI coaching.",
  applicationName: "GRID",
  appleWebApp: { capable: true, title: "GRID", statusBarStyle: "black-translucent" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ background: '#0A0A0F', minHeight: '100vh' }}>{children}</body>
    </html>
  );
}
