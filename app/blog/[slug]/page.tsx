import BlogPostClient from "@/components/blog-post-client"
import { createClient } from "@supabase/supabase-js"
import { SITE_NAME, SITE_URL } from "@/lib/constants"

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  return <BlogPostClient slug={slug} />
}

export async function generateMetadata({ params }) {
  const { slug } = params
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: post } = await supabase.from("blog_posts").select("title, summary, image_url").eq("slug", slug).single()
  if (!post) {
    return {
      title: "Blog Post",
      description: "Read this blog post on " + SITE_NAME,
    }
  }
  return {
    title: post.title + " | " + SITE_NAME,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `${SITE_URL}/blog/${slug}`,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      images: [`${SITE_URL}/api/og?title=${encodeURIComponent(post.title)}`],
    },
    alternates: {
      canonical: `${SITE_URL}/blog/${slug}`,
    },
  }
} 