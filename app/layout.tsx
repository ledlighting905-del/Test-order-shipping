import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://china2thai-market-68.ledlighting905.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CHINA2THAI | รู้ต้นทุนก่อนกดสั่ง 1688",
  description: "มีลิงก์สินค้า 1688 แล้ว โทรหรือส่ง LINE ให้ทีมช่วยเช็กข้อมูลต้นทุนก่อนตัดสินใจสั่ง",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "CHINA2THAI | รู้ต้นทุนก่อนกดสั่ง 1688",
    description: "โทรคุยทันที หรือส่งลิงก์ 1688 ทาง LINE เพื่อเตรียมข้อมูลต้นทุนก่อนสั่ง",
    type: "website",
    url: SITE_URL,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "CHINA2THAI รู้ต้นทุนก่อนกดสั่ง 1688" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CHINA2THAI | รู้ต้นทุนก่อนกดสั่ง 1688",
    description: "โทรคุยทันที หรือส่งลิงก์ 1688 ทาง LINE",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
