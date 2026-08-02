// The generated Prisma client (sqlite + the new `prisma-client` generator)
// does not emit TS enum types for schema enums, so these are hand-defined
// and used as plain strings against the underlying TEXT columns.

export const ROLES = {
  CHURCH_ADMIN: "CHURCH_ADMIN",
  VOLUNTEER: "VOLUNTEER",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const EVENT_CATEGORIES = {
  DINNER: "DINNER",
  MENTORSHIP: "MENTORSHIP",
  COFFEE_CHAT: "COFFEE_CHAT",
  STUDY_GROUP: "STUDY_GROUP",
  CULTURAL_OUTING: "CULTURAL_OUTING",
  AIRPORT_PICKUP: "AIRPORT_PICKUP",
  HOLIDAY_CELEBRATION: "HOLIDAY_CELEBRATION",
  OTHER: "OTHER",
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  DINNER: "Dinner",
  MENTORSHIP: "Friend chat",
  COFFEE_CHAT: "Coffee chat",
  STUDY_GROUP: "Study group",
  CULTURAL_OUTING: "Cultural outing",
  AIRPORT_PICKUP: "Airport pickup",
  HOLIDAY_CELEBRATION: "Holiday celebration",
  OTHER: "Other",
};

export const EVENT_STATUS = {
  PUBLISHED: "PUBLISHED",
  CANCELLED: "CANCELLED",
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const RSVP_ROLE = {
  HELPER: "HELPER",
  ATTENDEE: "ATTENDEE",
} as const;

export type RsvpRole = (typeof RSVP_ROLE)[keyof typeof RSVP_ROLE];

export const RSVP_STATUS = {
  CONFIRMED: "CONFIRMED",
  WAITLISTED: "WAITLISTED",
  CANCELLED: "CANCELLED",
} as const;

export type RsvpStatus = (typeof RSVP_STATUS)[keyof typeof RSVP_STATUS];

export const CONNECTION_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  ENDED: "ENDED",
} as const;

export type ConnectionStatus = (typeof CONNECTION_STATUS)[keyof typeof CONNECTION_STATUS];

export const MEETING_FREQUENCY = {
  WEEKLY: "WEEKLY",
  BIWEEKLY: "BIWEEKLY",
  MONTHLY: "MONTHLY",
} as const;

export type MeetingFrequency = (typeof MEETING_FREQUENCY)[keyof typeof MEETING_FREQUENCY];

export const MEETING_FREQUENCY_LABELS: Record<MeetingFrequency, string> = {
  WEEKLY: "Every week",
  BIWEEKLY: "Every other week",
  MONTHLY: "Every month",
};

export const DAY_OF_WEEK_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const REPORT_STATUS = {
  OPEN: "OPEN",
  REVIEWED: "REVIEWED",
  DISMISSED: "DISMISSED",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const PARTNERSHIP_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
} as const;

export type PartnershipStatus = (typeof PARTNERSHIP_STATUS)[keyof typeof PARTNERSHIP_STATUS];

export const RIDE_STATUS = {
  OPEN: "OPEN",
  CLAIMED: "CLAIMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type RideStatus = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

export const RIDE_REQUEST_TYPE = {
  GENERAL: "GENERAL",
  FIRST_VISIT: "FIRST_VISIT",
} as const;

export type RideRequestType = (typeof RIDE_REQUEST_TYPE)[keyof typeof RIDE_REQUEST_TYPE];

// A minivan's worth, roughly — high enough for a real carpool, low enough
// that a typo (e.g. "40") doesn't create a request that looks like a bus.
export const MAX_RIDE_OFFER_CAPACITY = 8;

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case ROLES.CHURCH_ADMIN:
      return "/admin/dashboard";
    case ROLES.VOLUNTEER:
      return "/volunteer/dashboard";
    case ROLES.STUDENT:
      return "/student/dashboard";
  }
}

