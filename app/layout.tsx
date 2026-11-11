import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FB Clínica | Fabiana Bruinsma",
  description: "Gestão clínica de Pilates, Fisioterapia e Osteopatia.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
