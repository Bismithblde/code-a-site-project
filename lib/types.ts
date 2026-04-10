export interface Brand {
  id: string;
  slug: string;
  name: string;
  origin: string;
  type: "still" | "sparkling" | "both";
  calcium: number;
  magnesium: number;
  sodium: number;
  potassium: number;
  bicarbonate: number;
  sulfate: number;
  chloride: number;
  silica: number;
  fluoride: number;
  tds: number;
  ph: number;
  amazon_asin: string;
  image: string;
  tasting_notes: string;
  rating: number;
  price_range: "$" | "$$" | "$$$";
}

export interface Mineral {
  id: string;
  slug: string;
  name: string;
  symbol: string;
  unit: string;
  daily_value: number;
  benefits: string[];
  high_threshold: number;
  low_threshold: number;
}

export interface Profile {
  id: string;
  name: string;
  weight: number;
  unit: "kg" | "lbs";
  activity_level: "sedentary" | "light" | "moderate" | "active" | "very-active";
  climate: "cold" | "temperate" | "hot" | "humid";
  daily_goal: number;
  wake_time: string;
  reminder_interval: number;
  failed_login_attempts: number;
  lock_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HydrationEntry {
  id: string;
  user_id: string;
  logged_at: string;
  date: string;
  amount: number;
  brand_slug: string | null;
  activity: string | null;
  note: string;
  created_at: string;
}
