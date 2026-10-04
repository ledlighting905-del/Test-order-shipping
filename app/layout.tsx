import type { Metadata, Viewport } from "next";
import "./globals.css";
import { contact } from "../config/contact";
import { SEO, SITE_NAME, SITE_URL, TRACKING } from "../config/site";

const OG_IMAGE = { url: "/og.png", width: 1200, height: 630, alt: "CHINA2THAI รู้ต้นทุนก่อนกดสั่ง 1688" };
const GTM_ID = /^GTM-[A-Z0-9]+$/.test(TRACKING.GTM_ID) ? TRACKING.GTM_ID : null;
const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@700;800;900&family=Noto+Sans+Thai:wght@400;500;600;700;800;900&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SEO.title,
  description: SEO.description,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: SEO.title,
    description: SEO.ogDescription,
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    locale: "th_TH",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.title,
    description: SEO.ogDescription,
    images: [OG_IMAGE.url],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fffaf5",
};

function structuredData() {
  const telephone = contact.phone.href?.replace(/^tel:/, "");
  const lineUrl = contact.line.href;
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: SEO.description,
    areaServed: { "@type": "Country", name: "Thailand" },
    ...(telephone || lineUrl
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer service",
              areaServed: "TH",
              availableLanguage: ["th"],
              ...(telephone ? { telephone } : {}),
              ...(lineUrl ? { url: lineUrl } : {}),
            },
          ],
        }
      : {}),
    ...(lineUrl ? { sameAs: [lineUrl] } : {}),
  };
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="stylesheet" href={FONT_STYLESHEET} />
        {GTM_ID ? (
          // eslint-disable-next-line @next/next/next-script-for-ga -- ไม่มี @next/third-parties ในโปรเจกต์; โหลด GTM เฉพาะเมื่อใส่ GTM_ID จริง
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
            }}
          />
        ) : null}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData() }} />
      </head>
      <body>
        {GTM_ID ? (
          <noscript>
            <iframe title="Google Tag Manager" src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} />
          </noscript>
        ) : null}
        {children}
      </body>
    </html>
  );
}
