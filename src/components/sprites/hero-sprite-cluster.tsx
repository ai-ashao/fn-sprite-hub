const heroSprites = [
  { src: '/images/sprites/bush.webp', alt: 'Bush Sprite', className: 'left' },
  { src: '/images/sprites/sonic.webp', alt: 'Sonic Sprite', className: 'primary' },
  { src: '/images/sprites/klombo.webp', alt: 'Klombo Sprite', className: 'right' },
] as const

export function HeroSpriteCluster() {
  return (
    <figure
      aria-label="Current season Sprite artwork"
      className="sprite-hero-visual"
      data-sprite-hero
    >
      <div className="sprite-aura" aria-hidden="true" />
      <div className="sprite-leaf sprite-leaf-left" aria-hidden="true" />
      <div className="sprite-leaf sprite-leaf-right" aria-hidden="true" />
      <span className="sprite-spark sprite-spark-one" aria-hidden="true">
        ✦
      </span>
      <span className="sprite-spark sprite-spark-two" aria-hidden="true">
        ✧
      </span>
      <div className="sprite-hero-cluster">
        {heroSprites.map((sprite) => (
          <img
            alt={sprite.alt}
            className={`sprite-hero-image ${sprite.className}`}
            height={256}
            key={sprite.src}
            loading={sprite.className === 'primary' ? 'eager' : 'lazy'}
            src={sprite.src}
            width={256}
          />
        ))}
      </div>
    </figure>
  )
}
