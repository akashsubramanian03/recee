'use client'

import { MediaItem } from './MediaItem'
import type { ContentBlock } from '@/data'

/** Column span per tile, driven by how many tiles share the row. */
const SPAN_BY_COUNT: Record<number, string> = {
  1: 'col-span-5 md:col-start-3 md:col-span-8',
  2: 'col-span-5 md:col-span-6',
  3: 'col-span-5 md:col-span-4',
}

const RICH_TEXT =
  '[&_p]:text-[1.6rem] [&_ul]:text-[1.6rem] [&_ol]:text-[1.6rem] [&_li]:text-[1.6rem] ' +
  '[&_p]:leading-[1.2] [&_ul]:leading-[1.2] [&_ol]:leading-[1.2] [&_li]:leading-[1.2] ' +
  '[&_strong]:font-bold [&_em]:italic [&_ul]:list-[square] [&_ul]:pl-list-indent ' +
  '[&_ol]:list-decimal [&_ol]:pl-list-indent [&_li]:mt-gap-xs [&_li:first-child]:mt-0 ' +
  '[&_a]:underline [&_a]:underline-offset-2'

export function ProjectContent({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="relative flex flex-col gap-section bg-black pt-section pb-section">
      {blocks.map((block) => {
        switch (block.__typename) {
          case 'BlockContentRecord':
            return (
              <section key={block.id} className="grid-layout md:py-block-py">
                <div className="col-span-5 mt-block-mt text-white md:col-span-8 md:col-start-3">
                  {block.title && <h2 className="text-heading-xl mb-gap-lg">{block.title}</h2>}
                  <div className={RICH_TEXT} dangerouslySetInnerHTML={{ __html: block.text }} />
                </div>
              </section>
            )

          case 'BlockSingleTitleRecord':
            return (
              <section key={block.id} className="grid-layout md:py-block-py">
                <h2 className="text-heading-xl col-span-5 text-white md:col-span-8 md:col-start-3">
                  {block.title}
                </h2>
              </section>
            )

          case 'BlockQuoteRecord':
            return (
              <section key={block.id} className="grid-layout md:py-block-py">
                <blockquote className="col-span-5 text-white md:col-span-8 md:col-start-3">
                  <p className="text-heading-xl">{block.text}</p>
                  <cite className="text-label mt-gap-lg block w-quote-author-w not-italic">
                    {block.author}
                  </cite>
                </blockquote>
              </section>
            )

          case 'BlockMediaGridRecord': {
            const count = Math.min(3, block.medias.length) as 1 | 2 | 3
            return (
              <section
                key={block.id}
                className={`grid-layout ${count > 1 ? 'gap-y-grid-gutter' : ''}`}
              >
                {block.medias.map((media, i) => (
                  <MediaItem
                    key={`${block.id}-${i}`}
                    media={media}
                    className={SPAN_BY_COUNT[count] ?? SPAN_BY_COUNT[3]}
                  />
                ))}
              </section>
            )
          }

          default:
            return null
        }
      })}
    </div>
  )
}
