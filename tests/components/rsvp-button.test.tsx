import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RsvpButton } from "@components/hub/rsvp-button";

type ActionMock = (input: { eventId: string; answers?: Record<string, string> }) => Promise<unknown>;
const registerForEvent = vi.fn<ActionMock>();
const cancelRegistration = vi.fn<ActionMock>();
const saveRegistrationAnswers = vi.fn<ActionMock>();
const refresh = vi.fn<() => void>();

vi.mock("@lib/actions/hub", () => ({
  registerForEvent: (input: { eventId: string; answers?: Record<string, string> }) => registerForEvent(input),
  cancelRegistration: (input: { eventId: string }) => cancelRegistration(input),
  saveRegistrationAnswers: (input: { eventId: string; answers?: Record<string, string> }) => saveRegistrationAnswers(input),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const props = { eventId: "e1", slug: "league", status: null, signedIn: true, closedReason: null, full: false };

beforeEach(() => {
  registerForEvent.mockReset();
  cancelRegistration.mockReset();
  saveRegistrationAnswers.mockReset();
  refresh.mockReset();
});

describe("RsvpButton", () => {
  it("asks signed-out visitors to sign in and come back", () => {
    render(<RsvpButton {...props} signedIn={false} />);
    expect(screen.getByRole("link", { name: "Sign in to RSVP" })).toHaveAttribute("href", "/sign-in?next=/events/league");
  });

  it("explains why registration is closed", () => {
    render(<RsvpButton {...props} closedReason="Registration closed" />);
    expect(screen.getByRole("button", { name: "Registration closed" })).toBeDisabled();
  });

  it("offers the waitlist when full", () => {
    render(<RsvpButton {...props} full />);
    expect(screen.getByRole("button", { name: "Join the waitlist" })).toBeEnabled();
  });

  it("registers and refreshes", async () => {
    registerForEvent.mockResolvedValue({ ok: true, data: { status: "registered" } });
    render(<RsvpButton {...props} />);
    await userEvent.click(screen.getByRole("button", { name: "RSVP" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(registerForEvent).toHaveBeenCalledWith({ eventId: "e1", answers: {} });
  });

  it("requires confirmation before cancelling", async () => {
    cancelRegistration.mockResolvedValue({ ok: true, data: null });
    render(<RsvpButton {...props} status="registered" />);
    expect(screen.getByText("You're going")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cancel RSVP" }));
    expect(cancelRegistration).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel" }));
    await waitFor(() => expect(cancelRegistration).toHaveBeenCalledWith({ eventId: "e1" }));
  });

  it("shows waitlist status", () => {
    render(<RsvpButton {...props} status="waitlisted" />);
    expect(screen.getByText("On the waitlist")).toBeInTheDocument();
  });

  const questions = [
    { id: "q_name", label: "Player name", help: "", type: "text" as const, required: true, options: [] },
    { id: "q_pid", label: "Player ID", help: "", type: "number" as const, required: false, options: [] },
  ];

  it("asks the event's questions before saving the RSVP", async () => {
    registerForEvent.mockResolvedValue({ ok: true, data: { status: "registered" } });
    render(<RsvpButton {...props} questions={questions} />);
    await userEvent.click(screen.getByRole("button", { name: "RSVP" }));
    expect(registerForEvent).not.toHaveBeenCalled();

    // A required question left blank stops the RSVP and says so.
    await userEvent.click(screen.getByRole("button", { name: "Confirm RSVP" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please answer this");
    expect(registerForEvent).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole("textbox", { name: "Player name" }), "Ash Ketchum");
    await userEvent.type(screen.getByRole("textbox", { name: "Player ID (optional)" }), "1234567");
    await userEvent.click(screen.getByRole("button", { name: "Confirm RSVP" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(registerForEvent).toHaveBeenCalledWith({ eventId: "e1", answers: { q_name: "Ash Ketchum", q_pid: "1234567" } });
  });

  it("lets a registered player change their answers", async () => {
    saveRegistrationAnswers.mockResolvedValue({ ok: true, data: null });
    render(<RsvpButton {...props} status="registered" questions={questions} answers={{ q_name: "Ash" }} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit my details" }));
    const name = screen.getByRole("textbox", { name: "Player name" });
    expect(name).toHaveValue("Ash");
    await userEvent.type(name, " Ketchum");
    await userEvent.click(screen.getByRole("button", { name: "Save my details" }));
    await waitFor(() => expect(saveRegistrationAnswers).toHaveBeenCalledWith({ eventId: "e1", answers: { q_name: "Ash Ketchum" } }));
  });
});
