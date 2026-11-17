import "./globals.css";
export const metadata = { title: "Nexvia Workspace", description: "Real-time collaborative workspace" };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
