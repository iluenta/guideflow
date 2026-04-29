/* global window, React */
const { useState } = React;

const ArrivalScreen = ({ onBack }) => {
  const Icon = window.Icon;
  const PROPERTY = window.PROPERTY;
  const STEPS = window.STEPS;
  const useCopy = window.useCopy;

  const [copied, copy] = useCopy();
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const renderBody = (text) => {
    const parts = text.split(/\*\*(.+?)\*\*/g);
    return parts.map((p, i) => (i % 2 === 1 ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>));
  };

  return (
    <div className="arrival screen-enter">
      <div className="topbar">
        <button className="topbar__back" onClick={onBack}><Icon name="arrow-back" size={18} /></button>
        <div className="topbar__title">Llegada</div>
        <div className="topbar__spacer" />
      </div>

      <div className="access-hero">
        <div className="access-hero__row">
          <div className="access-hero__left">
            <div className="access-hero__label">Tu llave digital</div>
            <h2 className="access-hero__title">Bienvenido a {PROPERTY.name}</h2>
            <div className="access-hero__codebox">
              <div>
                <div style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .8, fontWeight: 700, marginBottom: 2 }}>Código urb.</div>
                <div className="access-hero__codedigits">{PROPERTY.code}</div>
              </div>
              <button
                className={`access-hero__copybtn ${copied ? 'copied' : ''}`}
                onClick={() => { copy(PROPERTY.code); showToast('Código copiado'); }}
              >
                <Icon name={copied ? 'check' : 'copy'} size={12} />
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
        <div className="access-hero__window">
          <Icon name="clock" size={14} />
          <div style={{ flex: 1 }}>
            <div className="access-hero__window-label">Check-in disponible</div>
            <div className="access-hero__window-value">{PROPERTY.checkIn.from} – {PROPERTY.checkIn.to}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, background: '#6CE9A6', color: 'var(--blue-700)', padding: '4px 8px', borderRadius: 999 }}>Ahora</span>
        </div>
      </div>

      <div className="steps-intro">
        <div className="steps-intro__label">Sigue estos pasos al llegar</div>
      </div>

      <div className="timeline">
        {STEPS.map((step, idx) => (
          <div key={idx} className="step">
            <div className="step__bullet">{idx + 1}</div>
            <div className="step__card">
              <div className="step__head">
                <div className="step__kind">
                  <Icon name={step.icon} size={12} stroke={2.2} />
                  {step.kind}
                </div>
              </div>
              <p className="step__body">{renderBody(step.body)}</p>
              {step.action && (
                <button className="step__action" onClick={() => showToast('Abriendo mapa…')}>
                  <Icon name={step.action.icon} size={13} />
                  {step.action.label}
                </button>
              )}
              {step.photo && (
                <div className="step__photo">
                  <img src={step.photo} alt={step.photoCaption || step.kind} />
                  {step.marker && (
                    <div className="step__photo-marker" style={{ left: '46%', top: '54%' }}>
                      {step.marker}
                    </div>
                  )}
                  {step.photoCaption && <div className="step__photo-caption">{step.photoCaption}</div>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="help">
        <div className="help__label">¿Problemas para entrar? Contacta con {PROPERTY.host.name}</div>
      </div>

      <div className="fab">
        <div className="fab__inner">
          <a className="fab__btn fab__btn--whatsapp" href={`https://wa.me/${PROPERTY.host.whatsapp.replace('+','')}`}>
            <Icon name="whatsapp" size={16} /> WhatsApp
          </a>
          <a className="fab__btn fab__btn--call" href={`tel:${PROPERTY.host.phone}`}>
            <Icon name="phone" size={16} /> Llamar
          </a>
        </div>
      </div>

      {toast && (
        <div className="toast show">
          <Icon name="check" size={14} stroke={3} />
          {toast}
        </div>
      )}
    </div>
  );
};

window.ArrivalScreen = ArrivalScreen;
