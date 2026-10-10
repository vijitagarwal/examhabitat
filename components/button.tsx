import Link from "next/link"
import type { ButtonHTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { href?: string; children: ReactNode; variant?: "primary" | "secondary" | "ghost" }
export function Button({ href, children, className, variant = "primary", ...props }: Props) {
  const classes = cn("inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors", variant === "primary" && "bg-accent text-white hover:bg-accent-strong", variant === "secondary" && "border border-line bg-surface text-foreground hover:bg-surface-muted", variant === "ghost" && "text-muted hover:bg-surface-muted hover:text-foreground", className)
  if (!href) return <button className={classes} {...props}>{children}</button>
  if (href.startsWith("#")) return <a href={href} className={classes}>{children}</a>
  return <Link href={href} className={classes}>{children}</Link>
}
