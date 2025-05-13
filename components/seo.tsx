import Head from "next/head"
import { SEO, SITE_NAME, SITE_URL } from "@/lib/constants"

interface SEOProps {
  title?: string
  description?: string
  ogImage?: string
  ogType?: string
  path?: string
}

export function SEOComponent({
  title = SEO.defaultTitle,
  description = SEO.defaultDescription,
  ogImage = SEO.defaultOgImage,
  ogType = "website",
  path = "",
}: SEOProps) {
  const url = `${SITE_URL}${path}`
  const fullTitle = title === SEO.defaultTitle ? title : `${title} | ${SITE_NAME}`

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

      {/* Canonical Link */}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content={SEO.twitter.cardType} />
      <meta name="twitter:site" content={SEO.twitter.site} />
      <meta name="twitter:creator" content={SEO.twitter.handle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
    </Head>
  )
}
