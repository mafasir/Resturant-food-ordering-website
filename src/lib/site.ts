export const SITE = {
  name: "FeastCraft",
  tagline: "Fire, fresh & fast",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  phone: "+1 (415) 555-0142",
  email: "hello@feastcraft.test",
  address: {
    line1: "218 Folsom Street",
    city: "San Francisco",
    state: "CA",
    postalCode: "94105",
  },
  hours: [
    { days: "Monday – Thursday", time: "11:00 – 22:30" },
    { days: "Friday – Saturday", time: "11:00 – 00:00" },
    { days: "Sunday", time: "12:00 – 22:00" },
  ],
} as const;

export const FREE_DELIVERY_THRESHOLD_LABEL = "$35";
