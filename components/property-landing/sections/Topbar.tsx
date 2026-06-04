interface Props {
  title: string;
  hasFaqs?: boolean;
  showLocation?: boolean;
  showReviews?: boolean;
  hasAmenities?: boolean;
  hasReviews?: boolean;
}

/** Sticky navigation bar with property name and anchor links. */
export function Topbar({ title, hasFaqs, showLocation, showReviews, hasAmenities, hasReviews }: Props) {
  return (
    <div className="lp-topbar">
      <div className="lp-wrap">
        <div className="lp-brand">{title}</div>
        <nav className="lp-nav">
          <a href="#about">La casa</a>
          {hasAmenities && <a href="#about">Servicios</a>}
          {showLocation && <a href="#location">Ubicación</a>}
          {showReviews && hasReviews && <a href="#reviews">Reseñas</a>}
          {hasFaqs && <a href="#faq">FAQ</a>}
        </nav>
      </div>
    </div>
  );
}