export function profilePathForRole(role: Role): string {
  switch (role) {
    case ROLES.CHURCH_ADMIN:
      return "/admin/profile";
    case ROLES.VOLUNTEER:
      return "/volunteer/profile";
    case ROLES.STUDENT:
      return "/student/profile";
  }
}

export function roleLabel(role: Role): string {
  switch (role) {
    case ROLES.CHURCH_ADMIN:
      return "Church leader";
    case ROLES.VOLUNTEER:
      return "Volunteer";
    case ROLES.STUDENT:
      return "International student";
  }
}

// A student can send at most this many mentor connection requests (new
// requests or re-requests after a decline) in a rolling 24h window. This is
// the actual anti-harassment control referenced in the safety rule — it is
// enforced in src/lib/actions/connections.ts by counting recent
// MentorConnection.lastRequestedAt values, not by an external rate limiter.
export const MAX_CONNECTION_REQUESTS_PER_DAY = 5;

// Caps "new event" notification emails per church per rolling 24h window,
// so one eager volunteer creating a string of events doesn't spam every
// member's inbox. Enforced in src/lib/actions/events.ts by counting recent
// Event.createdAt values for the church, not an external rate limiter.
export const MAX_EVENT_NOTIFICATIONS_PER_DAY = 3;

export const COUNTRIES = [
  // North America
  "United States", "Canada", "Mexico",
  // South America
  "Brazil", "Colombia", "Argentina", "Peru", "Venezuela", "Chile", "Ecuador", "Bolivia", "Paraguay", "Uruguay",
  // Europe
  "United Kingdom", "Germany", "France", "Italy", "Spain", "Ukraine", "Poland", "Romania", "Netherlands", "Belgium",
  "Czech Republic", "Greece", "Portugal", "Sweden", "Hungary", "Belarus", "Austria", "Serbia", "Switzerland", "Bulgaria",
  // Asia
  "China", "India", "Indonesia", "Pakistan", "Bangladesh", "Japan", "Philippines", "Vietnam", "Turkey", "Iran",
  "Thailand", "Myanmar", "South Korea", "Iraq", "Afghanistan", "Saudi Arabia", "Uzbekistan", "Malaysia", "Yemen", "Nepal",
  "North Korea", "Sri Lanka", "Kazakhstan", "Syria", "Cambodia", "Jordan", "Azerbaijan", "United Arab Emirates", "Tajikistan",
  "Israel", "Laos", "Lebanon", "Kyrgyzstan", "Turkmenistan", "Singapore", "Oman", "State of Palestine", "Kuwait", "Georgia",
  "Mongolia", "Armenia", "Qatar", "Bahrain", "Timor-Leste", "Cyprus", "Bhutan", "Maldives", "Brunei", "Taiwan",
  // Africa
  "Nigeria", "Ethiopia", "Egypt", "Democratic Republic of the Congo", "Tanzania", "South Africa", "Kenya", "Uganda",
  "Algeria", "Sudan", "Morocco", "Angola", "Mozambique", "Ghana", "Madagascar", "Cameroon", "Côte d'Ivoire", "Niger",
  "Burkina Faso", "Mali", "Malawi", "Zambia", "Senegal", "Chad", "Somalia", "Zimbabwe", "Guinea", "Rwanda", "Benin",
  "Burundi", "Tunisia", "South Sudan", "Togo", "Sierra Leone", "Libya", "Congo", "Liberia", "Central African Republic",
  // Oceania
  "Australia", "Papua New Guinea", "New Zealand", "Fiji", "Solomon Islands", "Micronesia", "Vanuatu", "Samoa", "Kiribati",
].sort();

