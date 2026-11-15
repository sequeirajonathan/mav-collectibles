import { z } from "zod";

/** Kinds of question staff can ask players when they RSVP. */
export const QUESTION_TYPES = ["text", "long", "number", "date", "choice", "yesno"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: "Short answer",
  long: "Long answer",
  number: "Number",
  date: "Date",
  choice: "Pick one",
  yesno: "Yes / No",
};

export const MAX_QUESTIONS = 12;
const MAX_ANSWER = 2000;

export const eventQuestionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9_]{1,24}$/),
    label: z.string().trim().min(1, "Write the question").max(120),
    help: z.string().trim().max(200).default(""),
    type: z.enum(QUESTION_TYPES),
    required: z.boolean().default(false),
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

/**
 * Checks a player's answers against an event's questions. Returns the cleaned
 * answers (only this event's questions, trimmed) and any problems by question id.
 */
export function checkAnswers(questions: readonly EventQuestion[], given: Answers): { answers: Answers; errors: Record<string, string> } {
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
    else if (q.type === "choice" && !q.options.includes(value)) errors[q.id] = "Pick one of the choices";
    else if (q.type === "yesno" && value !== "Yes" && value !== "No") errors[q.id] = "Choose Yes or No";
    else answers[q.id] = value;
  }
  return { answers, errors };
}

/** Ready-made question sets staff can add with one tap. */
export const QUESTION_PRESETS: { label: string; questions: Omit<EventQuestion, "id">[] }[] = [
  {
    label: "Pokémon player info",
    questions: [
      { label: "Player name", help: "As it appears on your Pokémon Trainer Club account", type: "text", required: true, options: [] },
      { label: "Player ID", help: "Your Play! Pokémon ID number. Leave blank if you don't have one yet and we'll set you up at the door.", type: "number", required: false, options: [] },
      { label: "Date of birth", help: "Used to place you in the Junior, Senior or Masters division", type: "date", required: true, options: [] },
    ],
  },
  {
    label: "Deck list",
    questions: [{ label: "Deck list", help: "Paste your 60-card list, or a link to it", type: "long", required: false, options: [] }],
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
