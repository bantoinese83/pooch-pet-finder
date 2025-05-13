import type { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "@/lib/constants"
import { HowItWorksContent } from "@/components/how-it-works-content"

export const metadata: Metadata = {
  title: `How It Works | ${SITE_NAME}`,
  description: "Learn how POOCH helps reunite lost pets with their owners using advanced AI technology.",
  openGraph: {
    title: `How It Works | ${SITE_NAME}`,
    description: "Learn how POOCH helps reunite lost pets with their owners using advanced AI technology.",
    url: `${SITE_URL}/how-it-works`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/api/og?title=How It Works`,
        width: 1200,
        height: 630,
        alt: "How POOCH Works",
      },
    ],
    locale: "en_US",
    type: "website",
  },
}

export default function HowItWorksPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <HowItWorksContent />
    </main>
  )
}
