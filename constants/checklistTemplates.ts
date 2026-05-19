import { ChecklistItemInput } from "@/types/checklist.types";

export interface ChecklistTemplate {
  name: string;
  items: ChecklistItemInput[];
}

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate> = {
  "Wedding": {
    name: "Wedding",
    items: [
      // Pre-wedding planning
      { category: "Pre-wedding planning", task: "Finalise wedding budget", priority: "medium" },
      { category: "Pre-wedding planning", task: "Fix wedding date(s)", priority: "medium" },
      { category: "Pre-wedding planning", task: "Create guest list (approx count)", priority: "medium" },
      { category: "Pre-wedding planning", task: "Book wedding planner (optional)", priority: "medium" },
      { category: "Pre-wedding planning", task: "Shortlist venues (wedding + functions)", priority: "medium" },
      
      // Venue & Catering
      { category: "Venue & Catering", task: "Book wedding venue", priority: "medium" },
      { category: "Venue & Catering", task: "Stage & mandap décor", priority: "medium" },
      { category: "Venue & Catering", task: "Lighting setup", priority: "medium" },
      { category: "Venue & Catering", task: "Theme props & signage", priority: "medium" },
      { category: "Venue & Catering", task: "Arrange seating chart", priority: "medium" },
      { category: "Venue & Catering", task: "Confirm venue enterance decorations", priority: "medium" },
      { category: "Venue & Catering", task: "Book bar service", priority: "medium" },
      { category: "Venue & Catering", task: "Finalize catering menu", priority: "medium" },
      { category: "Venue & Catering", task: "Confirm final headcount with caterer", priority: "medium" },
      { category: "Venue & Catering", task: "Arrange dessert/cake table", priority: "medium" },
      { category: "Venue & Catering", task: "Plan cocktail hour menu", priority: "medium" },
      { category: "Venue & Catering", task: "Live food counters", priority: "medium" },
      { category: "Venue & Catering", task: "Catering staff & serving plan", priority: "medium" },
      { category: "Venue & Catering", task: "Coordinate venue setup timing", priority: "medium" },

      // Photography & Entertainment
      { category: "Photography & Entertainment", task: "Book wedding photographer & Cinematographer", priority: "medium" },
      { category: "Photography & Entertainment", task: "Book videographer", priority: "medium" },
      { category: "Photography & Entertainment", task: "Hire DJ or band", priority: "medium" },
      { category: "Photography & Entertainment", task: "Plan wedding playlist", priority: "medium" },
      { category: "Photography & Entertainment", task: "Book entertainment for cocktail hour", priority: "medium" },
      { category: "Photography & Entertainment", task: "Create shot list for photographer", priority: "medium" },
      { category: "Photography & Entertainment", task: "Schedule engagement photos", priority: "medium" },
      { category: "Photography & Entertainment", task: "Plan first dance and parent dances", priority: "medium" },
      { category: "Photography & Entertainment", task: "Book live performers if needed", priority: "medium" },
      { category: "Photography & Entertainment", task: "Album & video deliverables confirmed timelines", priority: "medium" },

      // Attire & Beauty
      { category: "Attire & Beauty", task: "Purchase/Order/stitching bride/groom wedding dress", priority: "medium" },
      { category: "Attire & Beauty", task: "Book makeup artist", priority: "medium" },
      { category: "Attire & Beauty", task: "Schedule hair trial & Make-up", priority: "medium" },
      { category: "Attire & Beauty", task: "Buy wedding shoes", priority: "medium" },
      { category: "Attire & Beauty", task: "Trial/fitting bridesmaid/groomsmen, family attire", priority: "medium" },
      { category: "Attire & Beauty", task: "Schedule final fittings", priority: "medium" },
      { category: "Attire & Beauty", task: "Book Mehndi artist if applicable", priority: "medium" },
      { category: "Attire & Beauty", task: "Arrange jewelry and accessories", priority: "medium" },

      // Documentation & Invitations
      { category: "Documentation & Invitations", task: "Apply for marriage license", priority: "medium" },
      { category: "Documentation & Invitations", task: "Order wedding invitations", priority: "medium" },
      { category: "Documentation & Invitations", task: "Send save-the-dates Post/couriere.", priority: "medium" },
      { category: "Documentation & Invitations", task: "Create wedding website", priority: "medium" },
      { category: "Documentation & Invitations", task: "Finalize guest list before sending invites", priority: "medium" },
      { category: "Documentation & Invitations", task: "Send formal invitations - E-cards", priority: "medium" },
      { category: "Documentation & Invitations", task: "Track RSVPs", priority: "medium" },
      { category: "Documentation & Invitations", task: "Prepare thank-you cards", priority: "medium" },
      { category: "Documentation & Invitations", task: "Arrange marriage certificate", priority: "medium" },
      { category: "Documentation & Invitations", task: "Arrange outstation family/guest stay.", priority: "medium" },

      // Ceremony & Rituals
      { category: "Ceremony & Rituals", task: "Book priest/officiant", priority: "medium" },
      { category: "Ceremony & Rituals", task: "Plan ceremony order", priority: "medium" },
      { category: "Ceremony & Rituals", task: "Arrange mandap/décor", priority: "medium" },
      { category: "Ceremony & Rituals", task: "Select wedding vows", priority: "medium" },
      { category: "Ceremony & Rituals", task: "Plan flower garlands and decorations", priority: "medium" },
      { category: "Ceremony & Rituals", task: "Coordinate ritual Props, Puja Samagri", priority: "medium" },

      // Wedding Day Essentials
      { category: "Wedding Day Essentials", task: "Wedding timeline shared with vendors", priority: "medium" },
      { category: "Wedding Day Essentials", task: "Emergency kit (safety pins, makeup, medicines)", priority: "medium" },
      { category: "Wedding Day Essentials", task: "Bride & groom transport arranged", priority: "medium" },
      { category: "Wedding Day Essentials", task: "Guest transport arranged", priority: "medium" },
      { category: "Wedding Day Essentials", task: "On-ground coordinator assigned", priority: "medium" },

      // Post-Wedding Tasks
      { category: "Post-Wedding Tasks", task: "Vendor payments cleared", priority: "medium" },
      { category: "Post-Wedding Tasks", task: "Return rented items", priority: "medium" },
      { category: "Post-Wedding Tasks", task: "Photo/video follow-ups", priority: "medium" },
      { category: "Post-Wedding Tasks", task: "Thank-you notes to guests", priority: "medium" },
    ]
  },
  "Birthday": {
    name: "Birthday",
    items: [
      // Planning
      { category: "Planning", task: "Set party date and time", priority: "medium" },
      { category: "Planning", task: "Set party budget", priority: "medium" },
      { category: "Planning", task: "Decide on party size (intimate vs large)", priority: "medium" },
      { category: "Planning", task: "Create guest list", priority: "medium" },
      { category: "Planning", task: "Send invitations & Set RSVP", priority: "medium" },
      { category: "Planning", task: "Plan party activities", priority: "medium" },
      { category: "Planning", task: "Choose party theme", priority: "medium" },
      { category: "Planning", task: "Plan age-appropriate games", priority: "medium" },
      { category: "Planning", task: "Create party timeline", priority: "medium" },

      // Venue & Decorations
      { category: "Venue & Decorations", task: "Book party venue", priority: "medium" },
      { category: "Venue & Decorations", task: "Order decorations", priority: "medium" },
      { category: "Venue & Decorations", task: "Arrange seating", priority: "medium" },
      { category: "Venue & Decorations", task: "Set up photo booth", priority: "medium" },
      { category: "Venue & Decorations", task: "Plan lighting", priority: "medium" },
      { category: "Venue & Decorations", task: "Order balloons and banners", priority: "medium" },
      { category: "Venue & Decorations", task: "Arrange backdrop for photos", priority: "medium" },
      { category: "Venue & Decorations", task: "Plan table centerpieces", priority: "medium" },
      { category: "Venue & Decorations", task: "Order theme-specific props", priority: "medium" },

      // Food & Cake
      { category: "Food & Cake", task: "Order birthday cake", priority: "medium" },
      { category: "Food & Cake", task: "Plan party menu", priority: "medium" },
      { category: "Food & Cake", task: "Arrange catering", priority: "medium" },
      { category: "Food & Cake", task: "Buy party favors", priority: "medium" },
      { category: "Food & Cake", task: "Prepare drinks", priority: "medium" },
      { category: "Food & Cake", task: "Order appetizers/snacks", priority: "medium" },
      { category: "Food & Cake", task: "Arrange dessert table", priority: "medium" },
      { category: "Food & Cake", task: "Plan dietary options", priority: "medium" },
      { category: "Food & Cake", task: "Order return gifts, Pack, Thank You note", priority: "medium" },

      // Entertainment
      { category: "Entertainment", task: "Book entertainer/ magician if needed", priority: "medium" },
      { category: "Entertainment", task: "Plan music playlist", priority: "medium" },
      { category: "Entertainment", task: "Arrange party games", priority: "medium" },
      { category: "Entertainment", task: "Book Photographer and photo booth", priority: "medium" },
      { category: "Entertainment", task: "Plan surprise element", priority: "medium" },

      // On-the-Day Checklist
      { category: "On-the-Day Checklist", task: "Vendors arrive on time", priority: "medium" },
      { category: "On-the-Day Checklist", task: "Décor setup complete", priority: "medium" },
      { category: "On-the-Day Checklist", task: "Cake delivery confirmed", priority: "medium" },
      { category: "On-the-Day Checklist", task: "Music & sound check", priority: "medium" },
      { category: "On-the-Day Checklist", task: "Gifts distribution planned", priority: "medium" },
    ]
  },
  "Personal Milestones": {
    name: "Personal Milestones",
    items: [
      // Planning
      { category: "Planning", task: "Define milestone (retirement, graduation, anniversary)", priority: "medium" },
      { category: "Planning", task: "Set event date and venue", priority: "medium" },
      { category: "Planning", task: "Create guest list", priority: "medium" },
      { category: "Planning", task: "Set budget", priority: "medium" },
      { category: "Planning", task: "Choose theme or format", priority: "medium" },

      // Celebration Setup
      { category: "Celebration Setup", task: "Book venue", priority: "medium" },
      { category: "Celebration Setup", task: "Arrange catering", priority: "medium" },
      { category: "Celebration Setup", task: "Order cake/desserts", priority: "medium" },
      { category: "Celebration Setup", task: "Plan decorations", priority: "medium" },
      { category: "Celebration Setup", task: "Arrange seating", priority: "medium" },

      // Memories & Mementos
      { category: "Memories & Mementos", task: "Create photo/video montage", priority: "medium" },
      { category: "Memories & Mementos", task: "Collect testimonial messages", priority: "medium" },
      { category: "Memories & Mementos", task: "Prepare gift/plaque", priority: "medium" },
      { category: "Memories & Mementos", task: "Book photographer", priority: "medium" },
      { category: "Memories & Mementos", task: "Arrange memory display", priority: "medium" },

      // Logistics
      { category: "Logistics", task: "Send invitations", priority: "medium" },
      { category: "Logistics", task: "Arrange accommodations for out-of-town guests", priority: "medium" },
      { category: "Logistics", task: "Plan program/speeches", priority: "medium" },
      { category: "Logistics", task: "Coordinate timing", priority: "medium" },
      { category: "Logistics", task: "Prepare thank-you notes", priority: "medium" },
    ]
  },
  "Exhibition": {
    name: "Exhibition",
    items: [
      // Pre-Event Planning
      { category: "Pre-Event Planning", task: "Define exhibition objectives", priority: "medium" },
      { category: "Pre-Event Planning", task: "Select exhibition type (trade, consumer, corporate, art, etc.)", priority: "medium" },
      { category: "Pre-Event Planning", task: "Set exhibition dates", priority: "medium" },
      { category: "Pre-Event Planning", task: "Book exhibition hall/venue", priority: "medium" },
      { category: "Pre-Event Planning", task: "Set up registration system", priority: "medium" },
      { category: "Pre-Event Planning", task: "Plan floor layout", priority: "medium" },
      { category: "Pre-Event Planning", task: "Create exhibitor list", priority: "medium" },
      { category: "Pre-Event Planning", task: "Check power supply & load requirements", priority: "medium" },
      { category: "Pre-Event Planning", task: "Internet/Wi-Fi availability", priority: "medium" },
      { category: "Pre-Event Planning", task: "Parking & visitor access details", priority: "medium" },
      { category: "Pre-Event Planning", task: "Security & insurance arrangements", priority: "medium" },

      // Stall & Display
      { category: "Stall & Display", task: "Book stall/booth space", priority: "medium" },
      { category: "Stall & Display", task: "Design stall layout", priority: "medium" },
      { category: "Stall & Display", task: "Order display materials", priority: "medium" },
      { category: "Stall & Display", task: "Arrange signage and branding", priority: "medium" },
      { category: "Stall & Display", task: "Set up product displays", priority: "medium" },
      { category: "Stall & Display", task: "Prepare promotional materials", priority: "medium" },

      // Logistics & Operations
      { category: "Logistics & Operations", task: "Book AV equipment", priority: "medium" },
      { category: "Logistics & Operations", task: "Arrange furniture and fixtures", priority: "medium" },
      { category: "Logistics & Operations", task: "Coordinate load-in/load-out", priority: "medium" },
      { category: "Logistics & Operations", task: "Plan visitor flow", priority: "medium" },
      { category: "Logistics & Operations", task: "Arrange storage", priority: "medium" },
      { category: "Logistics & Operations", task: "Send invitations to visitors", priority: "medium" },

      // Marketing & Outreach
      { category: "Marketing & Outreach", task: "Create social media campaign", priority: "medium" },
      { category: "Marketing & Outreach", task: "Print brochures and catalogs", priority: "medium" },
      { category: "Marketing & Outreach", task: "Plan press releases", priority: "medium" },
      { category: "Marketing & Outreach", task: "Coordinate with media", priority: "medium" },

      // Team & Staffing
      { category: "Team & Staffing", task: "Staff allocation & roles", priority: "medium" },
      { category: "Team & Staffing", task: "Uniforms / dress code", priority: "medium" },
      { category: "Team & Staffing", task: "Staff briefing & training", priority: "medium" },
      { category: "Team & Staffing", task: "Daily shift schedules", priority: "medium" },
      { category: "Team & Staffing", task: "ID cards / badges", priority: "medium" },

      // Materials & Setup
      { category: "Materials & Setup", task: "Price lists & catalogs", priority: "medium" },
      { category: "Materials & Setup", task: "Product samples / demos", priority: "medium" },
      { category: "Materials & Setup", task: "Lead forms / QR codes", priority: "medium" },
      { category: "Materials & Setup", task: "Stationery (pens, notepads, clipboards)", priority: "medium" },
      { category: "Materials & Setup", task: "Power backups & chargers", priority: "medium" },

      // On-Ground Management
      { category: "On-Ground Management", task: "Stall setup check", priority: "medium" },
      { category: "On-Ground Management", task: "Electrical & internet testing", priority: "medium" },
      { category: "On-Ground Management", task: "Registration / visitor handling", priority: "medium" },
      { category: "On-Ground Management", task: "Lead capture & data backup", priority: "medium" },
      { category: "On-Ground Management", task: "Daily stock check", priority: "medium" },

      // Post-Exhibition Tasks
      { category: "Post-Exhibition Tasks", task: "Stall dismantling", priority: "medium" },
      { category: "Post-Exhibition Tasks", task: "Vendor payments & closure", priority: "medium" },
      { category: "Post-Exhibition Tasks", task: "Lead follow-ups", priority: "medium" },
      { category: "Post-Exhibition Tasks", task: "Performance review & ROI analysis", priority: "medium" },
      { category: "Post-Exhibition Tasks", task: "Feedback collection", priority: "medium" },
    ]
  },
  "Home Ceremony": {
    name: "Home Ceremony",
    items: [
      // Event Planning
      { category: "Event Planning", task: "Define event type (housewarming, griha pravesh)", priority: "medium" },
      { category: "Event Planning", task: "Fix date and time", priority: "medium" },
      { category: "Event Planning", task: "Create guest list", priority: "medium" },
      { category: "Event Planning", task: "Set budget", priority: "medium" },
      { category: "Event Planning", task: "Book priest if needed", priority: "medium" },
      { category: "Event Planning", task: "Complete home cleaning", priority: "medium" },

      // Home Preparation
      { category: "Home Preparation", task: "Arrange decorations", priority: "medium" },
      { category: "Home Preparation", task: "Set up puja area", priority: "medium" },
      { category: "Home Preparation", task: "Prepare entrance decorations", priority: "medium" },
      { category: "Home Preparation", task: "Arrange seating", priority: "medium" },
      { category: "Home Preparation", task: "Arrange catering", priority: "medium" },

      // Catering & Gifts
      { category: "Catering & Gifts", task: "Plan menu", priority: "medium" },
      { category: "Catering & Gifts", task: "Order return gifts", priority: "medium" },
      { category: "Catering & Gifts", task: "Arrange sweets/prasad", priority: "medium" },
      { category: "Catering & Gifts", task: "Prepare welcome drinks", priority: "medium" },
      { category: "Catering & Gifts", task: "Send invitations", priority: "medium" },

      // Logistics
      { category: "Logistics", task: "Arrange parking", priority: "medium" },
      { category: "Logistics", task: "Book photographer", priority: "medium" },
      { category: "Logistics", task: "Coordinate with neighbors", priority: "medium" },
      { category: "Logistics", task: "Plan guest flow", priority: "medium" },
    ]
  },
  "Festivals": {
    name: "Festivals",
    items: [
      // Logistics
      { category: "Logistics", task: "Choose festival to celebrate", priority: "medium" },

      // Planning
      { category: "Planning", task: "Set date and venue", priority: "medium" },
      { category: "Planning", task: "Create guest list", priority: "medium" },
      { category: "Planning", task: "Set budget", priority: "medium" },
      { category: "Planning", task: "Plan festival theme", priority: "medium" },
      { category: "Planning", task: "Order festival decorations", priority: "medium" },

      // Decorations & Setup
      { category: "Decorations & Setup", task: "Arrange rangoli/kolam", priority: "medium" },
      { category: "Decorations & Setup", task: "Set up puja area", priority: "medium" },
      { category: "Decorations & Setup", task: "Arrange lighting (diyas/lamps)", priority: "medium" },
      { category: "Decorations & Setup", task: "Prepare ceremonial setup", priority: "medium" },
      { category: "Decorations & Setup", task: "Plan festival menu", priority: "medium" },

      // Food & Prasad
      { category: "Food & Prasad", task: "Prepare traditional sweets", priority: "medium" },
      { category: "Food & Prasad", task: "Arrange prasad distribution", priority: "medium" },
      { category: "Food & Prasad", task: "Order special dishes", priority: "medium" },
      { category: "Food & Prasad", task: "Arrange packaging for distribution", priority: "medium" },
      { category: "Food & Prasad", task: "Plan cultural programs", priority: "medium" },

      // Activities & Entertainment
      { category: "Activities & Entertainment", task: "Arrange music/dance", priority: "medium" },
      { category: "Activities & Entertainment", task: "Organize games/activities", priority: "medium" },
      { category: "Activities & Entertainment", task: "Book performers if needed", priority: "medium" },
      { category: "Activities & Entertainment", task: "Plan gift distribution", priority: "medium" },
    ]
  },
  "Junior Journeys / Nanhne Utsav": {
    name: "Junior Journeys / Nanhne Utsav",
    items: [
      // Planning
      { category: "Planning", task: "Fix ceremony date (muhurat)", priority: "medium" },
      { category: "Planning", task: "Book priest/pandit", priority: "medium" },
      { category: "Planning", task: "Create guest list", priority: "medium" },
      { category: "Planning", task: "Set budget", priority: "medium" },
      { category: "Planning", task: "Choose venue (home or hall)", priority: "medium" },
      { category: "Planning", task: "Arrange mandap/decorations", priority: "medium" },

      // Ceremony Setup
      { category: "Ceremony Setup", task: "Prepare puja samagri", priority: "medium" },
      { category: "Ceremony Setup", task: "Arrange ceremonial attire", priority: "medium" },
      { category: "Ceremony Setup", task: "Set up seating", priority: "medium" },
      { category: "Ceremony Setup", task: "Plan ritual sequence", priority: "medium" },
      { category: "Ceremony Setup", task: "Arrange catering", priority: "medium" },

      // Catering & Gifts
      { category: "Catering & Gifts", task: "Order sweets and prasad", priority: "medium" },
      { category: "Catering & Gifts", task: "Prepare return gifts", priority: "medium" },
      { category: "Catering & Gifts", task: "Plan meal service", priority: "medium" },
      { category: "Catering & Gifts", task: "Arrange refreshments", priority: "medium" },
      { category: "Catering & Gifts", task: "Send invitations", priority: "medium" },

      // Documentation
      { category: "Documentation", task: "Book photographer", priority: "medium" },
      { category: "Documentation", task: "Arrange videography", priority: "medium" },
      { category: "Documentation", task: "Prepare certificate", priority: "medium" },
      { category: "Documentation", task: "Track RSVPs", priority: "medium" },
    ]
  },
  "Corporate": {
    name: "Corporate",
    items: [
      // Planning & Logistics
      { category: "Planning & Logistics", task: "Define event objectives - (product launch, awareness, training, sales, networking)", priority: "medium" },
      { category: "Planning & Logistics", task: "Set event budget", priority: "medium" },
      { category: "Planning & Logistics", task: "Fix event date", priority: "medium" },
      { category: "Planning & Logistics", task: "Decide event format (seminar, panel, demo, keynote, hybrid)", priority: "medium" },
      { category: "Planning & Logistics", task: "Book corporate venue", priority: "medium" },
      { category: "Planning & Logistics", task: "Arrange transportation", priority: "medium" },
      { category: "Planning & Logistics", task: "Plan event timeline", priority: "medium" },
      { category: "Planning & Logistics", task: "Create attendee list", priority: "medium" },
      { category: "Planning & Logistics", task: "Set up registration portal", priority: "medium" },
      { category: "Planning & Logistics", task: "Plan backup for weather/tech", priority: "medium" },
      { category: "Planning & Logistics", task: "Book AV equipment", priority: "medium" },

      // Technology & Equipment
      { category: "Technology & Equipment", task: "Test presentation setup", priority: "medium" },
      { category: "Technology & Equipment", task: "Arrange live streaming", priority: "medium" },
      { category: "Technology & Equipment", task: "Set up registration system", priority: "medium" },
      { category: "Technology & Equipment", task: "Prepare backup equipment", priority: "medium" },
      { category: "Technology & Equipment", task: "Arrange wifi/networking", priority: "medium" },
      { category: "Technology & Equipment", task: "Test mics", priority: "medium" },
      { category: "Technology & Equipment", task: "Prepare presentation backups", priority: "medium" },

      // Catering & Hospitality
      { category: "Catering & Hospitality", task: "Arrange corporate catering", priority: "medium" },
      { category: "Catering & Hospitality", task: "Plan welcome reception", priority: "medium" },
      { category: "Catering & Hospitality", task: "Organize coffee breaks", priority: "medium" },
      { category: "Catering & Hospitality", task: "Prepare welcome kits", priority: "medium" },
      { category: "Catering & Hospitality", task: "Arrange accommodation", priority: "medium" },
      { category: "Catering & Hospitality", task: "Plan dietary requirements", priority: "medium" },
      { category: "Catering & Hospitality", task: "Arrange lunch/dinner", priority: "medium" },
      { category: "Catering & Hospitality", task: "Set up hospitality desk", priority: "medium" },
      { category: "Catering & Hospitality", task: "Design event collateral", priority: "medium" },

      // Branding & Materials
      { category: "Branding & Materials", task: "Print name badges", priority: "medium" },
      { category: "Branding & Materials", task: "Prepare signage", priority: "medium" },
      { category: "Branding & Materials", task: "Arrange banners and branding", priority: "medium" },
      { category: "Branding & Materials", task: "Create feedback forms", priority: "medium" },
      { category: "Branding & Materials", task: "Event theme & branding finalized", priority: "medium" },
      { category: "Branding & Materials", task: "Stage backdrop & standees", priority: "medium" },
      { category: "Branding & Materials", task: "Welcome desk branding", priority: "medium" },

      // Speakers & Agenda
      { category: "Speakers & Agenda", task: "Speaker confirmation", priority: "medium" },
      { category: "Speakers & Agenda", task: "Event agenda & run-of-show", priority: "medium" },
      { category: "Speakers & Agenda", task: "Speaker presentations collected", priority: "medium" },
      { category: "Speakers & Agenda", task: "Speaker briefing & rehearsals", priority: "medium" },
      { category: "Speakers & Agenda", task: "Moderator / host finalized", priority: "medium" },

      // Registration & Guest Management
      { category: "Registration & Guest Management", task: "Guest list & invitations", priority: "medium" },
      { category: "Registration & Guest Management", task: "Online/offline registration setup", priority: "medium" },
      { category: "Registration & Guest Management", task: "Check-in desk & QR codes", priority: "medium" },
      { category: "Registration & Guest Management", task: "Name badges / lanyards", priority: "medium" },
      { category: "Registration & Guest Management", task: "VIP seating (if any)", priority: "medium" },

      // Team & On-Ground Staff
      { category: "Team & On-Ground Staff", task: "Event coordinator assigned", priority: "medium" },
      { category: "Team & On-Ground Staff", task: "Volunteers & support staff", priority: "medium" },
      { category: "Team & On-Ground Staff", task: "Staff roles & responsibilities", priority: "medium" },
      { category: "Team & On-Ground Staff", task: "Dress code / uniforms", priority: "medium" },
      { category: "Team & On-Ground Staff", task: "Emergency contact list", priority: "medium" },

      // Event Day Execution
      { category: "Event Day Execution", task: "Venue setup check", priority: "medium" },
      { category: "Event Day Execution", task: "AV testing & sound check", priority: "medium" },
      { category: "Event Day Execution", task: "Registration desk ready", priority: "medium" },
      { category: "Event Day Execution", task: "Agenda timing control", priority: "medium" },
      { category: "Event Day Execution", task: "Guest & speaker coordination", priority: "medium" },
      { category: "Event Day Execution", task: "Photography & videography", priority: "medium" },

      // Post-Event Activities
      { category: "Post-Event Activities", task: "Thank-you emails/messages", priority: "medium" },
      { category: "Post-Event Activities", task: "Lead data & attendance report", priority: "medium" },
      { category: "Post-Event Activities", task: "Media & photo sharing", priority: "medium" },
      { category: "Post-Event Activities", task: "Feedback collection", priority: "medium" },
      { category: "Post-Event Activities", task: "Budget closure & ROI review", priority: "medium" },
    ]
  }
};

