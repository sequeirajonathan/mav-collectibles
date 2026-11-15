import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopModeProvider } from "@components/layout/shop-mode";
import { ShowcaseNotice } from "@components/shop/showcase-notice";
import { ProductCard } from "@components/shop/product-card";
import { CartProvider } from "@contexts/CartContext";
import type { CatalogItem } from "@lib/contracts/catalog";

let role: string | null = null;
vi.mock("@contexts/AuthContext", () => ({ useAuth: () => ({ role }) }));
vi.mock("react-hot-toast", () => ({ toast: { success: vi.fn() } }));

const item: CatalogItem = {
  itemId: "I1",
  variationId: "V1",
  name: "Elite Trainer Box",
  sku: "X",
  priceAmount: 5999,
  priceCurrency: "USD",
  soldOut: false,
  imageUrls: [],
};

function renderShop(live: boolean) {
  return render(
    <CartProvider>
      <ShopModeProvider live={live}>
        <ShowcaseNotice />
        <ProductCard item={item} />
      </ShopModeProvider>
    </CartProvider>
  );
}

describe("shop showcase mode", () => {
  it("hides buying from customers while the shop isn't live", () => {
    role = "USER";
    renderShop(false);
    expect(screen.getByText(/In-store showcase/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add .* to cart/ })).not.toBeInTheDocument();
    expect(screen.getByText("In store")).toBeInTheDocument();
    expect(screen.getByText("$59.99")).toBeInTheDocument();
  });

  it("lets staff preview purchasing with a warning", () => {
    role = "STAFF";
    renderShop(false);
    expect(screen.getByText(/Staff preview/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Elite Trainer Box to cart" })).toBeInTheDocument();
  });

  it("shows the cart to everyone once the shop is live", () => {
    role = null;
    renderShop(true);
    expect(screen.queryByText(/In-store showcase/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Elite Trainer Box to cart" })).toBeInTheDocument();
  });
});
