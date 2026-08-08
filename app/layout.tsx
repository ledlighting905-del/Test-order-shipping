import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "CHINA2THAI | สั่งของจีน นำเข้าไทย ครบจบในที่เดียว",
    description: "ค้นหาสินค้าจาก Taobao, 1688 และ Tmall พร้อมทีมจีนช่วยเช็กร้าน สั่งซื้อ และนำเข้าไทย ขอประเมินต้นทุนฟรี",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      title: "CHINA2THAI | อยากได้ของจีน เราเอามาให้",
      description: "ส่งลิงก์สินค้า รับใบเสนอราคา และนำเข้าจีน-ไทยครบจบในทีมเดียว",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og.png`, width: 1731, height: 909, alt: "CHINA2THAI อยากได้ของจีน เราเอามาให้" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "CHINA2THAI",
      description: "สั่งของจีนง่ายกว่าที่คิด",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
