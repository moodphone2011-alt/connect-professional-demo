import type { Metadata, Viewport } from "next";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/hooks/use-theme";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CONNECT — Employee Experience Portal",
    template: "%s · CONNECT",
  },
  description:
    "CONNECT brings attendance, leave, tasks, company knowledge and team insight into one workspace, with an AI assistant that answers from your own data.",
  applicationName: "CONNECT",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c11" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
