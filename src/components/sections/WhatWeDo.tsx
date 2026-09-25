'use client'

import { homepage } from '@/data'

/** 4px square at each corner of a panel — the original tags them with data-dot. */
function CornerDots({ corners }: { corners: ('tl' | 'tr' | 'bl' | 'br')[] }) {
  const position = {
    tl: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    tr: 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    bl: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    br: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  }
  return (
    <>
      {corners.map((c) => (
        <div
          key={c}
          data-dot="true"
          className={`pointer-events-none absolute h-[4px] w-[4px] bg-black ${position[c]}`}
        />
      ))}
    </>
  )
}

function Panel({
  title,
  html,
  background,
  corners,
}: {
  title: string
  html: string
  background: string
  corners: ('tl' | 'tr' | 'bl' | 'br')[]
}) {
  return (
    <div className={`relative p-whatwedo-box-p ${background}`}>
      <CornerDots corners={corners} />
      <h3 className="text-label text-black">{title}</h3>
      <div
        className="whatwedo-content text-whatwedo-item mt-whatwedo-box-gap text-black"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

/**
 * Services / Clients / Athletes. Three tinted panels that interlock — the first two
 * sit side by side from md up, the third spans both beneath. Corner dots are only
 * drawn where a panel edge is exposed, which is why each panel gets a different set.
 */
export function WhatWeDo() {
  return (
    <div className="relative z-20 mt-gap-xl pb-whatwedo-top">
      <div className="grid-layout">
        <h2 className="text-heading-xl col-span-5 text-left text-black md:col-span-8 md:col-start-3">
          {homepage.homeWhatwedoTitle}
        </h2>
      </div>

      <div className="grid-layout mt-whatwedo-top">
        <div className="relative z-10 col-span-5 flex flex-col md:col-span-8 md:col-start-3 md:flex-row">
          <div className="relative z-10 flex w-full flex-col justify-end md:w-1/2">
            <Panel
              title={homepage.homeWhatwedoServiceTitle}
              html={homepage.homeWhatwedoServiceText}
              background="bg-whatwedo-service"
              corners={['tl', 'tr', 'bl', 'br']}
            />
          </div>
          <div className="relative w-full md:w-1/2">
            <Panel
              title={homepage.homeWhatwedoClientTitle}
              html={homepage.homeWhatwedoClientContent}
              background="bg-whatwedo-client"
              corners={['tl', 'tr', 'br']}
            />
          </div>
        </div>
      </div>

      <div className="grid-layout relative">
        <div className="relative col-span-5 md:col-span-8 md:col-start-3">
          <Panel
            title={homepage.homeWhatwedoAthleteTitle}
            html={homepage.homeWhatwedoAthleteContent}
            background="bg-whatwedo-athlete"
            corners={['bl', 'br']}
          />
        </div>
      </div>
    </div>
  )
}
