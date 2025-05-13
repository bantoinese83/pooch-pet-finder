import type { Metadata } from "next"
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: `Contact Us | ${SITE_NAME}`,
  description: `Contact the team at ${SITE_NAME} for support, feedback, or partnership opportunities.`,
  openGraph: {
    title: `Contact Us | ${SITE_NAME}`,
    description: `Contact the team at ${SITE_NAME} for support, feedback, or partnership opportunities.`,
    url: `${SITE_URL}/contact`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/api/og?title=Contact%20Us`,
        width: 1200,
        height: 630,
        alt: `Contact Us | ${SITE_NAME}`,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact Us | ${SITE_NAME}`,
    description: `Contact the team at ${SITE_NAME} for support, feedback, or partnership opportunities.`,
    images: [`${SITE_URL}/api/og?title=Contact%20Us`],
  },
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
}

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <ContactForm />
    </main>
  )
}
