import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "CakeDrop - Automated Birthday Celebrations for Companies",
  description:
    "CakeDrop is a B2B SaaS platform that automates birthday celebrations for companies. Never miss an employee birthday again — schedule cakes, gifts, and greetings effortlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
