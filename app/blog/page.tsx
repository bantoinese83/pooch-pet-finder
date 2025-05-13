import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants"
import BlogListClient from "@/components/blog-list-client"

export const metadata = {
  title: `Blog & Resources | ${SITE_NAME}`,
  description: `Read the latest articles and resources from ${SITE_NAME}.`,
  openGraph: {
    title: `Blog & Resources | ${SITE_NAME}`,
    description: `Read the latest articles and resources from ${SITE_NAME}.`,
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    images: [
      {
        url: `${SITE_URL}/api/og?title=Blog%20%26%20Resources`,
        width: 1200,
        height: 630,
        alt: `Blog & Resources | ${SITE_NAME}`,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog & Resources | ${SITE_NAME}`,
    description: `Read the latest articles and resources from ${SITE_NAME}.`,
    images: [`${SITE_URL}/api/og?title=Blog%20%26%20Resources`],
  },
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
}

export default function BlogPage() {
  return <BlogListClient />
} 