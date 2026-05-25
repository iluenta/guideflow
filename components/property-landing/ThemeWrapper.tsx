import './landing.css';
import type { PropertyLanding } from '@/lib/types/property';

interface Props {
  palette: PropertyLanding['palette'];
  typography: PropertyLanding['typography'];
  borderRadius: PropertyLanding['border_radius'];
  children: React.ReactNode;
  className?: string;
}

/** Applies theme CSS variables and typography/radius variants via data attributes. */
export function ThemeWrapper({ palette, typography, borderRadius, children, className }: Props) {
  return (
    <div
      data-palette={palette}
      data-type={typography}
      data-radius={borderRadius}
      className={`lp-root${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  );
}
