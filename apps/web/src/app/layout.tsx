import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea Realizer",
  description: "Turn your ideas into reality with AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
