/* global window, React */
const { useState } = React;
const Icon = window.Icon;
const PROPERTY = window.PROPERTY;

const useCopy = () => {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch (e) {/* noop */}
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return [copied, copy];
};

/* ====== Hero with greeting ====== */
const Hero = () =>
<div className="hero">
    <div className="hero__img" style={{ backgroundImage: `url(${PROPERTY.hero})` }} />
    <div className="hero__veil" />
    <div className="hero__top">
      <div className="hero__brand">
        <span className="hero__brand-dot" />
        Bienvenido a {PROPERTY.name}
      </div>
    </div>
    <div className="hero__bottom">
      <div className="hero__eyebrow">Hoy · Domingo, 27 abr</div>
      <h1 className="hero__title">Hola, {PROPERTY.greeting}</h1>
      <div className="hero__subtitle">{PROPERTY.name} · {PROPERTY.city}</div>
    </div>
  </div>;


/* ====== Status pill: weather + check-in ====== */
const StatusPill = () =>
<div className="status" style={{ margin: "-15px 16px 0px" }}>
    <div className="status__col">
      <div className="status__label">Tiempo en Vera</div>
      <div className="status__main">
        <Icon name="cloud" size={20} />
        {PROPERTY.weather.temp}° <span style={{ color: 'var(--ink-400)', fontWeight: 500, fontSize: 14 }}>/ {PROPERTY.weather.low}°</span>
      </div>
      <div className="status__sub">{PROPERTY.weather.condition}</div>
    </div>
    <div className="status__divider" />
    <div className="status__col" style={{ textAlign: 'right' }}>
      <div className="status__label">Check-in disponible</div>
      <div className="status__main" style={{ justifyContent: 'flex-end', color: 'var(--green)' }}>
        {PROPERTY.checkIn.from} – {PROPERTY.checkIn.to}
      </div>
      <div className="status__sub">Avísanos 30 min antes</div>
    </div>
  </div>;


/* ====== Big arrival/access card ====== */
const ArrivalCard = ({ onOpenEntry }) => {
  const [copied, copy] = useCopy();
  return (
    <div className="entry-card">
      <div className="entry-card__head">
        <div className="entry-card__eyebrow">
          <Icon name="key" size={12} /> Acceso
        </div>
      </div>
      <div className="entry-card__codelabel">Código de la urbanización</div>
      <div className="entry-card__code">
        <div className="entry-card__digits">{PROPERTY.code}</div>
        <button className={`entry-card__copy ${copied ? 'copied' : ''}`} onClick={() => copy(PROPERTY.code)}>
          <Icon name={copied ? 'check' : 'copy'} size={14} />
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <button className="entry-card__cta" onClick={onOpenEntry}>
        <span className="entry-card__cta-left">
          <span className="entry-card__cta-icon"><Icon name="door" size={18} /></span>
          <span style={{ textAlign: 'left' }}>
            Cómo entrar al apartamento
            <div className="entry-card__cta-meta">7 pasos · con fotos</div>
          </span>
        </span>
        <Icon name="arrow" size={18} />
      </button>
    </div>);

};

/* ====== Info grid ====== */
const InfoCard = ({ icon, label, value, sub, actions, onClick, wide }) =>
<div className={`info-card ${wide ? 'info-card--wide' : ''}`} onClick={onClick}>
    {wide ?
  <>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-50)', color: 'var(--blue-600)', display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
          <Icon name={icon} size={20} />
        </div>
        <div className="info-card__head-text" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, color: 'var(--ink-400)' }}>{label}</div>
          <div className="info-card__value">{value}</div>
          {sub && <div className="info-card__sub">{sub}</div>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 6 }}>{actions}</div>}
      </> :

  <>
        <div className="info-card__head"><Icon name={icon} size={14} stroke={2.2} />{label}</div>
        <div className="info-card__value">{value}</div>
        {sub && <div className="info-card__sub">{sub}</div>}
        {actions && <div className="info-card__actions">{actions}</div>}
      </>
  }
  </div>;


