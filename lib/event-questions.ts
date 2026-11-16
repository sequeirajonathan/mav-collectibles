import { z } from "zod";

/** Kinds of question staff can ask players when they RSVP. */
export const QUESTION_TYPES = ["text", "long", "number", "date", "month", "choice", "yesno", "file"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Short answer",
  long: "Long answer",
  number: "Number",
  date: "Date",
  month: "Month and year",
  choice: "Pick one",
  yesno: "Yes / No",
  file: "File upload (PDF or photo)",
};

/** Files players can attach to an answer. */
export const UPLOAD_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};
export const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const UPLOAD_BUCKET = "event-uploads";

/** Where one player's file for one question lives: `<event>/<player>/<question>-<random>.<ext>`. */
const UPLOAD_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[a-z0-9_]{1,24}-[a-z0-9]{6,16}\.(pdf|jpg|png|webp|heic|heif)$/;

export const MAX_QUESTIONS = 12;
const MAX_ANSWER = 2000;

export const eventQuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]{1,24}$/),
    label: z.string().trim().min(1, "Write the question").max(120),
    help: z.string().trim().max(200).default(""),
    type: z.enum(QUESTION_TYPES),
    required: z.boolean().default(false),
    /** Filled in from the player's profile, and saved back to it, so they type it once. */
    autofill: z.enum(["none", "playerId"]).default("none"),
    /** Choices for "Pick one" questions. */
    options: z.array(z.string().trim().min(1).max(60)).max(12).default([]),
  })
  .refine((q) => q.type !== "choice" || q.options.length >= 2, { path: ["options"], message: "Add at least two choices" });
export type EventQuestion = z.infer<typeof eventQuestionSchema>;

export const eventQuestionsSchema = z
  .array(eventQuestionSchema)
  .max(MAX_QUESTIONS, `Up to ${MAX_QUESTIONS} questions`)
  .refine((list) => new Set(list.map((q) => q.id)).size === list.length, "Two questions share an id");

/** Answers keyed by question id. Everything is kept as text. */
export const answersSchema = z.record(z.string().max(24), z.string().max(MAX_ANSWER));
export type Answers = z.infer<typeof answersSchema>;

/** Questions stored on an event; anything malformed is dropped rather than breaking the page. */
export function parseStoredQuestions(value: unknown): EventQuestion[] {
  const parsed = eventQuestionsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseStoredAnswers(value: unknown): Answers {
  const parsed = answersSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Checks a player's answers against an event's questions. Returns the cleaned
 * answers (only this event's questions, trimmed) and any problems by question id.
 */
export function checkAnswers(
  questions: readonly EventQuestion[],
  given: Answers,
  /** On the server: the folder this player's files for this event must be in (`<event>/<player>/`). */
  uploadFolder?: string
): { answers: Answers; errors: Record<string, string> } {
  const answers: Answers = {};
  const errors: Record<string, string> = {};
  for (const q of questions) {
    const value = (given[q.id] ?? "").trim();
    if (!value) {
      if (q.required) errors[q.id] = "Please answer this";
      continue;
    }
    if (q.type === "number" && !Number.isFinite(Number(value))) errors[q.id] = "Enter a number";
    else if (q.type === "date" && (!ISO_DATE.test(value) || Number.isNaN(Date.parse(value)))) errors[q.id] = "Pick a date";
    else if (q.type === "month" && !ISO_MONTH.test(value)) errors[q.id] = "Pick a month and year";
    else if (q.type === "file" && (!UPLOAD_PATH.test(value) || (uploadFolder !== undefined && !value.startsWith(uploadFolder)))) errors[q.id] = "Upload the file again";
    else if (q.type === "choice" && !q.options.includes(value)) errors[q.id] = "Pick one of the choices";
    else if (q.type === "yesno" && value !== "Yes" && value !== "No") errors[q.id] = "Choose Yes or No";
    else answers[q.id] = value;
  }
  return { answers, errors };
}

/** Ready-made question sets staff can add with one tap. */
/** A ready-made question, before it gets an id. */
export type PresetQuestion = Omit<EventQuestion, "id" | "autofill"> & { autofill?: EventQuestion["autofill"] };

export const QUESTION_PRESETS: { label: string; questions: PresetQuestion[] }[] = [
  {
    // Mirrors the Google Form the shop used for its Cups.
    label: "Pokémon tournament",
    questions: [
      { label: "Player ID", help: "Your Play! Pokémon ID number", type: "number", required: true, autofill: "playerId", options: [] },
      { label: "Date of birth (month and year)", help: "Used to place you in the Junior, Senior or Masters division", type: "month", required: true, options: [] },
      { label: "Deck list (copy and paste)", help: "Paste from RK9 or TCG Live. Make sure each Pokémon matches its set and set number.", type: "long", required: false, options: [] },
      { label: "Deck list (image or PDF)", help: "Or upload a photo or PDF instead. Up to 10 MB.", type: "file", required: false, options: [] },
    ],
  },
  {
    label: "Player name",
    questions: [{ label: "Player name", help: "As it appears on your Pokémon Trainer Club account", type: "text", required: true, options: [] }],
  },
  {
    label: "Parent or guardian",
    questions: [
      { label: "Parent or guardian name", help: "For players under 18", type: "text", required: false, options: [] },
      { label: "Parent or guardian phone", help: "", type: "text", required: false, options: [] },
    ],
  },
];

export const newQuestionId = () => `q_${Math.random().toString(36).slice(2, 10)}`;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** An answer as staff read it: "Mar 2011" for a month, "File uploaded" for a file. */
export function displayAnswer(question: EventQuestion, value: string | undefined): string {
  if (!value) return "";
  if (question.type === "month" && ISO_MONTH.test(value)) return `${MONTHS[Number(value.slice(5)) - 1]} ${value.slice(0, 4)}`;
  if (question.type === "file") return "File uploaded";
  return value;
}

/** A Play! Pokémon ID as stored on a profile: digits only. */
export const PLAYER_ID = /^[0-9]{1,12}$/;

/** Answers to start the form with: what the player's profile already knows. */
export function prefillFromProfile(questions: readonly EventQuestion[], profile: { playerId: string | null }): Answers {
  const answers: Answers = {};
  for (const q of questions) {
    if (q.autofill === "playerId" && profile.playerId) answers[q.id] = profile.playerId;
  }
  return answers;
}

/** The Player ID a player gave in their answers, if the event asked for one and it looks like an ID. */
export function playerIdFromAnswers(questions: readonly EventQuestion[], answers: Answers): string | null {
  for (const q of questions) {
    const value = q.autofill === "playerId" ? answers[q.id] : undefined;
    if (value && PLAYER_ID.test(value)) return value;
  }
  return null;
}
