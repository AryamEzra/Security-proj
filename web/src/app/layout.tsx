import "./../styles/globals.css";
import ThemeToggle from "../components/ThemeToggle";
import type { ReactNode } from "react";
import Link from "next/link";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-6xl mx-auto p-6">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Session Security Hardener</h1>
            <div className="flex gap-2">
              <Link href="/signup" className="btn">
                Sign Up
              </Link>
              <Link href="/login" className="btn">
                Simulate Login
              </Link>
              <Link href="/admin" className="btn">
                Admin
              </Link>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
