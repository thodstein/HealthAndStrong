import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for lazy loading Google Gen AI SDK safely
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured in the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ensure server handles JSON payloads properly
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    res.status(400).json({ error: "Invalid JSON payload format." });
  } else {
    next(err);
  }
});

/**
 * API Route: Create customized bodybuilding workout routine
 */
app.post("/api/workout/generate", async (req, res) => {
  try {
    const { equipment, level, goals, days } = req.body;

    if (!equipment || !level || !goals || !days) {
      return res.status(400).json({ error: "Missing required fields: equipment, level, goals, or days is required." });
    }

    const ai = getAiClient();
    const prompt = `Generate a highly professional, optimal bodybuilding and fitness workout program configured for:
- Equipment: ${equipment}
- Fitness Level: ${level}
- Training Goals: ${goals}
- Frequency: ${days} days per week

Create a structured weightlifting split (such as Push-Pull-Legs, Upper-Lower, or Full Body as best suited for a ${days}-day split and ${level} level). Include exact exercises, targeting primary muscle groups, with clean sets, reps, tempos, and precise, action-oriented execution cues (e.g. keeping elbows tucked, squeezing the lat, etc.).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite bodybuilding coach and CSCS (Certified Strength and Conditioning Specialist). Provide highly optimized, biomechanically sound workout routines. Avoid filler or generic descriptions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            programName: {
              type: Type.STRING,
              description: "The name of the tailored workout program.",
            },
            summary: {
              type: Type.STRING,
              description: "A professional coach's overview of why this split and layout was selected.",
            },
            splits: {
              type: Type.ARRAY,
              description: "The scheduled routine days.",
              items: {
                type: Type.OBJECT,
                properties: {
                  dayName: {
                    type: Type.STRING,
                    description: "Day name and workout split title (e.g. 'Day 1: Upper Body Heavy', 'Day 2: Rest')",
                  },
                  focus: {
                    type: Type.STRING,
                    description: "The primary muscle groups targeted in this session (e.g., 'Chest, Shoulders, Triceps')",
                  },
                  isRestDay: {
                    type: Type.BOOLEAN,
                    description: "Whether this day is a designated muscle recovery/rest day.",
                  },
                  exercises: {
                    type: Type.ARRAY,
                    description: "Exercises scheduled for training days. Return empty array for rest days.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Name of the exercise (e.g., 'Incline Barbell Bench Press')." },
                        sets: { type: Type.INTEGER, description: "Total number of working sets." },
                        reps: { type: Type.STRING, description: "Recommended rep range (e.g., '6-8', '8-12', '12-15')." },
                        tempo: { type: Type.STRING, description: "Lifting tempo or cadence (e.g., '3-1-1-0' or 'Slow eccentric, pause')." },
                        cue: { type: Type.STRING, description: "Key coach cue for pristine posture and muscle engagement." },
                        targetMuscle: { type: Type.STRING, description: "The specific primary target muscle (e.g., 'Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core')." }
                      },
                      required: ["name", "sets", "reps", "tempo", "cue", "targetMuscle"]
                    }
                  }
                },
                required: ["dayName", "focus", "isRestDay", "exercises"]
              }
            }
          },
          required: ["programName", "summary", "splits"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Received empty response from the fitness AI model.");
    }

    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Workout generation error:", error);
    return res.status(500).json({ error: error.message || "An unexpected error occurred during workout generation." });
  }
});

/**
 * API Route: Analyze custom meal description to extract nutrients
 */
app.post("/api/meals/analyze", async (req, res) => {
  try {
    const { mealDescription } = req.body;

    if (!mealDescription || typeof mealDescription !== "string") {
      return res.status(400).json({ error: "Please provide a valid text description of your meal." });
    }

    const ai = getAiClient();
    const prompt = `Deconstruct the nutrition profile of this meal description: "${mealDescription}".
Calculate estimated calories, protein (g), carbs (g), and fat (g) based on standard scientific macronutrient indexes. Be highly realistic and accurate with ingredients. Provide a helpful bodybuilding coach breakdown warning and advice.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert sports performance nutritionist. Calculate realistic USDA-aligned nutrient values for the described meal and provide concise muscle-centric nutritional insights.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mealName: { type: Type.STRING, description: "Inferred descriptive title of the meal." },
            calories: { type: Type.INTEGER, description: "Estimated total calories (kcal)." },
            protein: { type: Type.INTEGER, description: "Total protein content in grams." },
            carbs: { type: Type.INTEGER, description: "Total carbohydrate content in grams." },
            fat: { type: Type.INTEGER, description: "Total fat content in grams." },
            breakdown: { type: Type.STRING, description: "A one or two sentence fitness/muscle-building review of the meal to guide the lifter." }
          },
          required: ["mealName", "calories", "protein", "carbs", "fat", "breakdown"]
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error("Received empty response from the nutrition AI model.");
    }

    const data = JSON.parse(textOutput.trim());
    return res.json(data);
  } catch (error: any) {
    console.error("Meal analysis error:", error);
    return res.status(500).json({ error: error.message || "An unexpected error occurred during nutrition analysis." });
  }
});

/**
 * API Route: General Interactive Bodybuilding Trainer Custom Questions
 */
app.post("/api/trainer/chat", async (req, res) => {
  try {
    const { messages } = req.body; // Array of OpenAI-style messages: { role: 'user'|'model', content: string }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Please provide a valid dialogue messages array." });
    }

    const ai = getAiClient();
    
    // Convert client-side message array to Gemini Chat contents array
    const chatContents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: chatContents,
      config: {
        systemInstruction: "You are an elite personal bodybuilding and wellness trainer 'Coach Iron'. Your goal is to guide users to fulfill their health aspirations through biomechanically optimized weight training techniques, muscle gain progression schemes (progressive overload, mechanical tension), cardiorespiratory wellness, and clean high-protein macro targeting. Be direct, coaching, supportive, scientific, and highly motivating. Use markdown lists and clean formatting where needed."
      }
    });

    const reply = response.text || "I apologize, but my gears slipped. Could you ask Coach Iron again?";
    return res.json({ reply });
  } catch (error: any) {
    console.error("Trainer communication error:", error);
    return res.status(500).json({ error: error.message || "An unexpected error occurred during coach feedback." });
  }
});

/**
 * Serve the UI applications correctly using Vite developer setup & standard bundle routing
 */
async function bootServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development server leveraging Vite Node middleware wrapper
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving compiled index file and built static folder assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BodyBuildHealth] Full-stack backend live and listening on http://localhost:${PORT}`);
  });
}

bootServer();
