import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-brand/10 text-brand',
        success:  'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
        warning:  'bg-amber-50 text-amber-700 border border-amber-200/60',
        danger:   'bg-red-50 text-red-600 border border-red-200/60',
        muted:    'bg-slate-100 text-slate-600',
        navy:     'bg-navy-800/10 text-navy-800',
        outline:  'border border-slate-200 text-slate-600',
        purple:   'bg-violet-50 text-violet-700 border border-violet-200/60',
        sky:      'bg-sky-50 text-sky-700 border border-sky-200/60',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
