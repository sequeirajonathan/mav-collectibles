import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-bold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
  {
    variants: {
      variant: {
        default:
          "bg-brand-blue text-white shadow-md hover:bg-brand-blue-light focus-visible:ring-brand-blue/50",
        
        primary:
          "bg-gradient-to-br from-brand-blue to-brand-blue-dark text-white shadow-md hover:from-brand-blue-light hover:to-brand-blue focus-visible:ring-brand-blue/50",
        
        gold:
          "bg-[#E6B325] text-[#000000] shadow-md hover:bg-[#FFD966] border border-[#B38A00] focus-visible:ring-[#E6B325]/50 font-extrabold tracking-wide uppercase",
        
        destructive:
          "bg-red-600 text-white shadow-md hover:bg-red-700 focus-visible:ring-red-500/50",
        
        outline:
          "border-2 border-brand-blue bg-black/30 text-white shadow-sm hover:bg-brand-blue/10 hover:text-brand-blue-light focus-visible:ring-brand-blue/50",
        
        outlineGold:
          "border-2 border-[#E6B325] bg-black/30 text-[#E6B325] shadow-sm hover:bg-[#E6B325]/10 hover:text-[#FFD966] focus-visible:ring-[#E6B325]/50",
        
        secondary:
          "bg-gray-800 text-white shadow-md hover:bg-gray-700 focus-visible:ring-gray-500/50",
        
        ghost:
          "hover:bg-brand-blue/10 hover:text-brand-blue-light focus-visible:ring-brand-blue/50",
        
        link: 
          "text-brand-blue underline-offset-4 hover:text-brand-blue-light hover:underline focus-visible:ring-brand-blue/50",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 rounded-md px-3 py-1.5 text-xs",
        lg: "h-12 rounded-md px-6 py-3 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
