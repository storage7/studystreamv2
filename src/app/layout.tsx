import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyStream – Private Learning Platform",
  description: "Private video streaming platform for study groups",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
