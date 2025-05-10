"use client";

import { useEffect, useRef, useMemo } from "react";
import { useInfiniteCatalogItemsBySlug } from "@hooks/useSquareServices";
import { ProductFilters } from "@components/ui/ProductFilters";
import { ProductCard } from "@components/ui/ProductCard";
import { SkeletonProductCard } from "@components/ui/SkeletonProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useQueryState } from "nuqs";
import { useParams, useRouter } from "next/navigation";
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
  const [stock] = useQueryState("stock");
  const [sort] = useQueryState("sort");
  const [search] = useQueryState("search");
  const router = useRouter();
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const category = ALL_CATEGORIES[slug];

  const { ref, inView } = useInView({ threshold: 0.1, rootMargin: "600px" });

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteCatalogItemsBySlug(
    slug,
    search || "",
    stock || "IN_STOCK",
    sort || "name_asc"
  );

  const allItems = useMemo(() => data?.pages.flatMap((p) => p.items) ?? [], [data]);
  const GRID_COLS = 4;
  const MIN_INITIAL_ITEMS = GRID_COLS * 2;

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchNextPage();
      }, 200);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug, stock, sort]);

  useEffect(() => {
    if (
      !isLoading &&
      !isFetchingNextPage &&
      hasNextPage &&
      allItems.length < MIN_INITIAL_ITEMS
    ) {
      fetchNextPage();
    }
  }, [isLoading, isFetchingNextPage, hasNextPage, allItems.length, fetchNextPage, MIN_INITIAL_ITEMS]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const renderSkeletonGrid = () => {
    const remainder = allItems.length % GRID_COLS;
    const skeletonFill =
      allItems.length === 0
        ? MIN_INITIAL_ITEMS
        : remainder === 0
        ? 0
        : GRID_COLS - remainder;

    return (
      <motion.div
        className="grid gap-6 mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[...Array(skeletonFill)].map((_, index) => (
          <motion.div
            key={`skeleton-${index}`}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <SkeletonProductCard />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#E6B325]">
          {category?.displayName ?? "Category"}
        </h1>

        <ProductFilters />

        <motion.div
          className="grid gap-6 mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          layout
        >
          <AnimatePresence mode="popLayout">
            {allItems.map((item, index) => (
              <motion.div
                key={`${item.variationId}-${index}`}
                layoutId={`${item.variationId}-${index}`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
              >
                <ProductCard
                  product={item}
                  imageConfig={{ width: 280, height: 280, quality: 90 }}
                />
              </motion.div>
            ))}
            {(() => {
              const remainder = allItems.length % GRID_COLS;
              const placeholders = remainder === 0 ? 0 : GRID_COLS - remainder;
              return Array.from({ length: placeholders }).map((_, idx) => (
                <div key={`placeholder-${idx}`} className="invisible" />
              ));
            })()}

            {isFetchingNextPage && (() => {
              const previousItems = data?.pages.slice(0, -1).flatMap((p) => p.items) ?? [];
              const remainder = previousItems.length % GRID_COLS;
              const skeletonCount = remainder === 0 ? 0 : GRID_COLS - remainder;

              return [...Array(skeletonCount)].map((_, index) => (
                <motion.div
                  key={`next-page-skeleton-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SkeletonProductCard />
                </motion.div>
              ));
            })()}
          </AnimatePresence>
        </motion.div>

        {isLoading && renderSkeletonGrid()}

        <div ref={ref} className="h-20" />

        {!hasNextPage && !isLoading && allItems.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <div className="text-2xl font-semibold mb-2">No results found</div>
            <button
              className="mt-4 px-6 py-2 rounded bg-[#E6B325] text-black font-semibold hover:bg-[#FFD966] transition"
              onClick={() => router.push("/products")}
            >
              Reset Filters
            </button>
          </div>
        )}

        {!hasNextPage && allItems.length > 0 && (
          <motion.div
            className="text-center text-gray-400 py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-2xl font-semibold mb-2">You have reached the end of the list</div>
          </motion.div>
        )}
      </div>
    </>
  );
}
