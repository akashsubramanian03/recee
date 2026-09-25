'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { gsap } from '@/lib/gsap'
import { CloseIcon } from '@/components/icons'
import { navigation } from '@/data'
import { useUIStore } from '@/stores/useUIStore'
import { setScrollLocked } from '@/lib/lenis'

/** Email row whose address swaps to "Copied" on click. */
function CopyEmail({ label, email }: { label: string; email: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Clipboard can be blocked; still show the confirmation so the UI isn't stuck.
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex flex-col items-center md:items-start">
      <p className="text-heading-md text-black">{label}</p>
      <button
        type="button"
        onClick={copy}
        className="text-body-md relative cursor-pointer leading-[1.3] text-black max-md:[&_span]:!text-center"
      >
        <span className="transition-opacity duration-200" style={{ opacity: copied ? 0 : 1 }}>
          {email}
        </span>
        <span
          className="absolute inset-0 text-left transition-opacity duration-200"
          style={{ opacity: copied ? 1 : 0 }}
        >
          Copied
        </span>
      </button>
    </div>
  )
}

/**
 * Contact card. Flips in on a 800px perspective â€” the card itself is
 * backface-hidden and rotated, so it reads as a physical card turning over.
 */
export function ContactModal() {
  const open = useUIStore((s) => s.contactOpen)
  const close = useUIStore((s) => s.closeContact)
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setScrollLocked(open)
    const root = rootRef.current
    const card = cardRef.current
    if (!root || !card) return

    if (open) {
      root.style.display = 'flex'
      gsap.killTweensOf([root, card])
      gsap.to(root, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(
        card,
        { rotateY: -95, opacity: 0 },
        { rotateY: 0, opacity: 1, duration: 0.75, ease: 'power3.out' },
      )
    } else {
      gsap.killTweensOf([root, card])
      gsap.to(card, { rotateY: 95, opacity: 0, duration: 0.45, ease: 'power3.in' })
      gsap.to(root, {
        opacity: 0,
        duration: 0.35,
        delay: 0.1,
        onComplete: () => {
          root.style.display = 'none'
        },
      })
    }
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] hidden items-center justify-center bg-black/30"
      style={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Contact"
    >
      <div
        className="absolute inset-0 z-10 flex items-center justify-center p-[12px]"
        style={{ perspective: '800px', transformStyle: 'preserve-3d' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div
          ref={cardRef}
          className="relative h-full max-h-full w-full max-w-full bg-white [backface-visibility:hidden] md:contact-card-min-h md:contact-card-w md:h-auto"
        >
          <div className="relative grid h-full w-full grid-cols-5 grid-rows-[auto_1fr_auto] gap-[2.4rem] gap-y-[5.5rem] px-grid-margin pb-grid-margin md:grid-cols-6 md:grid-rows-[auto_1fr] md:min-h-0 md:p-[2.4rem]">
            <h2 className="text-heading-xl order-1 col-span-5 mt-[11rem] text-left leading-[0.8em] text-black md:col-span-6 md:mt-0">
              Available worldwide
            </h2>

            <div className="absolute top-[1.2rem] left-[1.2rem] order-2 col-span-2 h-auto w-[45px] flex-col items-start justify-end md:relative md:top-[initial] md:left-[initial] md:flex md:w-auto">
              <Image src="/images/sign.svg" alt="" width={172} height={254} style={{ height: 'auto' }} />
            </div>

            <div className="order-4 col-span-5 flex flex-row justify-between text-left md:order-3 md:col-span-2 md:flex-col md:items-start md:justify-between">
              <div
                className="text-body-md text-black [&_p]:leading-[1.2em] [&_strong]:font-bold [&_strong]:uppercase [&_strong]:tracking-[-0.01em]"
                dangerouslySetInnerHTML={{ __html: navigation.contactAddress }}
              />
              <div className="flex flex-col items-start justify-end">
                {[navigation.contactSocialInstagram, navigation.contactSocialVimeo]
                  .filter((s) => s?.url)
                  .map((s) => (
                    <a
                      key={s.title}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-heading-md text-black"
                    >
                      {s.title}
                    </a>
                  ))}
              </div>
            </div>

            <div className="order-3 col-span-5 flex flex-col gap-y-[2.4rem] self-center text-center md:order-4 md:col-span-2 md:self-auto md:justify-self-start md:text-left">
              {navigation.contactEmails.map((e) => (
                <CopyEmail key={e.title} label={e.title} email={e.url} />
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-[1.2rem] right-[1.2rem] cursor-pointer md:top-[2.4rem] md:right-[2.4rem]"
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
