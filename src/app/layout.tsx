import type { Metadata } from "next";
import "./globals.css";
import { CompanyProvider } from "@/contexts/CompanyContext";

export const metadata: Metadata = {
  title: "نظام ERP SaaS | إدارة موارد المؤسسات",
  description: "نظام ERP متكامل لإدارة الحسابات والمخازن والمبيعات والمشتريات وشركات الشحن وربط Shopify",
  keywords: ["ERP", "نظام محاسبي", "إدارة مخازن", "فواتير", "شوبيفاي", "شركات شحن"],
  authors: [{ name: "ERP SaaS Team" }],
  openGraph: {
    title: "نظام ERP SaaS",
    description: "نظام ERP متكامل لإدارة أعمالك",
    type: "website",
    locale: "ar_EG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased min-h-screen">
        <CompanyProvider>
          {children}
        </CompanyProvider>
      </body>
    </html>
  );
}

