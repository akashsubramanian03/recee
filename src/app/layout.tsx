import type { Metadata } from 'next'
import './globals.css'
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider'
import { PointerProvider } from '@/components/providers/PointerProvider'
import { Header } from '@/components/layout/Header'
import { ContactModal } from '@/components/layout/ContactModal'
import { MobileMenu } from '@/components/layout/MobileMenu'
import { homepage } from '@/data'

export const metadata: Metadata = {
  title: homepage.seo?.title ?? 'Podium | Creative Studio',
  description: homepage.seo?.description,
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/*
        body is black on purpose: the hero's white "page" is painted by the WebGL
        sheet, and the hole punched in it reveals this black underneath.
      */}
      <body className="bg-black">
        <SmoothScrollProvider>
          <PointerProvider />
          <MobileMenu />
          <Header />
          {children}
          <ContactModal />
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
