import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { BgmProvider } from "@/features/bgm/bgm-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "あのころミュージアム | 記憶をめぐる展示室",
  description: "世代を越えて、懐かしい記憶に出会えるオンラインミュージアム。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>
        <BgmProvider>{children}</BgmProvider>
        <Analytics />
      </body>
    </html>
  );
}
