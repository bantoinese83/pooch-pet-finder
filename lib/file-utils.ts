/**
 * Utility functions for handling files in serverless environments
 * without relying on Node.js fs module
 */

/**
 * Reads a file from a URL or blob and returns it as text
 * This is a safe alternative to fs.readFile in serverless environments
 */
export async function readFileFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    console.error("Error reading file from URL:", error)
    throw error
  }
}

/**
 * Converts a File or Blob to a Buffer
 * Useful for AWS operations that require Buffer input
 */
export async function fileToBuffer(file: File | Blob): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer())
}

/**
 * Generates a data URL from a File or Blob
 * Useful for previewing images without fs operations
 */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
