import { redirect } from "next/navigation"

export default function ShelterDashboardRedirect() {
  redirect("/shelters")
  return null
} 