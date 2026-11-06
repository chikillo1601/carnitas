// Lógica del bot (sin red): recibe un mensaje y decide qué responder.
// Se puede probar sin WhatsApp: ver _respaldo/CONFIGURAR-BOT.md.
import { BOT, TEXTOS, OPCIONES, PALABRAS } from './_bot-config.js';

const sinTildes = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function llenar(texto, extra = {}) {
  const datos = {
    marca: BOT.MARCA, eslogan: BOT.ESLOGAN, pagina: BOT.PAGINA, instagram: BOT.INSTAGRAM,
    horario: BOT.HORARIO, pagos: BOT.PAGOS, domicilio: BOT.DOMICILIO,
    precios: BOT.PRECIOS.map(p => '• ' + p).join('\n'),
    ...extra,
  };
  return texto.replace(/\{(\w+)\}/g, (m, k) => (k in datos ? datos[k] : m));
}

// Código de pedido de la página: "🧾 Pedido #K7Q2" (4 caracteres, sin 0/O/1/I).
const CODIGO = /#([A-HJ-NP-Z2-9]{4})\b/;

// Busca la intención en lo que escribió el cliente. Devuelve null si no entiende,
// para que el bot NO responda y pueda contestar una persona.
export function intencion(texto) {
  const t = sinTildes(texto).replace(/[^a-z0-9ñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  const palabras = ' ' + t + ' ';
  const tiene = lista => lista.some(p => palabras.includes(' ' + p + ' '));
  // El orden importa: lo más específico primero.
  for (const id of ['persona', 'precios', 'domicilio', 'horario', 'pagos', 'menu', 'despedida', 'saludo']) {
    if (tiene(PALABRAS[id])) return id;
  }
  return null;
}

// Mensaje entrante (formato de la API de WhatsApp) → lista de respuestas a enviar.
// Cada respuesta es { tipo: 'texto', texto } o { tipo: 'lista', texto, opciones }.
export function responder(mensaje) {
  if (!mensaje) return [];
  const cerrado = BOT.CERRADO_TEMPORALMENTE;
  const menuPrincipal = texto => ({ tipo: 'lista', texto, opciones: OPCIONES });

  // 1) Botón o fila de lista tocada por el cliente.
  const elegido = mensaje.interactive?.list_reply?.id || mensaje.interactive?.button_reply?.id;
  if (elegido) {
    if (!OPCIONES.some(o => o.id === elegido)) return [menuPrincipal(llenar(TEXTOS.saludo))];
    const salida = [{ tipo: 'texto', texto: llenar(TEXTOS[elegido]) }];
    if (cerrado && elegido !== 'persona') salida.unshift({ tipo: 'texto', texto: llenar(TEXTOS.cerrado) });
    return salida;
  }

  if (mensaje.type !== 'text') return []; // audios, fotos, ubicación, etc.: los atiende una persona
  const texto = mensaje.text?.body || '';

  // 2) Pedido que llega desde la página (trae el código).
  const codigo = texto.match(CODIGO);
  if (codigo) return [{ tipo: 'texto', texto: llenar(cerrado ? TEXTOS.pedidoCerrado : TEXTOS.pedido, { codigo: codigo[1] }) }];

  // 3) Texto libre: solo responde si entiende. Si no, se queda callado para que conteste una persona.
  const id = intencion(texto);
  if (!id) return [];
  if (id === 'saludo') {
    const salida = [menuPrincipal(llenar(TEXTOS.saludo))];
    if (cerrado) salida.unshift({ tipo: 'texto', texto: llenar(TEXTOS.cerrado) });
    return salida;
  }
  if (id === 'despedida' || id === 'persona') return [{ tipo: 'texto', texto: llenar(TEXTOS[id]) }];
  const salida = [{ tipo: 'texto', texto: llenar(TEXTOS[id]) }];
  if (cerrado) salida.unshift({ tipo: 'texto', texto: llenar(TEXTOS.cerrado) });
  return salida;
}

// Aviso de "ya te atendemos" cuando el bot no entiende (lo decide el webhook, una vez por conversación).
export function respuestaEspera() {
  return { tipo: 'texto', texto: llenar(TEXTOS.recibido) };
}

// Convierte una respuesta al formato que pide la API de WhatsApp.
export function aPayload(para, r) {
  if (r.tipo === 'lista') {
    return {
      messaging_product: 'whatsapp', to: para, type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: r.texto.slice(0, 1024) },
        action: {
          button: 'Ver opciones',
          sections: [{ title: BOT.MARCA, rows: r.opciones.slice(0, 10).map(o => ({
            id: o.id, title: o.titulo.slice(0, 24), description: (o.detalle || '').slice(0, 72),
          })) }],
        },
      },
    };
  }
  return { messaging_product: 'whatsapp', to: para, type: 'text', text: { body: r.texto.slice(0, 4096), preview_url: true } };
}
