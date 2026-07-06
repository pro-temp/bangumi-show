import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bangumi Show",
  description: "本地优先的日本动画查询工具"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
