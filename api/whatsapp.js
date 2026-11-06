// Webhook del bot de WhatsApp de Carnitas (Vercel).
// URL: https://carnitas.online/api/whatsapp
// Variables de entorno (se ponen en Vercel → Settings → Environment Variables, NUNCA en el código):
//   WA_VERIFY_TOKEN   palabra secreta que inventas tú y pegas también en Meta al configurar el webhook
//   WA_APP_SECRET     "Clave secreta de la app" (Meta → tu app → Configuración → Básica)
//   WA_TOKEN          token de acceso permanente de WhatsApp (usuario del sistema)
//   WA_PHONE_ID       "Identificador del número de teléfono" (Meta → WhatsApp → Configuración de la API)
//   WA_GRAPH_VERSION  opcional, ej. v23.0
//   FIREBASE_SA       cuenta de servicio de Firebase, para guardar los chats en la bandeja del panel
import crypto from 'node:crypto';
import { responder, aPayload, intencion, respuestaEspera } from './_bot.js';
import { enviar } from './_whatsapp.js';
import { guardarEntrante, guardarSaliente, textoDeRespuesta } from './_chats.js';
import { db, clave } from './_firebase.js';

// Paso 1 de Meta: verificar el webhook.
export async function GET(request) {
  const url = new URL(request.url);
  const ok = url.searchParams.get('hub.mode') === 'subscribe'
    && process.env.WA_VERIFY_TOKEN
    && url.searchParams.get('hub.verify_token') === process.env.WA_VERIFY_TOKEN;
  return ok ? new Response(url.searchParams.get('hub.challenge') || '', { status: 200 })
            : new Response('No autorizado', { status: 403 });
}

// Firma de Meta: confirma que el mensaje viene de WhatsApp y no de un tercero.
function firmaValida(cuerpo, firma) {
  const secreto = process.env.WA_APP_SECRET;
  if (!secreto || !firma || !firma.startsWith('sha256=')) return false;
  const esperado = 'sha256=' + crypto.createHmac('sha256', secreto).update(cuerpo).digest('hex');
  const a = Buffer.from(firma), b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ¿El cliente quiere hablar con una persona? (lo pidió, o el bot no supo qué responder)
function pidePersona(m, respuestas) {
  if (!respuestas.length) return true;
  const elegido = m.interactive?.list_reply?.id || m.interactive?.button_reply?.id;
  if (elegido) return elegido === 'persona';
  return m.type === 'text' && intencion(m.text?.body) === 'persona';
}

// Guardar en la bandeja nunca debe frenar las respuestas.
async function seguro(tarea, que) {
  try { await tarea(); } catch (e) { console.error('Bandeja: no se pudo guardar', que, e.message); }
}

// Paso 2: Meta nos manda cada mensaje que escribe un cliente.
export async function POST(request) {
  const cuerpo = await request.text();
  if (!firmaValida(cuerpo, request.headers.get('x-hub-signature-256'))) {
    return new Response('Firma inválida', { status: 401 });
  }
  let datos;
  try { datos = JSON.parse(cuerpo); } catch { return new Response('ok', { status: 200 }); }

  for (const entrada of datos.entry || []) {
    for (const cambio of entrada.changes || []) {
      const valor = cambio.value || {};
      if (process.env.WA_PHONE_ID && valor.metadata?.phone_number_id && valor.metadata.phone_number_id !== process.env.WA_PHONE_ID) continue;
      const nombres = Object.fromEntries((valor.contacts || []).map(c => [c.wa_id, c.profile?.name || '']));
      for (const mensaje of valor.messages || []) {
        let respuestas = responder(mensaje);
        // Si el bot no entiende, avisa una sola vez que ya lo atiende una persona (si ya está esperando, no repite).
        let yaEspera = false;
        if (!respuestas.length) await seguro(async () => { yaEspera = (await db('GET', `chats/${clave(mensaje.from)}/persona`)) === true; }, 'estado');
        const avisarEspera = !respuestas.length && !yaEspera;
        // 1) Se guarda lo que escribió el cliente (aunque sea viejo: la bandeja debe tenerlo todo).
        await seguro(() => guardarEntrante(mensaje, nombres[mensaje.from], pidePersona(mensaje, respuestas)), 'entrante');
        if (avisarEspera) respuestas = [respuestaEspera()];
        // 2) Solo se contestan mensajes recientes (Meta reintenta envíos viejos): máximo 5 minutos.
        if (Date.now() / 1000 - Number(mensaje.timestamp || 0) > 300) continue;
        // En orden, para que el aviso de "cerrado" llegue antes que el menú.
        for (const r of respuestas) {
          const { ok } = await enviar(aPayload(mensaje.from, r));
          if (ok) await seguro(() => guardarSaliente(mensaje.from, textoDeRespuesta(r), 'bot'), 'respuesta del bot');
        }
      }
    }
  }
  return new Response('ok', { status: 200 }); // Meta necesita un 200 siempre, o reintenta
}
