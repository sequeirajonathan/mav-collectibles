"use client";

import { useState, useEffect, useRef } from "react";
import { useInfiniteCatalogItems } from "@hooks/useSquareServices";
import { ProductFilters } from "@components/ui/ProductFilters";
import { ProductCard } from "@components/ui/ProductCard";
import { SkeletonProductCard } from "@components/ui/SkeletonProductCard";
import { SortOption, StockOption } from "@interfaces/square";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useSearchParams } from "next/navigation";

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId");
  const groupParam = searchParams.get("group") || "TCG";
  const stockParam = searchParams.get("stock") as StockOption || "IN_STOCK";
  const sortParam = searchParams.get("sort") as SortOption || "name_asc";
  
  const [selectedGroup, setSelectedGroup] = useState(groupParam);
  const [stockStatus, setStockStatus] = useState<StockOption>(stockParam);
  const [sortBy, setSortBy] = useState<SortOption>(sortParam);

  // Update state when URL parameters change
  useEffect(() => {
    setSelectedGroup(groupParam);
    setStockStatus(stockParam);
    setSortBy(sortParam);
  }, [groupParam, stockParam, sortParam]);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: "600px",
  });

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteCatalogItems(selectedGroup, searchQuery, categoryId);

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const available = allItems.filter(
    (item) => item.ecomVisibility === "VISIBLE" && item.ecomAvailable === true
  );
  const filtered = available.filter((item) => {
    if (stockStatus === "all") return true;
    return item.soldOut === (stockStatus === "SOLD_OUT");
  });
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "price_asc":
        return a.priceAmount - b.priceAmount;
      case "price_desc":
        return b.priceAmount - a.priceAmount;
      case "name_asc":
        return a.name.localeCompare(b.name);
      case "name_desc":
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const seen = new Set();
  const deduped = sorted.filter((item) => {
    if (seen.has(item.variationId)) return false;
    seen.add(item.variationId);
    return true;
  });

  const GRID_COLS = 4;
  const MIN_INITIAL_ITEMS = GRID_COLS * 2; // Ensure at least 2 complete rows

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
  }, [selectedGroup, stockStatus, sortBy]);

  useEffect(() => {
    if (
      !isLoading &&
      !isFetchingNextPage &&
      hasNextPage &&
      deduped.length < MIN_INITIAL_ITEMS
    ) {
      fetchNextPage();
    }
  }, [isLoading, isFetchingNextPage, hasNextPage, deduped.length, fetchNextPage, MIN_INITIAL_ITEMS]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const renderSkeletonGrid = () => {
    const remainder = deduped.length % GRID_COLS;
    const skeletonFill = deduped.length === 0
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
    <div className="container mx-auto px-4 py-8">
      <ProductFilters
        stockStatus={stockStatus}
        setStockStatus={setStockStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
      />

      <motion.div
        className="grid gap-6 mt-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layout
      >
        <AnimatePresence mode="popLayout">
          {deduped.map((item) => (
            <motion.div
              key={`${item.variationId}-${item.updatedAt}`}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: -20 }}
              layout="position"
              layoutId={`${item.variationId}-${item.updatedAt}`}
            >
              <ProductCard
                product={item}
                imageConfig={{ width: 280, height: 280, quality: 90 }}
              />
            </motion.div>
          ))}
          {(() => {
            const remainder = deduped.length % GRID_COLS;
            const placeholders = remainder === 0 ? 0 : GRID_COLS - remainder;
            return Array.from({ length: placeholders }).map((_, idx) => (
              <div key={`placeholder-${idx}`} className="invisible" />
            ));
          })()}

          {isFetchingNextPage &&
            (() => {
              const previousItems =
                data?.pages.slice(0, -1).flatMap((p) => p.items).filter(
                  (item) =>
                    item.ecomVisibility === "VISIBLE" &&
                    item.ecomAvailable === true &&
                    (stockStatus === "all" || item.soldOut === (stockStatus === "SOLD_OUT"))
                ) ?? [];

              const prevDeduped = Array.from(
                new Map(previousItems.map((item) => [item.variationId, item])).values()
              );

              const remainder = prevDeduped.length % GRID_COLS;
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

      {!hasNextPage && !isLoading && (
        <motion.div
          className="flex flex-col items-center justify-center py-8 text-gray-300"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1.2, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="mb-4"
          >
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="32" fill="#FFD966"/>
              <path d="M20 32L28 40L44 24" stroke="#222" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold"
          >
            You&apos;ve reached the end! 🎉
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.5 }}
            className="text-sm mt-2 text-gray-400"
          >
            No more products to show. Check back soon for new arrivals!
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
