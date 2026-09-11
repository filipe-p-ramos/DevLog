import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevLog - Seus projetos em foco",
  description: "Diário de bordo de desenvolvimento, registro de decisões arquiteturais e tracking de tarefas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-[#111111] text-[#ededed]">
        {children}
      </body>
    </html>
  );
}
