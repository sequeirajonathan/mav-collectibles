import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "@components/hub/event-card";
import type { EventSummary } from "@lib/contracts/hub";

const event: EventSummary = {
  id: "6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d",
  slug: "pokemon-league-night",
  title: "Pokémon League Night",
  summary: "",
  kind: "league",
  game: { id: "pokemon", name: "Pokémon TCG", shortName: "Pokémon", color: "#FFCB05" },
  format: "Standard",
  startsAt: "2026-11-21T00:00:00.000Z",
  endsAt: null,
  location: "MAV Collectibles",
  coverImageUrl: null,
  capacity: 32,
  entryFeeCents: 500,
  status: "published",
  featured: true,
  registeredCount: 30,
  waitlistCount: 0,
};

describe("EventCard", () => {
  it("shows what players need at a glance", () => {
    render(<EventCard event={event} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/events/pokemon-league-night");
    expect(screen.getByText("Pokémon")).toBeInTheDocument();
    expect(screen.getByText("League night")).toBeInTheDocument();
    expect(screen.getByText("Fri, Nov 20 · 6:00 PM")).toBeInTheDocument();
    expect(screen.getByText("2 of 32 spots left")).toBeInTheDocument();
    expect(screen.getByText("$5 at the door")).toBeInTheDocument();
  });

  it("marks cancelled events", () => {
    render(<EventCard event={{ ...event, status: "cancelled" }} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});
