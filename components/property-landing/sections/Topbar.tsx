interface Props {
  title: string;
  hasFaqs?: boolean;
}

/** Sticky navigation bar with property name and internal anchor links. */
export function Topbar({ title, hasFaqs }: Props) {
  return (
    <div className="lp-topbar">
      <div className="lp-wrap">
        <div className="lp-brand">{title}</div>
        <nav className="lp-nav">
          <a href="#about">La casa</a>
          <a href="#location">Ubicación</a>
          {hasFaqs && <a href="#faq">FAQ</a>}
        </nav>
      </div>
    </div>
  );
}
