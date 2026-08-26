import "./globals.css";

export const metadata = {
  title: "DirectAgri",
  description: "Direct farm-to-market operating system for SIH26033"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
