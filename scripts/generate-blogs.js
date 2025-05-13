"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var genai_1 = require("@google/genai");
var supabase_js_1 = require("@supabase/supabase-js");
var ai = new genai_1.GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
var BLOG_SCHEMA = {
    type: genai_1.Type.ARRAY,
    items: {
        type: genai_1.Type.OBJECT,
        properties: {
            title: { type: genai_1.Type.STRING },
            summary: { type: genai_1.Type.STRING },
            content: { type: genai_1.Type.STRING },
            image_prompt: { type: genai_1.Type.STRING },
        },
        propertyOrdering: ["title", "summary", "content", "image_prompt"],
    },
};
// Generate a blog post (text only)
function generateBlogPost(existingBlogs) {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ai.models.generateContent({
                        model: "gemini-2.0-flash",
                        contents: "Generate 1 unique, robust, and helpful blog post for a modern pet rescue platform.\n\nRequirements:\n- Write as an expert in animal rescue and pet care.\n- Use a conversational, trustworthy, and actionable tone.\n- The blog should be tailored for pet owners and rescue volunteers.\n- Include a compelling, SEO-optimized title.\n- Provide a 2-3 sentence summary.\n- Write a full markdown article of at least 1200 words, with clear headings, subheadings, and bullet points where appropriate.\n- Add a creative, detailed image prompt for illustration as a separate field called 'image_prompt'.\n- End with a strong call-to-action for readers.\n- Do not repeat topics from the last 2 weeks.\n\nReturn a JSON array with objects containing: title, summary, content, and image_prompt.\",\n    config: {\n      responseMimeType: \"application/json\",\n      responseSchema: BLOG_SCHEMA,\n    },\n  });\n  const blogs = JSON.parse(response.text ?? \"[]\");\n  // Always return an array for consistency\n  return Array.isArray(blogs) ? blogs : [blogs];\n}\n\n// Generate an image from a prompt\nasync function generateBlogImage(imagePrompt: string) {\n  const imageResponse = await ai.models.generateContent({\n    model: \"gemini-2.0-flash-preview-image-generation\",\n    contents: [{ text: imagePrompt }],\n    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },\n  });\n  const candidate = imageResponse.candidates?.[0];\n  const imagePart = candidate?.content?.parts?.find((p: any) => p.inlineData);\n  if (!imagePart?.inlineData?.data) return null;\n  return Buffer.from(imagePart.inlineData.data, \"base64\");\n}\n\nasync function generateBlogs() {\n  // 1. Check for existing blogs this week\n  const weekStart = new Date();\n  weekStart.setDate(weekStart.getDate() - weekStart.getDay());\n  weekStart.setHours(0, 0, 0, 0);\n  const { data: existingBlogs } = await supabase\n    .from(\"blog_posts\")\n    .select(\"slug, created_at\")\n    .gte(\"created_at\", weekStart.toISOString());\n  const safeExistingBlogs = existingBlogs ?? [];\n  if (safeExistingBlogs.length >= 1) {\n    console.log(\"Already generated a blog this week.\");\n    return;\n  }\n  // 2. Generate 1 robust blog post\n  const blogs = await generateBlogPost(safeExistingBlogs);\n  const results = [];\n  for (const blog of blogs) {\n    // Deduplicate by slug\n    const slug = slugify(blog.title, { lower: true, strict: true });\n    if (safeExistingBlogs.some((b: any) => b.slug === slug)) continue;\n    // 3. Generate image using only the image_prompt\n    const imageBuffer = await generateBlogImage(blog.image_prompt);\n    if (!imageBuffer) continue;\n    const imagePath = ",
                        blog: blog
                    } - images / $, {}.png(templateObject_1 || (templateObject_1 = __makeTemplateObject([";\n    const { data: imageUpload, error: imageError } = await supabase.storage\n      .from(\"blog-images\")\n      .upload(imagePath, imageBuffer, { contentType: \"image/png\" });\n    if (imageError) continue;\n    const { data: publicUrl } = supabase.storage.from(\"blog-images\").getPublicUrl(imagePath);\n    // 4. Insert blog post\n    const { error: insertError } = await supabase.from(\"blog_posts\").upsert({\n      slug,\n      title: blog.title,\n      summary: blog.summary,\n      content: blog.content,\n      image_url: publicUrl.publicUrl,\n      created_at: new Date().toISOString(),\n    }, { onConflict: \"slug\" });\n    if (!insertError) results.push(slug);\n  }\n  console.log({ message: \"Blog generated\", slugs: results });\n}\n\ngenerateBlogs().catch(console.error); "], [";\n    const { data: imageUpload, error: imageError } = await supabase.storage\n      .from(\"blog-images\")\n      .upload(imagePath, imageBuffer, { contentType: \"image/png\" });\n    if (imageError) continue;\n    const { data: publicUrl } = supabase.storage.from(\"blog-images\").getPublicUrl(imagePath);\n    // 4. Insert blog post\n    const { error: insertError } = await supabase.from(\"blog_posts\").upsert({\n      slug,\n      title: blog.title,\n      summary: blog.summary,\n      content: blog.content,\n      image_url: publicUrl.publicUrl,\n      created_at: new Date().toISOString(),\n    }, { onConflict: \"slug\" });\n    if (!insertError) results.push(slug);\n  }\n  console.log({ message: \"Blog generated\", slugs: results });\n}\n\ngenerateBlogs().catch(console.error); "]))))];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1;
