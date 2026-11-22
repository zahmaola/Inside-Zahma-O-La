import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/10 text-zinc-200",
        success: "border-emerald-500/20 bg-emerald-500/15 text-emerald-300",
        warning: "border-amber-500/20 bg-amber-500/15 text-amber-300",
        danger: "border-red-500/20 bg-red-500/15 text-red-300",
        info: "border-sky-500/20 bg-sky-500/15 text-sky-300",
        muted: "border-white/5 bg-white/5 text-zinc-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
