import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct } from "@lib/data/catalog";
import { ProductPurchase } from "@components/shop/add-to-cart";
import { cardVariants } from "@components/ui/card";
import { cn } from "@utils";
import { Skeleton } from "@components/ui/skeleton";

type Params = Promise<{ id: string }>;

async function load(params: Params) {
  const { id } = await params;
  return /^[A-Z0-9_]{6,64}$/i.test(id) ? getProduct(id).catch(() => null) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await load(params);
  return product
    ? { title: product.name, description: product.description.slice(0, 160), openGraph: product.imageUrls[0] ? { images: [product.imageUrls[0]] } : undefined }
    : { title: "Product not found" };
}

async function ProductContent({ params }: { params: Params }) {
  const product = await load(params);
  if (!product) notFound();
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      <div>
        <div className={cn(cardVariants(), "relative aspect-square overflow-hidden")}>
          {product.imageUrls[0] ? (
            <Image src={product.imageUrls[0]} alt={product.name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-4" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">No image</span>
          )}
        </div>
        {product.imageUrls.length > 1 && (
          <ul className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
            {product.imageUrls.slice(1, 8).map((url) => (
              <li key={url} className={cn(cardVariants({ radius: "lg" }), "relative size-20 shrink-0 overflow-hidden")}>
                <Image src={url} alt="" fill sizes="80px" className="object-contain p-1" />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        {product.categoryName && <p className="text-xs font-semibold uppercase tracking-wider text-gold">{product.categoryName}</p>}
        <h1 className="mt-1 text-2xl font-extrabold leading-tight fold:text-3xl">{product.name}</h1>
        <div className="mt-4">
          <ProductPurchase product={product} />
        </div>
        {product.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/85">{product.description}</p>}
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <>
      <nav className="mb-4 text-sm">
        <Link href="/shop" className="text-muted-foreground hover:text-gold">← Shop</Link>
      </nav>
      <Suspense fallback={<div className="grid gap-6 md:grid-cols-2"><Skeleton className="aspect-square" /><Skeleton className="h-64" /></div>}>
        <ProductContent params={params} />
      </Suspense>
    </>
  );
}
