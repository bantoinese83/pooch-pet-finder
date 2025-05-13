"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, MapPin, Calendar, Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LostPetForm } from "@/components/lost-pet-form"
import { FoundPetForm } from "@/components/found-pet-form"

export function UserPathSelector() {
  const [selectedPath, setSelectedPath] = useState<"lost" | "found" | null>(null)

  return (
    <div className="mb-16">
      <AnimatePresence mode="wait">
        {!selectedPath ? (
          <motion.div
            key="path-selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-amber-800 mb-4">How can we help you today?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Whether you've lost your beloved pet or found someone else's, we're here to help reunite pets with their
                families.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card
                  className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPath("lost")}
                >
                  <CardHeader className="text-center bg-gradient-to-r from-amber-100 to-amber-50 rounded-t-lg">
                    <CardTitle className="text-amber-800">I've Lost My Pet</CardTitle>
                    <CardDescription>Upload a photo and details to find your missing pet</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 flex justify-center">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                      <Search className="h-12 w-12 text-amber-600" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-amber-600" />
                      <span>Upload a photo of your pet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      <span>Tell us where they were last seen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span>Get matches from recent found pets</span>
                    </div>
                    <Button className="w-full mt-2 bg-amber-600 hover:bg-amber-700">I've Lost My Pet</Button>
                  </CardFooter>
                </Card>
              </motion.div>

              <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
                <Card
                  className="h-full cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedPath("found")}
                >
                  <CardHeader className="text-center bg-gradient-to-r from-amber-100 to-amber-50 rounded-t-lg">
                    <CardTitle className="text-amber-800">I've Found a Pet</CardTitle>
                    <CardDescription>Help reunite a found pet with their owner</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 flex justify-center">
                    <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-12 w-12 text-amber-600" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-amber-600" />
                      <span>Upload a photo of the found pet</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      <span>Mark where you found them</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span>Help them find their way home</span>
                    </div>
                    <Button className="w-full mt-2 bg-amber-600 hover:bg-amber-700">I've Found a Pet</Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 flex justify-between items-center">
              <Button
                variant="outline"
                className="text-amber-600 border-amber-300"
                onClick={() => setSelectedPath(null)}
              >
                Back to Options
              </Button>
            </div>

            {selectedPath === "lost" ? <LostPetForm /> : <FoundPetForm />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
