import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import { SITE_NAME } from "@/lib/constants"

interface ConfirmationPageProps {
  params: {
    reportId: string
  }
}

export const metadata = {
  title: "Report Submitted - POOCH",
  description: "Thank you for helping reunite a lost pet with their owner.",
}

export default function ConfirmationPage({ params }: ConfirmationPageProps) {
  const { reportId } = params

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-amber-800 mb-2">Thank You!</h1>
        <p className="text-gray-600 mb-6">
          Your found pet report has been submitted successfully. We'll notify you if we find a potential match with a
          lost pet report.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h2 className="font-medium text-amber-800 mb-2">Report ID</h2>
          <p className="text-gray-700 font-mono bg-white p-2 rounded border border-gray-200">{reportId}</p>
          <p className="text-xs text-gray-500 mt-2">
            Please save this ID for your reference. You can use it to check the status of your report or update
            information.
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full bg-amber-600 hover:bg-amber-700">
            <Link href="/">
              Return to Home <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-amber-300 text-amber-700">
            <Link href="/dashboard">View Your Reports</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
