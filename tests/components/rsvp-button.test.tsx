import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RsvpButton } from "@components/hub/rsvp-button";

type ActionMock = (input: { eventId: string }) => Promise<unknown>;
const registerForEvent = vi.fn<ActionMock>();
const cancelRegistration = vi.fn<ActionMock>();
const refresh = vi.fn<() => void>();

vi.mock("@lib/actions/hub", () => ({
  registerForEvent: (input: { eventId: string }) => registerForEvent(input),
  cancelRegistration: (input: { eventId: string }) => cancelRegistration(input),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const props = { eventId: "e1", slug: "league", status: null, signedIn: true, closedReason: null, full: false };

beforeEach(() => {
  registerForEvent.mockReset();
  cancelRegistration.mockReset();
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
    expect(registerForEvent).toHaveBeenCalledWith({ eventId: "e1" });
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
});
