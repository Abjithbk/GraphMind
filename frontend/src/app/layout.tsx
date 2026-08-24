import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Import Inter font
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans", // This links it to your globals.css
  display: "swap",
});

export const metadata: Metadata = {
  title: "GraphRAG | Literature Review Engine",
  description: "Synthesize academic literature through structured knowledge graphs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      {/* We add 'dark' here to force dark mode by default */}
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}