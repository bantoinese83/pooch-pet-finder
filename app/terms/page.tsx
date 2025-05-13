import { Shield, Gavel, Users, Mail } from "lucide-react"
import Image from "next/image"
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants"

export const metadata = {
  title: `Terms of Service | ${SITE_NAME}`,
  description: `Read the terms of service for ${SITE_NAME}.`,
  openGraph: {
    title: `Terms of Service | ${SITE_NAME}`,
    description: `Read the terms of service for ${SITE_NAME}.`,
    url: `${SITE_URL}/terms`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/api/og?title=Terms%20of%20Service`,
        width: 1200,
        height: 630,
        alt: `Terms of Service | ${SITE_NAME}`,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Terms of Service | ${SITE_NAME}`,
    description: `Read the terms of service for ${SITE_NAME}.`,
    images: [`${SITE_URL}/api/og?title=Terms%20of%20Service`],
  },
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col items-center mb-8">
        <Shield className="h-12 w-12 text-amber-600 mb-2 animate-bounce" />
        <h1 className="text-4xl font-bold text-amber-800 mb-2 text-center">Terms of Service</h1>
        <p className="text-lg text-gray-700 text-center max-w-xl mb-4">
          By using <b>{SITE_NAME}</b>, you agree to the following terms and conditions. Please read them carefully.
        </p>
        <div className="mb-4">
          <Image
            src="/cartoon-dog-and-cat.png"
            alt="Legal and pets illustration"
            width={120}
            height={120}
            className="rounded-full border-4 border-amber-100 shadow"
            priority
          />
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-8 shadow-md">
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Gavel className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">General Terms</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>You are responsible for the accuracy of information you submit</li>
            <li>You will not post abusive, illegal, or inappropriate content</li>
            <li>We reserve the right to moderate or remove content at our discretion</li>
            <li>We are not liable for actions taken by users outside our platform</li>
          </ul>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Content & Moderation</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>All user-generated content may be reviewed and moderated</li>
            <li>Users can report abuse or inappropriate content</li>
          </ul>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Changes</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>We may update these terms at any time. Continued use constitutes acceptance.</li>
          </ul>
        </section>
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-6 w-6 text-amber-600" />
          <span className="text-base text-amber-800">Contact us at <a href="mailto:info@pooch-finder.com" className="text-amber-700 underline">info@pooch-finder.com</a> for questions about these terms.</span>
        </div>
      </div>
    </main>
  )
} 