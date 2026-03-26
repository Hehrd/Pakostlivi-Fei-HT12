import { Geist, Geist_Mono } from "next/font/google";
import AppToaster from "@/components/AppToaster";
import MockServiceWorker from "@/components/MockServiceWorker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "HackEarly Auth",
    template: "%s | HackEarly Auth",
  },
  description: "White and green themed authentication pages built with Tailwind CSS.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MockServiceWorker>{children}</MockServiceWorker>
        <AppToaster />
      </body>
    </html>
  );
}