function normalizeEventLabel(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Maps API / dropdown event names to a checklist template key. */
export function resolveChecklistTemplateKey(eventName: string): string | null {
  if (CHECKLIST_TEMPLATES[eventName]) return eventName;

  const normalized = normalizeEventLabel(eventName);
  const raw = eventName.toLowerCase();

  const rules: { test: () => boolean; key: string }[] = [
    { test: () => /wedding/.test(normalized), key: 'Wedding' },
    { test: () => /birthday/.test(normalized), key: 'Birthday' },
    {
      test: () =>
        /junior/.test(normalized) ||
        /nanhne|nanne|nahne/.test(normalized) ||
        (normalized.includes('nanh') && normalized.includes('utsav')),
      key: 'Junior Journeys / Nanhne Utsav',
    },
    {
      test: () =>
        /home/.test(normalized) ||
        /griha/.test(normalized) ||
        /housewarm/.test(normalized) ||
        /house warm/.test(normalized),
      key: 'Home Ceremony',
    },
    { test: () => /festival/.test(normalized), key: 'Festivals' },
    { test: () => /exhibition/.test(normalized), key: 'Exhibition' },
    { test: () => /corporate/.test(normalized), key: 'Corporate' },
    { test: () => /personal/.test(normalized) && /milestone/.test(normalized), key: 'Personal Milestones' },
  ];

  for (const { test, key } of rules) {
    if (test() && CHECKLIST_TEMPLATES[key]) return key;
  }

  for (const key of Object.keys(CHECKLIST_TEMPLATES)) {
    const templateNorm = normalizeEventLabel(key);
    const templateBase = templateNorm.split('/')[0]?.trim() ?? templateNorm;
    if (normalized === templateNorm || normalized === templateBase) return key;
    if (normalized.includes(templateBase) || templateBase.includes(normalized)) return key;
    if (raw.includes(key.toLowerCase()) || key.toLowerCase().includes(raw)) return key;
  }

  return null;
}

export function getChecklistTemplateItems(eventName: string): ChecklistItemInput[] {
  const key = resolveChecklistTemplateKey(eventName);
  if (!key) return [];
  return CHECKLIST_TEMPLATES[key].items.map((item) => ({ ...item }));
}