export const LANGUAGES = [
  "English", "Mandarin Chinese", "Spanish", "Hindi", "Arabic", "Bengali", "Russian", "Portuguese", "Urdu", "Indonesian",
  "German", "Japanese", "Marathi", "Telugu", "Turkish", "Tamil", "Yue Chinese (Cantonese)", "Vietnamese", "Tagalog", "Wu Chinese",
  "Korean", "Persian", "Hausa", "Egyptian Arabic", "Swahili", "Javanese", "Italian", "Punjabi", "Gujarati", "Thai",
  "Amharic", "Kannada", "Bhojpuri", "Jin Chinese", "Southern Min", "Hakka", "Burmese", "Yoruba", "Uzbek", "Odia",
  "Maithili", "Sindhi", "Ukrainian", "Malayalam", "Sundanese", "Igbo", "Romanian", "Azerbaijani", "Awadhi", "Dutch",
  "Kurdish", "Serbo-Croatian", "Malagasy", "Saraiki", "Nepali", "Sinhalese", "Chittagonian", "Zhuang", "Khmer", "Turkmen",
  "Assamese", "Madurese", "Somali", "Marwari", "Magahi", "Haryanvi", "Hungarian", "Chhattisgarhi", "Greek", "Chewa",
  "Deccan", "Akan", "Kazakh", "Sylheti", "Zulu", "Czech", "Kinyarwanda", "Dhundhari", "Haitian Creole", "Ilocano",
  "Quechua", "Kirundi", "Swedish", "Hmong", "Shona", "Uyghur", "Hiligaynon", "Mossi", "Xhosa", "Belarusian", "Balochi", "Konkani",
].sort();

export const SCHOOLS = [
  // Texas (Keep existing + more)
  "University of Texas at Austin", "Texas A&M University", "University of Houston", "Texas Tech University", 
  "University of North Texas", "University of Texas at Dallas", "University of Texas at Arlington", "Baylor University", 
  "Rice University", "Southern Methodist University", "Texas Christian University", "University of Texas at San Antonio", 
  "Texas State University", "University of Texas at El Paso", "Stephen F. Austin State University", "Sam Houston State University",
  "Lamar University", "Texas A&M University-Corpus Christi", "Texas Woman's University", "University of Houston-Clear Lake",
  "University of Houston-Downtown", "Prairie View A&M University", "Tarleton State University", "Texas A&M International University",
  "West Texas A&M University", "Midwestern State University", "Angelo State University", "St. Edward's University",
  "Trinity University", "Southwestern University", "University of Dallas", "St. Mary's University", "Abilene Christian University",
  
  // Ivy League & Top Tier
  "Harvard University", "Stanford University", "Massachusetts Institute of Technology (MIT)", "Yale University", 
  "Princeton University", "Columbia University", "University of Pennsylvania", "Brown University", "Cornell University", 
  "Dartmouth College", "California Institute of Technology (Caltech)", "University of Chicago", "Johns Hopkins University", 
  "Northwestern University", "Duke University", "Vanderbilt University", "Washington University in St. Louis",
  
  // UC System & California
  "University of California, Berkeley", "University of California, Los Angeles", "University of California, San Diego", 
  "University of California, Davis", "University of California, Irvine", "University of California, Santa Barbara", 
  "University of California, Santa Cruz", "University of California, Riverside", "University of Southern California", 
  "Santa Clara University", "Loyola Marymount University", "Chapman University", "San Diego State University",
  
  // Public Ivy & Big State Schools
  "University of Michigan", "University of Virginia", "University of North Carolina at Chapel Hill", "William & Mary", 
  "University of Texas at Austin", "University of Florida", "University of Washington", "University of Wisconsin-Madison", 
  "University of Illinois at Urbana-Champaign", "Georgia Institute of Technology", "University of Maryland, College Park", 
  "Ohio State University", "Purdue University", "Pennsylvania State University", "Rutgers University", "University of Minnesota", 
  "Indiana University Bloomington", "Michigan State University", "University of Colorado Boulder", "University of Arizona",
  "Arizona State University", "University of Utah", "University of Oregon", "University of Massachusetts Amherst",
  
  // Private & Other Notable
  "New York University", "Boston University", "Northeastern University", "Tufts University", "Boston College", 
  "Carnegie Mellon University", "Emory University", "Georgetown University", "George Washington University", "Tulane University", 
  "University of Miami", "Syracuse University", "Villanova University", "Wake Forest University", "Rensselaer Polytechnic Institute",
  "Rochester Institute of Technology", "Worcester Polytechnic Institute", "Stevens Institute of Technology", "Pratt Institute",
  "Rhode Island School of Design", "Berklee College of Music", "Juilliard School", "Parsons School of Design",
].sort();

