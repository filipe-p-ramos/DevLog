import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Project Notes - Seus projetos em foco",
  description: "Anotações do desenvolvimento de projetos e tracking de etapas.",
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
