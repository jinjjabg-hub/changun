import type { Metadata } from "next";
import "./globals.css";
import "@/components/sites/swadpia/swadpia.css";

export const metadata: Metadata = {
  title: "성원애드피아 홈페이지",
  description: "상업인쇄, 실사출력, 패키지, 디지털인쇄까지 종합광고의 모든 것",
  keywords: ["성원애드피아", "성원에드피아", "성원에드", "성원애드", "성원인쇄"],
  openGraph: {
    title: "성원애드피아",
    description: "상업인쇄, 실사출력, 패키지, 디지털인쇄까지 종합광고의 모든 것",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="main">{children}</body>
    </html>
  );
}
