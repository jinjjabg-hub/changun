import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { TopBanner } from "@/components/site/TopBanner";

export const metadata: Metadata = {
  title: "창운 | 인쇄·판촉물 주문 (시연 데모)",
  description: "명함, 스티커, 전단, 현수막, 배너를 옵션 선택만으로 바로 견적 확인하는 인쇄 주문 사이트 시연 데모입니다. 표시된 가격은 샘플입니다.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <TopBanner />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
