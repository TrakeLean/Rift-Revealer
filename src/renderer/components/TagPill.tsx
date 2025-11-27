import { cn } from '@/lib/utils'

type TagVariant = 'toxic' | 'notable' | 'positive' | 'info'

interface TagPillProps {
  label: string
  variant: TagVariant
  className?: string
}

const variantClasses: Record<TagVariant, string> = {
  toxic: 'bg-red-950/50 text-red-400 border-red-900',
  notable: 'bg-yellow-950/50 text-yellow-400 border-yellow-900',
  positive: 'bg-emerald-950/50 text-emerald-400 border-emerald-900',
  info: 'bg-blue-950/50 text-blue-400 border-blue-900',
}

export function TagPill({ label, variant, className }: TagPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variantClasses[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
