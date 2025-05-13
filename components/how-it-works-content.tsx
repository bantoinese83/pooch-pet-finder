"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Upload, Sparkles, MapPin, Bell, Clock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import Link from "next/link"
import { COLORS } from "@/lib/constants"

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function HowItWorksContent() {
  const [activeTab, setActiveTab] = useState<"lost" | "found">("lost")

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">How POOCH Works</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Our innovative platform uses advanced AI technology to help reunite lost pets with their owners.
        </p>
      </motion.div>

      <div className="mb-12">
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={activeTab === "lost" ? "default" : "outline"}
            onClick={() => setActiveTab("lost")}
            className="px-6 py-3 text-lg"
            style={{ backgroundColor: activeTab === "lost" ? COLORS.primary : undefined }}
          >
            I've Lost My Pet
          </Button>
          <Button
            variant={activeTab === "found" ? "default" : "outline"}
            onClick={() => setActiveTab("found")}
            className="px-6 py-3 text-lg"
            style={{ backgroundColor: activeTab === "found" ? COLORS.primary : undefined }}
          >
            I've Found a Pet
          </Button>
        </div>

        {activeTab === "lost" && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <StepCard
              icon={<Upload className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Upload a Photo"
              description="Upload a clear photo of your lost pet. The clearer the photo, the better our AI can match it."
              step={1}
            />
            <StepCard
              icon={<MapPin className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Add Location Details"
              description="Tell us where and when your pet was last seen to help narrow down the search area."
              step={2}
            />
            <StepCard
              icon={<Sparkles className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="AI Matching Technology"
              description="Our advanced AI scans thousands of found pet reports to find potential matches."
              step={3}
            />
            <StepCard
              icon={<Search className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Review Matches"
              description="Review potential matches of pets that look similar to yours, found in your area."
              step={4}
            />
            <StepCard
              icon={<Bell className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Get Notifications"
              description="Receive alerts when new potential matches are found in the database."
              step={5}
            />
            <StepCard
              icon={<Shield className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Verify and Reunite"
              description="Contact the finder through our secure platform and arrange to reunite with your pet."
              step={6}
            />
          </motion.div>
        )}

        {activeTab === "found" && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <StepCard
              icon={<Upload className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Upload a Photo"
              description="Upload a clear photo of the pet you've found so owners can identify their lost companion."
              step={1}
            />
            <StepCard
              icon={<MapPin className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Add Location Details"
              description="Tell us where and when you found the pet to help match with lost pet reports in that area."
              step={2}
            />
            <StepCard
              icon={<Sparkles className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="AI Matching Technology"
              description="Our advanced AI scans thousands of lost pet reports to find the potential owner."
              step={3}
            />
            <StepCard
              icon={<Search className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Review Potential Owners"
              description="Review potential matches of lost pet reports that match the pet you found."
              step={4}
            />
            <StepCard
              icon={<Bell className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Get Notifications"
              description="Receive alerts when someone claims the pet might be theirs."
              step={5}
            />
            <StepCard
              icon={<Clock className="h-10 w-10" style={{ color: COLORS.primary }} />}
              title="Temporary Care"
              description="Provide temporary care for the pet while we help find its owner, or connect with a local shelter."
              step={6}
            />
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="bg-gray-50 rounded-xl p-8 mb-16"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Our Technology</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-3">Advanced Image Recognition</h3>
            <p className="text-gray-600 mb-4">
              POOCH uses AWS Rekognition, a powerful image analysis service, to identify visual similarities between
              pets. This technology can recognize specific patterns, colors, and features unique to your pet.
            </p>
            <h3 className="text-xl font-semibold mb-3">Location-Based Matching</h3>
            <p className="text-gray-600">
              Our system prioritizes matches based on proximity to where the pet was lost or found, using Google Maps
              API to provide accurate location data and search radius functionality.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-3">Real-Time Notifications</h3>
            <p className="text-gray-600 mb-4">
              Get instant alerts when potential matches are found, allowing for quick action and higher chances of
              reunion.
            </p>
            <h3 className="text-xl font-semibold mb-3">Shelter Integration</h3>
            <p className="text-gray-600">
              POOCH connects with local animal shelters to expand the search network, ensuring that pets in shelters are
              also included in the matching process.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          <AccordionItem value="item-1">
            <AccordionTrigger>Is POOCH completely free to use?</AccordionTrigger>
            <AccordionContent>
              Yes, POOCH is completely free for individuals looking for their lost pets or who have found a pet. We
              believe that reuniting pets with their owners should be accessible to everyone.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How accurate is the pet matching technology?</AccordionTrigger>
            <AccordionContent>
              Our AI-powered matching system has a high success rate, but the accuracy depends on the quality of the
              photos provided and the distinctiveness of the pet's features. We recommend uploading clear, well-lit
              photos from multiple angles for the best results.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What should I do after finding a potential match?</AccordionTrigger>
            <AccordionContent>
              When you find a potential match, you can contact the other party through our secure messaging system. We
              recommend asking for specific details about the pet that only the true owner would know, such as unique
              markings or behaviors, before arranging a meeting in a safe, public location.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>How long does my pet listing stay active?</AccordionTrigger>
            <AccordionContent>
              Lost and found pet listings remain active in our system for 90 days by default. You can extend this period
              or mark the listing as resolved at any time through your account dashboard.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Does POOCH work with local animal shelters?</AccordionTrigger>
            <AccordionContent>
              Yes, POOCH partners with animal shelters across the country to include shelter animals in our search
              database. This integration significantly increases the chances of finding your pet if they've been taken
              to a shelter.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="text-center"
      >
        <h2 className="text-3xl font-bold mb-6">Ready to Find Your Pet?</h2>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/">
            <Button size="lg" className="px-8 py-6 text-lg" style={{ backgroundColor: COLORS.primary }}>
              I've Lost My Pet
            </Button>
          </Link>
          <Link href="/">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
              I've Found a Pet
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

function StepCard({
  icon,
  title,
  description,
  step,
}: { icon: React.ReactNode; title: string; description: string; step: number }) {
  return (
    <motion.div variants={item} className="bg-white rounded-xl p-6 shadow-md border border-gray-100 relative">
      <div
        className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: COLORS.primary }}
      >
        {step}
      </div>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  )
}
