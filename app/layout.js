import "./globals.css";

export const metadata = {
  title: "ITD-CRMS",
  description: "Compliance & Requirements Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}