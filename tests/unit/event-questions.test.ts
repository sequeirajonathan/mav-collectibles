import { describe, expect, it } from "vitest";
import { checkAnswers, eventQuestionsSchema, parseStoredQuestions, type EventQuestion } from "@lib/event-questions";
import { attendeesCsv } from "@components/admin/attendee-list";

const q = (id: string, extra: Partial<EventQuestion> = {}): EventQuestion => ({ id, label: id, help: "", type: "text", required: false, options: [], ...extra });

describe("checking a player's answers", () => {
  const questions = [
    q("name", { required: true }),
    q("pid", { type: "number" }),
    q("dob", { type: "date", required: true }),
    q("division", { type: "choice", options: ["Junior", "Senior", "Masters"] }),
    q("judge", { type: "yesno" }),
  ];

  it("accepts good answers, trims them and drops anything the event didn't ask", () => {
    const { answers, errors } = checkAnswers(questions, { name: "  Ash  ", pid: "1234567", dob: "2012-05-22", division: "Junior", judge: "No", other: "x" });
    expect(errors).toEqual({});
    expect(answers).toEqual({ name: "Ash", pid: "1234567", dob: "2012-05-22", division: "Junior", judge: "No" });
  });

  it("requires only the required questions", () => {
    const { answers, errors } = checkAnswers(questions, { pid: "", division: "" });
    expect(Object.keys(errors).sort()).toEqual(["dob", "name"]);
    expect(answers).toEqual({});
  });

  it("rejects answers of the wrong kind", () => {
    const { errors } = checkAnswers(questions, { name: "Ash", pid: "abc", dob: "22/05/2012", division: "Grandmaster", judge: "maybe" });
    expect(Object.keys(errors).sort()).toEqual(["division", "dob", "judge", "pid"]);
  });
});

describe("questions staff set up", () => {
  it("needs at least two choices for a pick-one question", () => {
    expect(eventQuestionsSchema.safeParse([q("a", { type: "choice", options: ["Only one"] })]).success).toBe(false);
    expect(eventQuestionsSchema.safeParse([q("a", { type: "choice", options: ["One", "Two"] })]).success).toBe(true);
  });

  it("rejects a blank question and duplicate ids", () => {
    expect(eventQuestionsSchema.safeParse([q("a", { label: "  " })]).success).toBe(false);
    expect(eventQuestionsSchema.safeParse([q("a"), q("a")]).success).toBe(false);
  });

  it("treats damaged stored questions as none, so the event page still loads", () => {
    expect(parseStoredQuestions("nonsense")).toEqual([]);
    expect(parseStoredQuestions([{ id: "bad id!", label: "x", type: "text" }])).toEqual([]);
  });
});

describe("attendee spreadsheet", () => {
  it("has a column per question and can't smuggle in a formula", () => {
    const csv = attendeesCsv(
      [{ userId: "11111111-1111-4111-8111-111111111111", displayName: 'Ash "AK" Ketchum', email: "ash@example.com", status: "registered", registeredAt: "2026-11-20T18:00:00.000Z", checkedInAt: null, answers: { pid: "=HYPERLINK(1)" } }],
      [q("pid", { label: "Player ID" }), q("dob", { label: "Date of birth" })]
    );
    const [header, row] = csv.split("\r\n");
    expect(header).toBe('"Name","Email","Status","Registered","Player ID","Date of birth"');
    expect(row).toBe('"Ash ""AK"" Ketchum","ash@example.com","Registered","2026-11-20","\'=HYPERLINK(1)",""');
  });
});
