import { GradientBackground } from "@/components/ui/bloom-field-gradient"

// Reference usage from the component's docs. Not mounted anywhere — this is a
// single-page app with no routing — but kept as the canonical example of how
// to scope the gradient to a container rather than the whole viewport.
export default function GradientBackgroundDemo() {
  return (
    <div className="relative h-[440px] w-full overflow-hidden rounded-xl">
      <GradientBackground className="h-full w-full" />
    </div>
  )
}
