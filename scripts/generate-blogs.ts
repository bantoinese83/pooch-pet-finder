import 'dotenv/config';
import { GoogleGenAI, Modality } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import slugify from "slugify";
import { v4 as uuidv4 } from "uuid";
import * as fs from "node:fs";
import { marked } from "marked";
import sharp from "sharp";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function generateBlogPost() {
  const prompt = `Generate a unique, robust, and helpful blog post for a modern pet rescue platform.\n\nRequirements:\n- Write as an expert in animal rescue and pet care.\n- Use a conversational, trustworthy, and actionable tone.\n- The blog should be tailored for pet owners and rescue volunteers.\n- Include a compelling, SEO-optimized title.\n- Provide a 2-3 sentence summary.\n- Write a full markdown article of at least 1200 words, with clear headings, subheadings, and bullet points where appropriate.\n- Use expressive, visually engaging Markdown: include blockquotes for key insights, bold and italic for emphasis, underlines, numbered and bulleted lists, callout sections, horizontal rules, and code blocks for tips or checklists.\n- Make the formatting visually rich and varied, similar to Medium.com blogs.\n- Add a creative, detailed image prompt for illustration as a separate field called 'image_prompt'.\n- End with a strong call-to-action for readers.\n\nReturn ONLY a strict JSON object with the following keys: title, summary, content, image_prompt. Do NOT include markdown, code blocks, or any extra text outside the JSON object.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });
  let blogText = response.text ?? '{}';
  let blog;
  try {
    blog = JSON.parse(blogText);
  } catch (e) {
    // Fallback: find first '{' and last '}' in the entire response
    const firstBrace = blogText.indexOf('{');
    const lastBrace = blogText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('No JSON object found in response: ' + blogText);
    }
    const jsonString = blogText.substring(firstBrace, lastBrace + 1);
    try {
      blog = JSON.parse(jsonString);
    } catch (e2) {
      throw new Error('Failed to parse blog post JSON after extraction. Original: ' + blogText + '\nExtracted: ' + jsonString);
    }
  }
  return blog;
}

async function generateBlogImage(imagePrompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: imagePrompt,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });
  const candidates = response.candidates;
  if (!candidates || !candidates[0] || !candidates[0].content || !candidates[0].content.parts) {
    throw new Error("No candidates or parts returned from Gemini");
  }
  for (const part of candidates[0].content.parts) {
    if (part.inlineData && part.inlineData.data) {
      return Buffer.from(part.inlineData.data, "base64");
    }
  }
  throw new Error("No image data returned from Gemini");
}

async function main() {
  // 1. Generate blog post
  const blog = await generateBlogPost();
  const slug = slugify(blog.title, { lower: true, strict: true });

  // 2. Generate image
  const imageBuffer = await generateBlogImage(blog.image_prompt);
  // Optimize image
  const optimizedBuffer = await sharp(imageBuffer).resize({ width: 1200 }).png({ quality: 80 }).toBuffer();
  const imagePath = `blog-images/${uuidv4()}.png`;

  // 3. Upload image to Supabase Storage
  const { data: imageUpload, error: imageError } = await supabase.storage
    .from("blog-images")
    .upload(imagePath, optimizedBuffer, { contentType: "image/png" });
  if (imageError) throw imageError;

  const { data: publicUrl } = supabase.storage.from("blog-images").getPublicUrl(imagePath);

  // Convert markdown content to HTML for professional formatting
  const htmlContent = marked.parse(blog.content);

  // 4. Insert blog post into Supabase
  const { error: insertError } = await supabase.from("blog_posts").upsert({
    slug,
    title: blog.title,
    summary: blog.summary,
    content: htmlContent, // Save as HTML
    image_url: publicUrl.publicUrl,
    image_prompt: blog.image_prompt,
    created_at: new Date().toISOString(),
  }, { onConflict: "slug" });
  if (insertError) throw insertError;

  console.log({ message: "Blog generated", slug });
}

main().catch(console.error); 