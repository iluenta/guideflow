/* global window */
const PROPERTY = {
  name: 'Vera Tespera',
  greeting: 'jose',
  hero: window.__resources.heroPool,
  weather: { temp: 18, low: 13, condition: 'Cielo cubierto', humidity: 79, wind: 'Viento suave', updated: '21:18' },
  address: 'Avenida de la Alcazaba, 115, Vera, Almería',
  addressShort: 'Av. de la Alcazaba, 115',
  city: 'Vera, Almería',
  mapUrl: 'https://maps.google.com/?q=Avenida+de+la+Alcazaba+115+Vera+Almeria',
  code: '07349',
  parking: '288',
  wifi: { ssid: 'veratespera_5G', pass: 'Ver@Tesper@1234' },
  host: { name: 'Nicoleta', phone: '643325415', whatsapp: '+34643325415' },
  checkIn: { from: '15:00', to: '22:00' },
  checkOut: '11:00',
};

const STEPS = [
  {
    kind: 'Dirección',
    icon: 'pin',
    body: 'Avenida de la Alcazaba, 115, Vera, Almería',
    action: { label: 'Ver en mapa', icon: 'map' },
  },
  {
    kind: 'Punto de encuentro',
    icon: 'clock',
    body: '30 minutos antes de llegar a Vera contacta con nosotros para que podamos estar preparados. Quedaríamos a la entrada de la urbanización a la hora acordada.',
    photo: window.__resources.stepEntrance,
    photoCaption: 'Entrada de la urbanización',
  },
  {
    kind: 'Código de acceso',
    icon: 'key',
    body: 'El código de acceso a la urbanización es **07349**.',
    highlight: 'code',
  },
  {
    kind: 'Acceso a la urbanización',
    icon: 'gate',
    body: 'Para acceder a la urbanización puedes hacerlo en coche o andando. Si lo haces en coche, utiliza el mando a distancia que te hemos facilitado para abrir la puerta o el código de acceso. Si lo haces andando, tienes una llave para abrir la puerta pequeña en el juego de llaves que te hemos facilitado.',
  },
  {
    kind: 'Plaza de parking',
    icon: 'car',
    body: 'Cuando accedas a través de la puerta principal, a continuación gira a la derecha. Sigue avanzando unos 200 metros y encontrarás la plaza reservada para el apartamento. Es la plaza **288**. La plaza tiene un cepo. En el juego de llaves que te hemos facilitado tienes una llave para abrirlo.',
    photo: window.__resources.stepParking,
    photoCaption: 'Plaza 288',
    marker: '🚗',
  },
  {
    kind: 'Ir hacia el apartamento',
    icon: 'walk',
    body: 'Dejando a tus espaldas la plaza de parking, continúa entre los dos edificios hasta llegar a la piscina, sigue hacia delante dejando la piscina a la derecha y pasa por en medio de los dos edificios. Pasados los dos edificios, gira hacia la izquierda, sigue recto por en medio de los edificios y busca las segundas escaleras de subida.',
    photo: window.__resources.stepStairs,
    photoCaption: 'Escaleras del bloque',
  },
  {
    kind: 'Apartamento',
    icon: 'door',
    body: 'Subiendo las escaleras, la primera puerta que encuentras de frente es el apartamento, el **22-3**.',
  },
];

window.PROPERTY = PROPERTY;
window.STEPS = STEPS;
