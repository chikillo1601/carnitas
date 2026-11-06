// Configuración del bot de WhatsApp de Carnitas.
// Todo lo que el bot dice sale de aquí. Si cambia un precio, un horario o el estado de la tienda,
// se cambia SOLO en este archivo (y debe coincidir con el Tablero Carnitas).

export const BOT = {
  // true mientras la tienda esté cerrada temporalmente (igual que CLOSED_UNTIL_NOTICE en index.html).
  CERRADO_TEMPORALMENTE: true,

  MARCA: 'Carnitas',
  ESLOGAN: 'Barriga llena, corazón contento',
  PAGINA: 'carnitas.online',
  INSTAGRAM: '@carnitas.co',

  HORARIO: 'De lunes a sábado, de 5:00 p. m. a 11:00 p. m. Los domingos no abrimos.',
  PAGOS: 'Efectivo o transferencia por Nequi.',
  DOMICILIO: 'El domicilio cuesta entre $5.000 y $6.000 según la distancia. Es gratis en pedidos de más de $50.000.',

  // Precios que el bot puede decir. Solo lo aprobado en el Tablero.
  PRECIOS: [
    'Sándwiches (Texas BBQ, Cheese Spicy o Azteca), de cerdo o res: $16.900',
    'Adicionales: $3.000 cada uno',
    'Coca-Cola con tu pedido: +$4.000',
  ],
};

// Textos del bot. {marca}, {eslogan}, etc. se reemplazan con los valores de arriba.
export const TEXTOS = {
  saludo: '¡Hola! 👋🔥 Bienvenido a *{marca}*: {eslogan}.\n¿En qué te ayudo?',
  cerrado: '🦙 Ahora mismo estamos *cerrados temporalmente* mientras mejoramos {marca} para ti. ¡Volvemos muy pronto! Síguenos en Instagram {instagram} para enterarte primero.',
  menu: '🍔 Mira el menú y arma tu pedido aquí 👉 https://{pagina}\nCuando lo envíes, te llega a este mismo WhatsApp.',
  precios: '💰 *Precios*\n{precios}',
  domicilio: '🛵 *Domicilios*\n{domicilio}',
  horario: '🕔 *Horario*\n{horario}',
  pagos: '💳 *Formas de pago*\n{pagos}',
  persona: '🙋 ¡Listo! Ya le avisamos al equipo de {marca}. Te escribimos por aquí en un momento.',
  pedido: '🧾 ¡Recibimos tu pedido *#{codigo}*! En un momento lo confirmamos por aquí. Gracias por pedir en {marca} 🔥',
  pedidoCerrado: '🧾 Vimos tu pedido *#{codigo}*, pero ahora estamos *cerrados temporalmente*. Te avisamos por aquí apenas volvamos. ¡Disculpa las molestias!',
  despedida: '¡Gracias a ti! 🦙 {eslogan}.',
};

// Opciones del menú principal (lista de WhatsApp: máximo 10 opciones, título de máximo 24 caracteres).
export const OPCIONES = [
  { id: 'menu',      titulo: 'Ver el menú y pedir',  detalle: 'Link para armar tu pedido' },
  { id: 'precios',   titulo: 'Precios',              detalle: 'Sándwiches y adicionales' },
  { id: 'domicilio', titulo: 'Domicilios',           detalle: 'Costo y domicilio gratis' },
  { id: 'horario',   titulo: 'Horario',              detalle: 'Días y horas' },
  { id: 'pagos',     titulo: 'Cómo pagar',           detalle: 'Efectivo o Nequi' },
  { id: 'persona',   titulo: 'Hablar con una persona', detalle: 'Te atiende el equipo' },
];

// Palabras que activan cada respuesta cuando el cliente escribe (sin tildes, en minúscula).
export const PALABRAS = {
  saludo:    ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hey', 'ola', 'info', 'informacion'],
  menu:      ['menu', 'carta', 'pedir', 'pedido', 'quiero'],
  precios:   ['precio', 'precios', 'cuanto', 'vale', 'valor', 'cuesta'],
  domicilio: ['domicilio', 'domicilios', 'envio', 'envian', 'llevan'],
  horario:   ['horario', 'hora', 'abren', 'abierto', 'cierran', 'atienden'],
  pagos:     ['pago', 'pagar', 'nequi', 'transferencia', 'efectivo'],
  persona:   ['persona', 'asesor', 'humano', 'ayuda', 'queja', 'reclamo'],
  despedida: ['gracias', 'grax', 'muchas gracias'],
};
