import { Geist, Geist_Mono } from "next/font/google";
import AppToaster from "@/components/AppToaster";
import AppChrome from "@/components/AppChrome";
import { AuthProvider } from "@/components/AuthProvider";
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
    default: "MunchMun",
    template: "%s | MunchMun",
  },
  description:
    "MunchMun helps users discover surplus meals, manage preferences, and coordinate pickups.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MockServiceWorker>
          <AuthProvider>
            <AppChrome>{children}</AppChrome>
          </AuthProvider>
        </MockServiceWorker>
        <AppToaster />
      </body>
    </html>
  );
}
