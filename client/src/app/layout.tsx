import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { QueryProviders } from "@/components/QueryProvider";

export const metadata: Metadata = {
  title: "Chatbot App",
  description: "Real-time chatbot system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProviders>
          <Providers>{children}</Providers>
        </QueryProviders>
      </body>
    </html>
  );
}
