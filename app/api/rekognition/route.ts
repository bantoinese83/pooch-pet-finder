import { NextResponse } from "next/server"
import { RekognitionClient, CompareFacesCommand, DetectLabelsCommand } from "@aws-sdk/client-rekognition"
import { createClient } from "@supabase/supabase-js"

// Initialize AWS Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { sourceImageKey, targetImageKey, searchId } = await request.json()

    if (!sourceImageKey || !targetImageKey || !searchId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Option 1: Use CompareFaces for direct face comparison (works well for pets with distinct facial features)
    const compareFacesParams = {
      SourceImage: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Name: sourceImageKey,
        },
      },
      TargetImage: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Name: targetImageKey,
        },
      },
      SimilarityThreshold: 70, // Adjust as needed
    }

    const compareFacesCommand = new CompareFacesCommand(compareFacesParams)
    const compareFacesResponse = await rekognitionClient.send(compareFacesCommand)

    // Option 2: Use DetectLabels to get features and compare them (better for general pet matching)
    const detectLabelsSourceParams = {
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Name: sourceImageKey,
        },
      },
      MaxLabels: 50,
      MinConfidence: 70,
    }

    const detectLabelsTargetParams = {
      Image: {
        S3Object: {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Name: targetImageKey,
        },
      },
      MaxLabels: 50,
      MinConfidence: 70,
    }

    const [sourceLabelsResponse, targetLabelsResponse] = await Promise.all([
      rekognitionClient.send(new DetectLabelsCommand(detectLabelsSourceParams)),
      rekognitionClient.send(new DetectLabelsCommand(detectLabelsTargetParams)),
    ])

    // Calculate similarity score based on common labels
    const sourceLabels = sourceLabelsResponse.Labels || []
    const targetLabels = targetLabelsResponse.Labels || []

    const sourceLabelsMap = new Map(sourceLabels.map((label) => [label.Name, label.Confidence]))

    const targetLabelsMap = new Map(targetLabels.map((label) => [label.Name, label.Confidence]))

    let totalScore = 0
    let matchCount = 0

    // Calculate similarity based on common labels and their confidence scores
    for (const [labelName, sourceConfidence] of sourceLabelsMap.entries()) {
      if (targetLabelsMap.has(labelName)) {
        const targetConfidence = targetLabelsMap.get(labelName) || 0
        // Weight the score by the average confidence
        const weightedScore = ((sourceConfidence || 0) + (targetConfidence || 0)) / 2 / 100
        totalScore += weightedScore
        matchCount++
      }
    }

    // Normalize the score
    const normalizedScore = matchCount > 0 ? totalScore / matchCount : 0

    // Combine both approaches for a final similarity score
    let finalSimilarityScore = normalizedScore

    // If face comparison found matches, factor that in
    if (compareFacesResponse.FaceMatches && compareFacesResponse.FaceMatches.length > 0) {
      const faceMatchScore = compareFacesResponse.FaceMatches[0].Similarity
        ? compareFacesResponse.FaceMatches[0].Similarity / 100
        : 0

      // Weight face matches more heavily if they exist
      finalSimilarityScore = finalSimilarityScore * 0.4 + faceMatchScore * 0.6
    }

    // Store the result in Supabase
    const { error } = await supabase.from("pet_match_results").insert({
      search_id: searchId,
      target_image_key: targetImageKey,
      similarity_score: finalSimilarityScore,
      face_matches: compareFacesResponse.FaceMatches || [],
      source_labels: sourceLabels,
      target_labels: targetLabels,
    })

    if (error) {
      console.error("Error storing match results in Supabase:", error)
    }

    return NextResponse.json({
      similarityScore: finalSimilarityScore,
      faceMatches: compareFacesResponse.FaceMatches || [],
      sourceLabels: sourceLabels,
      targetLabels: targetLabels,
    })
  } catch (error) {
    console.error("Error processing Rekognition comparison:", error)
    return NextResponse.json({ error: "Failed to process image comparison" }, { status: 500 })
  }
}
