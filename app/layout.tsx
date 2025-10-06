import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Prediction.live",
  description: "Don't watch e-sport. Predict it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        {/* <script src="http://localhost:8097"></script> */}
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} dark bg-black text-white`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
