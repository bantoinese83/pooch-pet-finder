import type { NextApiRequest, NextApiResponse } from "next"
import { GoogleGenAI, Type, Modality } from "@google/genai"
import { createClient } from "@supabase/supabase-js"
import slugify from "slugify"
import { v4 as uuidv4 } from "uuid"

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const BLOG_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      content: { type: Type.STRING },
      image_prompt: { type: Type.STRING },
    },
    propertyOrdering: ["title", "summary", "content", "image_prompt"],
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }
  try {
    // 1. Check for existing blogs this week
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const { data: existingBlogs } = await supabase
      .from("blog_posts")
      .select("slug, created_at")
      .gte("created_at", weekStart.toISOString())
    if (existingBlogs && existingBlogs.length >= 3) {
      return res.status(200).json({ message: "Already generated 3 blogs this week." })
    }
    // 2. Generate 3 unique blogs
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Generate 3 unique, helpful blog posts for a modern pet rescue platform. Each should have a title, a 1-2 sentence summary, a full markdown article, and a creative image prompt for illustration. Do not repeat topics from the last 2 weeks.",
      config: {
        responseMimeType: "application/json",
        responseSchema: BLOG_SCHEMA,
      },
    })
    const blogs = JSON.parse(response.text)
    const results = []
    for (const blog of blogs) {
      // Deduplicate by slug
      const slug = slugify(blog.title, { lower: true, strict: true })
      if (existingBlogs && existingBlogs.some((b: any) => b.slug === slug)) continue
      // 3. Generate image
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: blog.image_prompt,
        config: { responseModalities: [Modality.IMAGE] },
      })
      const imagePart = imageResponse.candidates[0].content.parts.find((p: any) => p.inlineData)
      if (!imagePart) continue
      const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64")
      const imagePath = `blog-images/${uuidv4()}.png`
      const { data: imageUpload, error: imageError } = await supabase.storage
        .from("blog-images")
        .upload(imagePath, imageBuffer, { contentType: "image/png" })
      if (imageError) continue
      const { data: publicUrl } = supabase.storage.from("blog-images").getPublicUrl(imagePath)
      // 4. Insert blog post
      const { error: insertError } = await supabase.from("blog_posts").upsert({
        slug,
        title: blog.title,
        summary: blog.summary,
        content: blog.content,
        image_url: publicUrl.publicUrl,
        created_at: new Date().toISOString(),
      }, { onConflict: "slug" })
      if (!insertError) results.push(slug)
    }
    res.status(200).json({ message: "Blogs generated", slugs: results })
  } catch (err: any) {
    res.status(500).json({ error: err.message || err.toString() })
  }
} 