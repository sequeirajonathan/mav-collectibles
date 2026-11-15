import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct } from "@lib/data/catalog";
import { ProductPurchase } from "@components/shop/add-to-cart";
import { ProductGallery } from "@components/shop/product-gallery";
import { Eyebrow } from "@components/ui/page-header";
import { tidyProductName } from "@lib/catalog/display";
import { Skeleton } from "@components/ui/skeleton";

type Params = Promise<{ id: string }>;

async function load(params: Params) {
  const { id } = await params;
  return /^[A-Z0-9_]{6,64}$/i.test(id) ? getProduct(id).catch(() => null) : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const product = await load(params);
  return product
    ? { title: tidyProductName(product.name), description: product.description.slice(0, 160), openGraph: product.imageUrls[0] ? { images: [product.imageUrls[0]] } : undefined }
    : { title: "Product not found" };
}

async function ProductContent({ params }: { params: Params }) {
  const product = await load(params);
  if (!product) notFound();
  const name = tidyProductName(product.name);
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-10">
      <ProductGallery images={product.imageUrls} name={name} />
      <div>
        {product.categoryName && <Eyebrow>{tidyProductName(product.categoryName)}</Eyebrow>}
        <h1 className="mt-1 text-2xl font-extrabold leading-tight fold:text-3xl">{name}</h1>
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
