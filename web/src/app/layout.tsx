import "./../styles/globals.css";
import ThemeToggle from "../components/ThemeToggle";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-6xl mx-auto p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Session Security Hardener</h1>
            <div className="flex gap-2">
              <a className="btn" href="/login">Simulate Login</a>
              <a className="btn" href="/admin">Admin</a>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
