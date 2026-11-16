import { describe, expect, it } from "vitest";
import { birthMonthToRemember, checkAnswers, displayAnswer, isAtLeast, playerIdFromAnswers, prefillFromProfile, eventQuestionsSchema, parseStoredQuestions, type EventQuestion } from "@lib/event-questions";
import { attendeesCsv } from "@components/admin/attendee-list";

const q = (id: string, extra: Partial<EventQuestion> = {}): EventQuestion => ({ id, label: id, help: "", type: "text", required: false, autofill: "none", options: [], ...extra });

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

describe("month and file answers", () => {
  const EVENT = "11111111-1111-4111-8111-111111111111";
  const PLAYER = "22222222-2222-4222-8222-222222222222";
  const dobQuestion = q("dob", { type: "month", required: true });
  const deckQuestion = q("deck", { type: "file" });
  const questions = [dobQuestion, deckQuestion];
  const path = `${EVENT}/${PLAYER}/deck-a1b2c3d4e5f6.pdf`;

  it("accepts a month and year, and a file in the player's own folder", () => {
    const { answers, errors } = checkAnswers(questions, { dob: "2011-03", deck: path }, `${EVENT}/${PLAYER}/`);
    expect(errors).toEqual({});
    expect(answers).toEqual({ dob: "2011-03", deck: path });
  });

  it("rejects a half-picked month", () => {
    for (const dob of ["2011-", "-03", "2011-13", "March 2011"]) expect(checkAnswers(questions, { dob }).errors.dob, dob).toBeDefined();
  });

  it("rejects a file path that isn't this player's upload for this event", () => {
    const other = `${EVENT}/33333333-3333-4333-8333-333333333333/deck-a1b2c3d4e5f6.pdf`;
    expect(checkAnswers(questions, { dob: "2011-03", deck: other }, `${EVENT}/${PLAYER}/`).errors.deck).toBeDefined();
    for (const deck of ["../../resumes/x.pdf", "https://evil.example/x.pdf", `${EVENT}/${PLAYER}/../x.pdf`]) {
      expect(checkAnswers(questions, { dob: "2011-03", deck }, `${EVENT}/${PLAYER}/`).errors.deck, deck).toBeDefined();
    }
  });

  it("shows staff a readable month and never a storage path", () => {
    expect(displayAnswer(dobQuestion, "2011-03")).toBe("Mar 2011");
    expect(displayAnswer(deckQuestion, path)).toBe("File uploaded");
    expect(displayAnswer(deckQuestion, undefined)).toBe("");
  });
});

describe("Player ID kept on the profile", () => {
  const questions = [q("pid", { type: "number", autofill: "playerId" }), q("other", { type: "number" })];

  it("fills in only the question marked as the Player ID", () => {
    expect(prefillFromProfile(questions, { playerId: "1234567" })).toEqual({ pid: "1234567" });
    expect(prefillFromProfile(questions, { playerId: null })).toEqual({});
  });

  it("reads the ID back from the answers, ignoring anything that isn't an ID", () => {
    expect(playerIdFromAnswers(questions, { pid: "1234567", other: "99" })).toBe("1234567");
    expect(playerIdFromAnswers(questions, { other: "99" })).toBeNull();
    expect(playerIdFromAnswers(questions, { pid: "12.5" })).toBeNull();
    expect(playerIdFromAnswers(questions, { pid: "-4" })).toBeNull();
  });

  it("questions saved before this existed still load, with no autofill", () => {
    expect(parseStoredQuestions([{ id: "old", label: "Player ID", help: "", type: "number", required: true, options: [] }])[0]?.autofill).toBe("none");
  });
});

describe("birth dates are remembered for adults only", () => {
  const questions = [q("dob", { type: "month", autofill: "birthMonth" })];
  const now = new Date("2026-11-16T12:00:00Z");

  it("keeps an adult's birth month", () => {
    expect(birthMonthToRemember(questions, { dob: "1994-06" }, now)).toBe("1994-06");
  });

  it("never keeps a minor's", () => {
    for (const dob of ["2012-05", "2015-01", "2009-01", "2026-10"]) expect(birthMonthToRemember(questions, { dob }, now), dob).toBeNull();
  });

  it("waits until someone has certainly turned 18", () => {
    // Born November 2008: they turn 18 some day this month, which we can't know, so not yet.
    expect(isAtLeast("2008-11", 18, now)).toBe(false);
    expect(isAtLeast("2008-12", 18, now)).toBe(false);
    expect(isAtLeast("2008-10", 18, now)).toBe(true);
    expect(isAtLeast("not-a-date", 18, now)).toBe(false);
  });

  it("only fills in the question marked as the date of birth", () => {
    const mixed = [q("dob", { type: "month", autofill: "birthMonth" }), q("other", { type: "month" })];
    expect(prefillFromProfile(mixed, { playerId: null, birthMonth: "1994-06" })).toEqual({ dob: "1994-06" });
    expect(birthMonthToRemember([q("other", { type: "month" })], { other: "1994-06" }, now)).toBeNull();
  });
});
