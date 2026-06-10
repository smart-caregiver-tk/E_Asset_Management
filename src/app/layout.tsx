import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "ระบบบริหารครุภัณฑ์ E-Asset Management — เทศบาลเมืองทับกวาง",
  description: "ระบบบริหารจัดการครุภัณฑ์สำนักงาน เทศบาลเมืองทับกวาง อำเภอแก่งคอย จังหวัดสระบุรี",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
