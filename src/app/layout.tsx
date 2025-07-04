import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CDC Tauri + Next.js Starterkit',
  description: 'A modern desktop application built with Tauri, Next.js 15+, TypeScript, and Tailwind CSS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="desktop-app">
        <div className="min-h-screen bg-background text-foreground">
          {children}
        </div>
      </body>
    </html>
  )
}