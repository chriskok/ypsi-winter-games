import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ypsilanti Winter Games',
  description: 'Find hidden codes around Ypsilanti, Michigan. Earn points, win prizes! Join the community scavenger hunt today!',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  verification: {
    google: 'n4nKGmOjslkmSc_6Tz3bjDdUynGwFEjNiXdLK49CnxM',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
