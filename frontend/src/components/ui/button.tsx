import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // PRIMARY - Deep Purple (High contrast, WCAG AAA)
        default:
          "bg-primary-purple text-white hover:bg-primary-purple-dark active:bg-primary-purple-dark shadow-md hover:shadow-lg",
        
        // SECONDARY - Light beige background with dark text
        secondary:
          "bg-bg-secondary text-text-primary border border-border-light hover:bg-bg-soft hover:border-primary-purple",
        
        // OUTLINE - Purple border with dark text
        outline:
          "border border-primary-purple text-primary-purple hover:bg-bg-secondary active:bg-primary-purple active:text-white",
        
        // GHOST - Minimal, text only
        ghost:
          "text-primary-purple hover:bg-bg-secondary active:bg-bg-soft",
        
        // DESTRUCTIVE - Error state
        destructive:
          "bg-error text-white hover:bg-red-700 active:bg-red-800",
        
        // LINK - Text link style
        link:
          "text-primary-purple underline-offset-4 hover:underline active:text-primary-purple-dark",
        
        // ACCENT - Gold for CTAs
        accent:
          "bg-accent-gold text-white hover:bg-accent-deep-gold active:bg-accent-deep-gold shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }