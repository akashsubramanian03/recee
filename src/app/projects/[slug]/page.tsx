import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { projects, getProject } from '@/data'
import { ProjectHero } from '@/components/project/ProjectHero'
import { ProjectContent } from '@/components/project/ProjectContent'
import { NextProject } from '@/components/project/NextProject'

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.projectSlug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) return {}
  return {
    title: project.seo?.title ?? `${project.projectTitle} — ${project.projectClient}`,
    description: project.seo?.description,
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getProject(slug)
  if (!project) notFound()

  const index = projects.findIndex((p) => p.projectSlug === slug)
  const next = projects[(index + 1) % projects.length]

  return (
    <main className="relative">
      <ProjectHero project={project} />
      <ProjectContent blocks={project.pageContent} />
      {next && next.projectSlug !== slug && <NextProject project={next} />}
    </main>
  )
}
