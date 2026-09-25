import homepageJson from './homepage.json'
import navigationJson from './navigation.json'
import projectsJson from './projects.json'

export type Media = {
  url: string
  alt: string | null
  width: number
  height: number
  mimeType: string
  video?: {
    thumbnailUrl?: string
    mp4Url?: string
    mp4MediumUrl?: string
    muxPlaybackId?: string
  } | null
}

export type ResponsiveMedia = {
  mimeType: string
  responsiveImage?: {
    src: string
    srcSet: string
    width: number
    height: number
    alt: string | null
    base64?: string
  } | null
  video?: Media['video']
}

export type CarouselItem = {
  id: string
  text: string
  content: string
  media: ResponsiveMedia
}

export type ContentBlock =
  | { __typename: 'BlockContentRecord'; id: string; title: string; text: string; columns: boolean }
  | { __typename: 'BlockMediaGridRecord'; id: string; medias: Media[] }
  | { __typename: 'BlockQuoteRecord'; id: string; text: string; author: string }
  | { __typename: 'BlockSingleTitleRecord'; id: string; title: string }

export type Project = {
  id: string
  projectTitle: string
  projectSlug: string
  projectClient: string
  projectInformations: string
  projectDate: string
  projectCover: Media
  projectPoster: Media
  pageContent: ContentBlock[]
  seo?: { title: string; description: string }
}

export type Homepage = {
  homeHeroTagline: string
  homeHeroHint: string
  homeMosaicMedias: Media[]
  homeProjectItems: { id: string }[]
  homeWorldwideOverline: string
  homeWorldwideTitle: string
  homeWorldwideCarouselTitle: string
  homeWorldwideCarousel: CarouselItem[]
  homeWhatwedoTitle: string
  homeWhatwedoServiceTitle: string
  homeWhatwedoServiceText: string
  homeWhatwedoClientTitle: string
  homeWhatwedoClientContent: string
  homeWhatwedoAthleteTitle: string
  homeWhatwedoAthleteContent: string
  homeFooterTextLeft: string
  homeFooterTagline: string
  homeFooterTextRight: string
  seo: { title: string; description: string; image?: Media }
}

export type Navigation = {
  headerNavigation: { title: string; url: string }[]
  footerCopyright: string
  contactAddress: string
  contactEmails: { title: string; url: string }[]
  contactSocialInstagram: { title: string; url: string }
  contactSocialVimeo: { title: string; url: string }
  contactSocialLinkedin: { title: string; url: string }
}

export const homepage = homepageJson as unknown as Homepage
export const navigation = navigationJson as unknown as Navigation
export const projects = projectsJson as unknown as Project[]

export const getProject = (slug: string) => projects.find((p) => p.projectSlug === slug)

/** Year shown on the project grid — the CMS stores a full ISO date. */
export const projectYear = (p: Project) => new Date(p.projectDate).getFullYear()

/** Prefer the mirrored Mux master, fall back to the DatoCMS original. */
export const videoSrc = (m: Media) => m.video?.mp4Url || m.video?.mp4MediumUrl || m.url

export const isVideo = (m: { mimeType: string }) => m.mimeType.startsWith('video/')