export const MAJORS = [
  // STEM
  "Computer Science", "Software Engineering", "Information Technology", "Cybersecurity", "Data Science", "Artificial Intelligence",
  "Mathematics", "Statistics", "Applied Mathematics", "Actuarial Science",
  "Physics", "Astrophysics", "Chemistry", "Biochemistry", "Biology", "Microbiology", "Genetics", "Neuroscience",
  "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering", "Aerospace Engineering",
  "Biomedical Engineering", "Industrial Engineering", "Environmental Engineering", "Computer Engineering", "Materials Science",
  
  // Business & Finance
  "Business Administration", "Management", "Finance", "Accounting", "Economics", "Marketing", "Supply Chain Management",
  "International Business", "Entrepreneurship", "Human Resources", "Real Estate", "Hospitality Management", "Sports Management",
  
  // Humanities & Arts
  "English", "Creative Writing", "Literature", "History", "Philosophy", "Theology", "Religious Studies",
  "Art History", "Fine Arts", "Graphic Design", "Industrial Design", "Architecture", "Interior Design",
  "Music", "Music Performance", "Theater", "Dance", "Film and Television", "Photography",
  
  // Social Sciences
  "Psychology", "Sociology", "Anthropology", "Political Science", "International Relations", "Public Policy",
  "Communications", "Journalism", "Public Relations", "Media Studies", "Linguistics", "Criminal Justice", "Criminology",
  "Geography", "Urban Planning", "Women's and Gender Studies", "Ethnic Studies",
  
  // Health & Education
  "Nursing", "Pre-Medicine", "Pre-Dentistry", "Pre-Pharmacy", "Pre-Veterinary", "Public Health", "Kinesiology",
  "Nutrition and Dietetics", "Physical Therapy", "Occupational Therapy", "Speech-Language Pathology",
  "Education", "Early Childhood Education", "Elementary Education", "Secondary Education", "Special Education",
].sort();

export const INDUSTRIES = [
  "Technology (Software / Internet)", "Technology (Hardware / Semiconductors)", "Artificial Intelligence / Machine Learning",
  "Healthcare / Hospitals", "Pharmaceuticals / Biotech", "Medical Devices",
  "Financial Services", "Banking", "Investment Banking / Private Equity", "Venture Capital", "Insurance", "Accounting / Tax",
  "Education / Higher Ed", "EdTech",
  "Manufacturing", "Automotive", "Aerospace and Defense", "Chemicals",
  "Retail", "E-commerce", "Consumer Goods / CPG",
  "Real Estate", "Construction", "Architecture / Urban Planning",
  "Consulting", "Management Consulting", "Strategy",
  "Media and Entertainment", "Film / Television", "Music", "Publishing", "Journalism",
  "Non-profit / NGO", "Philanthropy", "Social Services",
  "Government / Public Administration", "Law Enforcement", "Military",
  "Energy / Oil & Gas", "Renewable Energy / Cleantech", "Utilities",
  "Transportation / Logistics", "Supply Chain", "Aviation / Airlines",
  "Telecommunications",
  "Hospitality / Tourism", "Food and Beverage", "Restaurants",
  "Legal Services", "Law Practice",
  "Agriculture / Forestry", "Mining",
  "Marketing / Advertising", "Public Relations (PR)",
  "Design / Graphic Design", "Fashion / Apparel",
  "Sports / Athletics",
  "Human Resources / Staffing",
].sort();
