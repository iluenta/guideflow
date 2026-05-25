interface Props {
  email: string;
  phone?: string;
}

/** Contact section with email and optional phone. */
export function Contact({ email, phone }: Props) {
  return (
    <div className="lp-section">
      <h2 className="lp-section-title">Contacto</h2>
      <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 8 }}>
        ¿Tienes preguntas? Contáctanos directamente.
      </p>
      <p style={{ fontSize: 14 }}>
        📧{' '}
        <a href={`mailto:${email}`} style={{ color: 'var(--brand)' }}>{email}</a>
      </p>
      {phone && (
        <p style={{ fontSize: 14, marginTop: 6 }}>
          📞{' '}
          <a href={`tel:${phone}`} style={{ color: 'var(--brand)' }}>{phone}</a>
        </p>
      )}
    </div>
  );
}
