/** Roles the shop is hiring for, shown on /jobs. Edit this list as openings change. */
export const JOB_OPENINGS = [
  {
    id: "tcgplayer-specialist",
    title: "TCGplayer Specialist",
    summary: "Someone passionate about trading card games who takes pride in accuracy and organization on our TCGplayer platform.",
    lookingFor: [
      "TCG knowledge",
      "Detail-oriented with strong organizational skills",
      "Comfortable with computers and online inventory systems",
      "Reliable, punctual and able to work independently",
      "Strong communication and teamwork skills",
      "Customer-service driven",
    ],
  },
] as const;

/** For people who want to work at the shop but don't fit a listed opening. */
const GENERAL_APPLICATION = "General application";

export const JOB_POSITIONS: readonly string[] = [...JOB_OPENINGS.map((o) => o.title), GENERAL_APPLICATION];

export const RESUME_MAX_BYTES = 4 * 1024 * 1024;
export const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
