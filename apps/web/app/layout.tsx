import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "AETHERON — Your World. Your Intelligence.", description: "A personal executive intelligence workspace, powered by EliteAxis Global.", applicationName: "AETHERON", themeColor: "#070910" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
