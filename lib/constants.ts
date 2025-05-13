// Brand Colors
export const COLORS = {
  primary: "#f59e42", // amber-600
  secondary: "#fef3c7", // amber-50
  accent: "#92400e", // amber-800
  text: "#1f2937", // gray-800
  background: "#fff",
  gray: {
    50: "gray-50",
    100: "gray-100",
    200: "gray-200",
    300: "gray-300",
    400: "gray-400",
    500: "gray-500",
    600: "gray-600",
    700: "gray-700",
    800: "gray-800",
    900: "gray-900",
  },
  white: "white",
  black: "black",
}

// Text Constants
export const SITE_NAME = "POOCH Pet Finder"
export const SITE_DESCRIPTION = "Helping reunite lost pets with their owners using advanced image recognition technology."
export const SITE_URL = process.env.SITE_URL || "https://YOUR_DOMAIN"

// SEO Constants
export const SEO = {
  defaultTitle: `${SITE_NAME} - Lost Pet Finder`,
  defaultDescription: SITE_DESCRIPTION,
  defaultOgImage: `${SITE_URL}/og-image.jpg`,
  twitter: {
    handle: "@poochfinder",
    site: "@poochfinder",
    cardType: "summary_large_image",
  },
}

// Navigation
export const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Contact", href: "/contact" },
  { name: "Shelters", href: "/shelters" },
]

// Footer Links
export const FOOTER_LINKS = {
  quickLinks: [
    { name: "Home", href: "/" },
    { name: "How It Works", href: "/how-it-works" },
    { name: "Blog", href: "/blog" },
    { name: "Community", href: "/community" },
    { name: "Help Center", href: "/help" },
    { name: "Feedback", href: "/feedback" },
    { name: "Contact", href: "/contact" },
    { name: "Shelters", href: "/shelters" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
  contact: {
    email: "info@pooch-finder.com",
    phone: "(555) 123-4567",
  },
}

// App Constants
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png"]
export const DEFAULT_SEARCH_RADIUS = 50 // miles
export const DEFAULT_MATCH_THRESHOLD = 0.7 // 70% match confidence

// Social links
export const SOCIAL_LINKS = {
  facebook: "#",
  twitter: "#",
  instagram: "#",
}
