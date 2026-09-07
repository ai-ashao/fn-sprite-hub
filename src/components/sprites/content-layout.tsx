import type { ReactNode } from 'react'

export function SpriteContentLayout({
  eyebrow,
  title,
  description,
  children,
}: Readonly<{
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}>) {
  return (
    <div className="sprite-content-page">
      <header className="sprite-container sprite-page-hero">
        <p className="sprite-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </header>
      <main className="sprite-container sprite-prose">{children}</main>
    </div>
  )
}
