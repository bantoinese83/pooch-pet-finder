import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SITE_URL = process.env.SITE_URL || "https://YOUR_DOMAIN"

export async function GET() {
  // Fetch all blog slugs
  const { data: posts } = await supabase.from("blog_posts").select("slug, updated_at")

  // Static pages
  const staticPages = [
    "",
    "about",
    "blog",
    "contact",
    "privacy",
    "terms",
  ]

  let urls = staticPages.map(
    (page) =>
      `<url><loc>${SITE_URL}/${page}</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>`
  )

  // Blog posts
  if (posts) {
    urls = urls.concat(
      posts.map(
        (post) =>
          `<url><loc>${SITE_URL}/blog/${post.slug}</loc>$
            {post.updated_at ? `<lastmod>${new Date(post.updated_at).toISOString().split("T")[0]}</lastmod>` : ""}
            <changefreq>monthly</changefreq><priority>0.6</priority></url>`
      )
    )
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  })
} 