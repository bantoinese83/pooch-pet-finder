import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Upload, Camera, X, Loader2, Sparkles, HelpCircle } from "lucide-react"
import Image from "next/image"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"

const Webcam = dynamic(() => import("react-webcam"), { ssr: false })

interface PhotoUploadSectionProps {
  file: File | null
  preview: string | null
  setFile: (file: File | null) => void
  setPreview: (url: string | null) => void
  aiLoading: boolean
  aiError: string | null
  onAIDescribe: () => void
  showCameraModal: boolean
  setShowCameraModal: (show: boolean) => void
  webcamRef: React.RefObject<any>
  handleCapture: () => void
  cameraInputRef: React.RefObject<HTMLInputElement>
  dragActive: boolean
  handleDrag: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  isMobile: boolean
}

export function PhotoUploadSection({
  file, preview, setFile, setPreview, aiLoading, aiError, onAIDescribe, showCameraModal, setShowCameraModal, webcamRef, handleCapture, cameraInputRef, dragActive, handleDrag, handleDrop, handleFileChange, isMobile
}: PhotoUploadSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="pet-image" className="text-amber-800 font-medium">
        Upload Pet Photo <span className="text-red-500">*</span>
      </Label>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${dragActive ? "border-amber-500 bg-amber-50" : "border-amber-300 hover:bg-amber-50"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="pet-image"
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
          aria-required="true"
        />
        {isMobile && (
          <input
            id="camera-capture"
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        )}
        <label htmlFor="pet-image" className="cursor-pointer block">
          <AnimatePresence mode="wait">
            {preview ? (
              <motion.div className="flex flex-col items-center" key="preview" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                <div className="relative group">
                  <Image src={preview || "/placeholder.svg"} alt="Pet preview" width={200} height={200} className="rounded-lg mb-2 max-h-[200px] w-auto object-contain" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button type="button" onClick={e => { e.preventDefault(); setFile(null); setPreview(null); }} className="bg-white p-2 rounded-full" aria-label="Remove image">
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <span className="text-sm text-amber-600 flex items-center gap-1"><Upload className="h-4 w-4" /> Change image</span>
              </motion.div>
            ) : (
              <motion.div className="flex flex-col items-center py-4" key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <Upload className="h-12 w-12 text-amber-400 mb-2" />
                <p className="text-amber-800 font-medium">Click to upload or drag and drop</p>
                <p className="text-gray-500 text-sm">JPEG or PNG (max 10MB)</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={e => { e.preventDefault(); document.getElementById("pet-image")?.click(); }}>
                    <Upload className="h-4 w-4 mr-2" /> Browse Files
                  </Button>
                  {isMobile && (
                    <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={e => { e.preventDefault(); cameraInputRef.current?.click(); }}>
                      <Camera className="h-4 w-4 mr-2" /> Take Photo
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" onClick={e => { e.preventDefault(); setShowCameraModal(true); }}>
                    <Camera className="h-4 w-4 mr-2" /> Use Camera
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </label>
      </div>
      {/* Camera Modal for custom camera UI */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full flex flex-col items-center">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg" className="rounded-lg mb-4 w-full h-64 object-cover" videoConstraints={{ facingMode: "environment" }} />
            <div className="flex gap-2 w-full">
              <Button type="button" className="flex-1 bg-amber-600 text-white" onClick={handleCapture}><Camera className="h-4 w-4 mr-1" /> Capture</Button>
              <Button type="button" className="flex-1" variant="outline" onClick={() => setShowCameraModal(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {file && (
        <div className="flex items-center gap-2 mt-2">
          <Button type="button" variant="outline" size="sm" className="text-amber-600 border-amber-300" disabled={aiLoading} onClick={onAIDescribe}>
            {aiLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>) : (<><Sparkles className="h-4 w-4 mr-1" /> Let AI describe your pet</>)}
          </Button>
          <HelpCircle className="h-4 w-4 text-gray-400" title="AI will analyze your photo and suggest a detailed description." />
        </div>
      )}
      {aiError && <div className="text-red-600 text-sm mt-1">{aiError}</div>}
    </div>
  )
} 