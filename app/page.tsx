import { Suspense } from "react"
import { UserPathSelector } from "@/components/user-path-selector"
import { Hero } from "@/components/hero"
import { HowItWorksContent } from "@/components/how-it-works-content"
import HomeClient from "@/components/home-client"

export const metadata = {
  title: "POOCH Pet Finder | Reunite Lost Pets with Their Owners",
  description: "POOCH uses advanced AI technology to help reunite lost pets with their owners. Upload a photo of your lost pet or a pet you've found to start the matching process.",
}

export default function Home() {
  return <HomeClient />
}
