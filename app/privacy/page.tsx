import { Shield, Lock, UserCircle, Mail } from "lucide-react"
import Image from "next/image"
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants"

export const metadata = {
  title: `Privacy Policy | ${SITE_NAME}`,
  description: `Read the privacy policy for ${SITE_NAME}.`,
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `Read the privacy policy for ${SITE_NAME}.`,
    url: `${SITE_URL}/privacy`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/api/og?title=Privacy%20Policy`,
        width: 1200,
        height: 630,
        alt: `Privacy Policy | ${SITE_NAME}`,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `Read the privacy policy for ${SITE_NAME}.`,
    images: [`${SITE_URL}/api/og?title=Privacy%20Policy`],
  },
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col items-center mb-8">
        <Shield className="h-12 w-12 text-amber-600 mb-2" />
        <h1 className="text-4xl font-bold text-amber-800 mb-2 text-center">Privacy Policy</h1>
        <p className="text-lg text-gray-700 text-center max-w-xl mb-4">
          Your privacy matters to us. This page explains how <b>{SITE_NAME}</b> collects, uses, and protects your information—always with your trust in mind.
        </p>
        <div className="mb-4">
          <Image
            src="/cartoon-dog-and-cat.png"
            alt="Privacy and pets illustration"
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
            <UserCircle className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Information We Collect</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>Account and profile information</li>
            <li>Pet reports and images</li>
            <li>Location data (if provided)</li>
            <li>Feedback and community posts</li>
          </ul>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">How We Use Your Information</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>To help reunite lost pets with their owners</li>
            <li>To improve our services and user experience</li>
            <li>To communicate important updates and notifications</li>
          </ul>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Sharing & Security</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>We do not sell your data to third parties</li>
            <li>We use secure storage and best practices to protect your data</li>
          </ul>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Your Choices</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>You can update or delete your account at any time</li>
            <li>Contact us for any privacy-related questions</li>
          </ul>
        </section>
        <div className="text-base text-amber-800 mt-6">
          For more information, contact us at <a href="mailto:info@pooch-finder.com" className="text-amber-700 underline">info@pooch-finder.com</a>.
        </div>
      </div>
    </main>
  )
} 