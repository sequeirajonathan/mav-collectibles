"use client";

import React, { useEffect } from "react";
import { useQueryState } from "nuqs";
import { useParams } from "next/navigation";
import { ProductFilters } from "@components/ui/ProductFilters";
import { InfiniteCardGrid } from "@components/ui/InfiniteCardGrid";
import {
  CATEGORY_MAPPING,
  COLLECTIBLES_MAPPING,
  SUPPLIES_MAPPING,
  EVENTS_MAPPING,
} from "@const/categories";

const ALL_CATEGORIES = {
  ...CATEGORY_MAPPING,
  ...COLLECTIBLES_MAPPING,
  ...SUPPLIES_MAPPING,
  ...EVENTS_MAPPING,
};

export default function CategoryPage() {
  // read filter & sort query params
  const [stock] = useQueryState("stock");
  const [sort] = useQueryState("sort");
  const [search, setSearch] = useQueryState("q");

  // grab the slug from the URL
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";

  // look up displayName
  const category = ALL_CATEGORIES[slug];

  // whenever we navigate to a new category, clear any free-text search
  useEffect(() => {
    if (search) {
      setSearch(null);
    }
  }, [slug, search, setSearch]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[#E6B325] mb-6">
        {category?.displayName ?? "Category"}
      </h1>

      <ProductFilters />

      <InfiniteCardGrid
        slug={slug}
        search={search || ""}
        stock={stock || "IN_STOCK"}
        sort={sort || "name_asc"}
      />
    </div>
  );
}