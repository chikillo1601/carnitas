// Guarda las conversaciones de WhatsApp en Firebase para la bandeja del panel.
//   /chats/{numero}  → resumen: nombre, último mensaje, sin leer, si pide una persona, hora del último mensaje del cliente
//   /msgs/{numero}/{hora_id} → cada mensaje (la clave empieza por la hora, así quedan en orden)
import { db, clave } from './_firebase.js';

// Convierte un mensaje de WhatsApp en algo que se pueda mostrar en la bandeja.
export function describir(m) {
  const medio = (tipo, x = {}) => ({ id: x.id, tipo, mime: x.mime_type || '', nota: x.caption || x.filename || '' });
  switch (m.type) {
    case 'text': return { texto: m.text?.body || '' };
    case 'interactive': {
      const r = m.interactive?.list_reply || m.interactive?.button_reply || {};
      return { texto: `[Tocó: ${r.title || r.id || 'opción'}]` };
    }
    case 'button': return { texto: `[Tocó: ${m.button?.text || 'botón'}]` };
    case 'image': return { texto: m.image?.caption || '📷 Foto', medio: medio('image', m.image) };
    case 'audio': return { texto: '🎤 Audio', medio: medio('audio', m.audio) };
    case 'video': return { texto: m.video?.caption || '🎬 Video', medio: medio('video', m.video) };
    case 'document': return { texto: '📄 ' + (m.document?.filename || 'Documento'), medio: medio('document', m.document) };
    case 'sticker': return { texto: '🙂 Sticker', medio: medio('image', m.sticker) };
    case 'location': {
      const l = m.location || {};
      return { texto: `📍 Ubicación${l.name ? ': ' + l.name : ''}${l.address ? ' (' + l.address + ')' : ''}\nhttps://maps.google.com/?q=${l.latitude},${l.longitude}` };
    }
    case 'contacts': return { texto: '👤 Contacto: ' + (m.contacts?.[0]?.name?.formatted_name || '') };
    case 'reaction': return { texto: `Reaccionó ${m.reaction?.emoji || ''}` };
    default: return { texto: `[${m.type || 'mensaje'}]` };
  }
}

const sinVacios = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== ''));

// Mensaje que escribió el cliente.
export async function guardarEntrante(m, nombre, pidePersona) {
  const num = clave(m.from);
  const ts = Number(m.timestamp) * 1000 || Date.now();
  const { texto, medio } = describir(m);
  await db('PUT', `msgs/${num}/${ts}_${clave(m.id)}`, sinVacios({ ts, dir: 'in', por: 'cliente', texto: texto.slice(0, 4096), medio: medio && sinVacios(medio) }));
  await db('PATCH', `chats/${num}`, sinVacios({
    nombre: (nombre || '').slice(0, 80),
    ultimo: texto.slice(0, 120), ultimoTs: ts, ultimoCliente: ts,
    sinLeer: { '.sv': { increment: 1 } },
    ...(pidePersona ? { persona: true } : {}),
  }));
}

// Mensaje que salió hacia el cliente (del bot o del equipo).
export async function guardarSaliente(numero, texto, por) {
  const num = clave(numero);
  const ts = Date.now();
  await db('PUT', `msgs/${num}/${ts}_${por}${Math.random().toString(36).slice(2, 7)}`, { ts, dir: 'out', por, texto: String(texto).slice(0, 4096) });
  const resumen = { ultimo: String(texto).slice(0, 120), ultimoTs: ts };
  if (por === 'equipo') Object.assign(resumen, { persona: false, sinLeer: 0 });
  await db('PATCH', `chats/${num}`, resumen);
}

// Texto que se guarda para una respuesta del bot (las listas se guardan con sus opciones).
export function textoDeRespuesta(r) {
  if (r.tipo === 'lista') return r.texto + '\n[Opciones: ' + r.opciones.map(o => o.titulo).join(' · ') + ']';
  return r.texto;
}
