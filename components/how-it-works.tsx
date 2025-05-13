"use client"

import { Upload, Search, MapPin, Phone } from "lucide-react"
import { motion } from "framer-motion"

export function HowItWorks() {
  const steps = [
    {
      icon: <Upload className="h-8 w-8 text-amber-600" />,
      title: "Upload a Photo",
      description: "Upload a clear photo of your lost pet. You can also add details like breed, color, and location.",
    },
    {
      icon: <Search className="h-8 w-8 text-amber-600" />,
      title: "AI Image Matching",
      description: "Our system uses AWS Rekognition to compare your pet's photo with shelter databases.",
    },
    {
      icon: <MapPin className="h-8 w-8 text-amber-600" />,
      title: "View Potential Matches",
      description: "See a list of visually similar pets from nearby shelters.",
    },
    {
      icon: <Phone className="h-8 w-8 text-amber-600" />,
      title: "Contact Shelters",
      description: "Reach out to shelters directly with the provided contact information.",
    },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <motion.div
      className="bg-white p-8 rounded-xl shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-amber-800">How It Works</h2>
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        {steps.map((step, index) => (
          <motion.div key={index} className="flex gap-4 items-start" variants={item} whileHover={{ x: 5 }}>
            <div className="flex-shrink-0 bg-amber-100 p-3 rounded-full">{step.icon}</div>
            <div>
              <h3 className="font-semibold text-lg text-amber-800">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
