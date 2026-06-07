import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { baseColumns } from "./common";

export const practices = pgTable("practices", {
  ...baseColumns(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  timezone: varchar("timezone", { length: 64 }).notNull().default("Africa/Algiers"),
  logoUrl: varchar("logo_url", { length: 512 }),
  settings: jsonb("settings").default({ locale: "fr", currency: "DZD", country: "Algeria" }),
  subscriptionTier: varchar("subscription_tier", { length: 32 }).default("free"),
});

export const locations = pgTable("locations", {
  ...baseColumns(),
  practiceId: uuid("practice_id")
    .notNull()
    .references(() => practices.id),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 32 }),
  wilaya: varchar("wilaya", { length: 128 }),
  commune: varchar("commune", { length: 128 }),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export const practicesRelations = relations(practices, ({ many }) => ({
  locations: many(locations),
}));

export const locationsRelations = relations(locations, ({ one }) => ({
  practice: one(practices, {
    fields: [locations.practiceId],
    references: [practices.id],
  }),
}));
