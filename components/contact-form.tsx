"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Mail, Phone, MapPin, Send, MessageSquare, Users, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { COLORS } from "@/lib/constants"

export function ContactForm() {
  const [formState, setFormState] = useState<"idle" | "submitting" | "success" | "error">("idle")
  const [inquiryType, setInquiryType] = useState("support")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormState("submitting")

    // Simulate form submission
    setTimeout(() => {
      setFormState("success")
    }, 1500)
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">Contact Us</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Have questions or feedback? We're here to help reunite pets with their families.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>

          {formState === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Message Sent Successfully!</h3>
              <p className="text-green-700 mb-4">
                Thank you for reaching out. We'll get back to you as soon as possible.
              </p>
              <Button onClick={() => setFormState("idle")} className="mt-2" style={{ backgroundColor: COLORS.primary }}>
                Send Another Message
              </Button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input id="name" name="name" placeholder="John Doe" required className="mt-1" />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" required className="mt-1" />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input id="phone" name="phone" type="tel" placeholder="(123) 456-7890" className="mt-1" />
              </div>

              <div>
                <Label>Inquiry Type</Label>
                <RadioGroup
                  defaultValue="support"
                  className="grid grid-cols-2 gap-4 mt-2"
                  onValueChange={setInquiryType}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="support" id="support" />
                    <Label htmlFor="support" className="cursor-pointer">
                      Pet Support
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="feedback" id="feedback" />
                    <Label htmlFor="feedback" className="cursor-pointer">
                      Feedback
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partnership" id="partnership" />
                    <Label htmlFor="partnership" className="cursor-pointer">
                      Partnership
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other" className="cursor-pointer">
                      Other
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder={
                    inquiryType === "support"
                      ? "Please provide details about your pet situation..."
                      : inquiryType === "feedback"
                        ? "We'd love to hear your thoughts on our service..."
                        : inquiryType === "partnership"
                          ? "Tell us about your organization and how we might work together..."
                          : "How can we help you today?"
                  }
                  required
                  className="mt-1 min-h-[150px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={formState === "submitting"}
                style={{ backgroundColor: COLORS.primary }}
              >
                {formState === "submitting" ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-50 rounded-xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6">Contact Information</h2>

          <div className="space-y-6">
            <ContactInfo
              icon={<Mail className="h-6 w-6" style={{ color: COLORS.primary }} />}
              title="Email Us"
              content={
                <a href="mailto:support@poochpetfinder.com" className="text-blue-600 hover:underline">
                  support@poochpetfinder.com
                </a>
              }
              description="We'll respond within 24 hours"
            />

            <ContactInfo
              icon={<Phone className="h-6 w-6" style={{ color: COLORS.primary }} />}
              title="Call Us"
              content={
                <a href="tel:+18005551234" className="text-blue-600 hover:underline">
                  (800) 555-1234
                </a>
              }
              description="Monday-Friday, 9am-5pm EST"
            />

            <ContactInfo
              icon={<MapPin className="h-6 w-6" style={{ color: COLORS.primary }} />}
              title="Visit Us"
              content="123 Pet Rescue Lane, Pawsville, CA 94103"
              description="By appointment only"
            />
          </div>

          <div className="mt-10">
            <h3 className="text-xl font-semibold mb-4">Specialized Support</h3>

            <div className="space-y-4">
              <SpecializedSupport
                icon={<MessageSquare className="h-5 w-5" style={{ color: COLORS.primary }} />}
                title="Lost Pet Emergency"
                description="Need urgent help with a lost pet?"
                action="Priority Support"
                link="/emergency"
              />

              <SpecializedSupport
                icon={<Users className="h-5 w-5" style={{ color: COLORS.primary }} />}
                title="Volunteer"
                description="Join our network of pet finders"
                action="Learn More"
                link="/volunteer"
              />

              <SpecializedSupport
                icon={<Building className="h-5 w-5" style={{ color: COLORS.primary }} />}
                title="Shelter Partnership"
                description="Register your shelter with POOCH"
                action="Partner With Us"
                link="/shelter-signup"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function ContactInfo({
  icon,
  title,
  content,
  description,
}: {
  icon: React.ReactNode
  title: string
  content: React.ReactNode
  description: string
}) {
  return (
    <div className="flex">
      <div className="flex-shrink-0 mr-4">{icon}</div>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <div className="mt-1 text-gray-900">{content}</div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}

function SpecializedSupport({
  icon,
  title,
  description,
  action,
  link,
}: {
  icon: React.ReactNode
  title: string
  description: string
  action: string
  link: string
}) {
  return (
    <div className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex-shrink-0 mr-3">{icon}</div>
      <div className="flex-grow">
        <h4 className="text-base font-medium">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex-shrink-0 ml-2">
        <a href={link} className="text-sm font-medium text-blue-600 hover:text-blue-800">
          {action} →
        </a>
      </div>
    </div>
  )
}
