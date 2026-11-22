import "dotenv/config";

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { LanguageModel } from "../models/language.model.js";
import { seedLanguages } from "../data/seed.js";

async function seedDatabase() {
  try {
    await connectDB();

    for (const language of seedLanguages) {
      await LanguageModel.findOneAndUpdate(
        { id: language.id },
        {
          $set: {
            name: language.name,
            topics: language.topics,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        },
      );

      console.log(`Seeded: ${language.name}`);
    }

    console.log("All languages seeded successfully");
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void seedDatabase();