const InfoGrid = () => {
  const [copiedSsid, copySsid] = useCopy();
  const [copiedPass, copyPass] = useCopy();
  return (
    <div className="info-grid">
      <InfoCard
        wide
        icon="pin"
        label="Dirección"
        value={PROPERTY.addressShort}
        sub={PROPERTY.city}
        actions={
        <a className="icon-btn" href={PROPERTY.mapUrl} target="_blank" rel="noopener" title="Abrir en mapa">
            <Icon name="map" size={14} />
          </a>
        } />
      
      <InfoCard
        icon="car"
        label="Parking"
        value={`Plaza ${PROPERTY.parking}`}
        sub="Con cepo · llave incluida" />
      
      <InfoCard
        icon="clock"
        label="Check-out"
        value={PROPERTY.checkOut}
        sub="Deja la llave dentro" />
      
      <InfoCard
        icon="wifi"
        label="WiFi"
        value={PROPERTY.wifi.ssid}
        sub={PROPERTY.wifi.pass}
        actions={
        <>
            <button className={`icon-btn ${copiedSsid ? 'copied' : ''}`} onClick={() => copySsid(PROPERTY.wifi.ssid)} title="Copiar red">
              <Icon name={copiedSsid ? 'check' : 'copy'} size={13} />
            </button>
            <button className={`icon-btn ${copiedPass ? 'copied' : ''}`} onClick={() => copyPass(PROPERTY.wifi.pass)} title="Copiar contraseña">
              <Icon name={copiedPass ? 'check' : 'lock'} size={13} />
            </button>
          </>
        } />
      
      <InfoCard
        icon="phone"
        label="Anfitrión"
        value={PROPERTY.host.name}
        sub={PROPERTY.host.phone}
        actions={
        <>
            <a className="icon-btn" href={`tel:${PROPERTY.host.phone}`} title="Llamar"><Icon name="phone" size={13} /></a>
            <a className="icon-btn" href={`https://wa.me/${PROPERTY.host.whatsapp.replace('+', '')}`} title="WhatsApp" style={{ background: '#E6F8EF', color: '#128C7E' }}>
              <Icon name="whatsapp" size={14} />
            </a>
          </>
        } />
      
    </div>);

};

/* ====== Recommendation + extras ====== */
const Recommendation = () =>
<div className="reco">
    <div className="reco__head">
      <div className="reco__time">
        <Icon name="clock" size={14} />
        <strong>21:18</strong> · Buenas noches 🌙
      </div>
      <div className="reco__pill">Recomendación</div>
    </div>
    <h3 className="reco__title">Restaurante Lua Puerto Rey</h3>
    <p className="reco__desc">Perfecto para una cena con un toque de sofisticación.</p>
    <div className="reco__tags">
      <span className="reco__tag"><Icon name="clock" size={11} /> 23 min</span>
      <span className="reco__tag">Mariscos</span>
      <span className="reco__tag"><Icon name="heart" size={11} /> Romántico</span>
    </div>
    <button className="reco__cta">Ver recomendaciones <Icon name="arrow" size={14} /></button>
  </div>;


const Welcome = ({ onOpenEntry }) =>
<div className="welcome screen-enter">
    <Hero />
    <StatusPill />

    <div className="section">
      <div className="section__title"><Icon name="sparkle" size={12} /> De un vistazo</div>
      <ArrivalCard onOpenEntry={onOpenEntry} />
    </div>

    <div className="section" style={{ paddingTop: 16 }}>
      <InfoGrid />
      <button className="detail-link">
        Ver todos los detalles del apartamento
        <Icon name="arrow" size={14} />
      </button>
    </div>

    <div className="assistant">
      <Icon name="sparkle" size={16} />
      <div className="assistant__label">Tu asistente digital en Vera</div>
      <div className="assistant__arrow"><Icon name="arrow" size={16} /></div>
    </div>

    <Recommendation />

    <div className="discover">
      <div className="discover__title">Descubre Vera</div>
      <div className="discover__grid">
        <div className="discover__card">
          <div className="discover__card-img" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80)' }} />
          <div className="discover__card-veil" />
          <div className="discover__card-label">Dónde comer</div>
        </div>
        <div className="discover__card">
          <div className="discover__card-img" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80)' }} />
          <div className="discover__card-veil" />
          <div className="discover__card-label">Qué hacer</div>
        </div>
      </div>
    </div>

    <div className="footer">Desarrollado por Hosptia</div>
  </div>;


window.Welcome = Welcome;
window.useCopy = useCopy;