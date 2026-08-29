import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:   'bg-brand text-white shadow-sm shadow-brand/30 hover:bg-brand-dark active:scale-[0.98]',
        secondary: 'bg-brand/10 text-brand border border-brand/20 hover:bg-brand/15',
        ghost:     'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        danger:    'bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.98]',
        outline:   'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        navy:      'bg-navy-800 text-white hover:bg-navy-700 shadow-sm',
      },
      size: {
        sm:   'h-8  px-3 text-xs rounded-md',
        md:   'h-9  px-4',
        lg:   'h-10 px-5 text-base',
        icon: 'h-9  w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
