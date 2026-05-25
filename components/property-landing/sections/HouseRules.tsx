interface Policies {
  checkIn: string;
  checkOut: string;
  cancellation: string;
  minStay: number;
}

interface Props {
  policies: Policies;
  petFee: number;
}

/** House rules / policies cards grid. */
export function HouseRules({ policies, petFee }: Props) {
  const rules = [
    { label: `Entrada: ${policies.checkIn}`, sub: 'Acceso autónomo' },
    { label: `Salida: ${policies.checkOut}`, sub: 'Late check-out bajo disponibilidad' },
    ...(policies.minStay > 1 ? [{ label: 'Estancia mínima', sub: `${policies.minStay} noches` }] : []),
    ...(policies.cancellation ? [{ label: 'Cancelación', sub: policies.cancellation }] : []),
    ...(petFee > 0 ? [{ label: 'Mascotas bienvenidas', sub: `Suplemento ${petFee}€` }] : []),
  ];

  return (
    <div className="lp-section">
      <h2 className="lp-section-title">Información práctica</h2>
      <div className="lp-rules">
        {rules.map((r, i) => (
          <div key={i} className="lp-rule">
            <div>
              <strong>{r.label}</strong>
              <small>{r.sub}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
