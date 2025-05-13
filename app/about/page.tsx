import { PawPrint, Users, HeartHandshake, Sparkles } from "lucide-react"
import Image from "next/image"
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants"

export const metadata = {
  title: `About Us | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `About Us | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    url: `${SITE_URL}/about`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/api/og?title=About%20Us`,
        width: 1200,
        height: 630,
        alt: `About Us | ${SITE_NAME}`,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About Us | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/api/og?title=About%20Us`],
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <div className="flex flex-col items-center mb-8">
        <PawPrint className="h-12 w-12 text-amber-600 mb-2 animate-bounce" />
        <h1 className="text-4xl font-bold text-amber-800 mb-2 text-center">About {SITE_NAME} Pet Finder</h1>
        <p className="text-lg text-gray-700 text-center max-w-xl mb-4">
          <b>{SITE_NAME}</b> is dedicated to reuniting lost pets with their families and supporting animal rescue efforts through innovative technology and a compassionate community.
        </p>
        <div className="mb-4">
          <Image
            src="/cartoon-dog-and-cat.png"
            alt="About our team"
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
            <Sparkles className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Our Mission</h2>
          </div>
          <p className="text-gray-700">We believe every pet deserves a loving home. Our mission is to make pet recovery faster, easier, and more effective by connecting pet owners, shelters, and volunteers on a single, user-friendly platform.</p>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <PawPrint className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">What We Offer</h2>
          </div>
          <ul className="list-disc ml-8 text-amber-700 text-base space-y-1">
            <li>Advanced image recognition to match lost and found pets</li>
            <li>Community-driven reporting and support</li>
            <li>Resources and tips for pet care and rescue</li>
            <li>Secure, privacy-focused data handling</li>
          </ul>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Meet the Team</h2>
          </div>
          <p className="text-gray-700">Our team is made up of animal lovers, technologists, and volunteers passionate about making a difference. We work closely with shelters and rescue organizations to ensure our platform meets real-world needs.</p>
        </section>
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <HeartHandshake className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-semibold text-amber-800">Get Involved</h2>
          </div>
          <p className="text-gray-700">Whether you're a pet owner, volunteer, or animal welfare advocate, you can help! <a href="/contact" className="text-amber-700 underline">Contact us</a> to learn more about partnership and volunteer opportunities.</p>
        </section>
        <hr className="my-6 border-amber-200" />
        <p className="italic text-amber-800 text-center">Thank you for supporting our mission to bring pets home.</p>
      </div>
    </main>
  )
} 