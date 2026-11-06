// Webhook del bot de WhatsApp de Carnitas (Vercel).
// URL: https://carnitas.online/api/whatsapp
// Variables de entorno (se ponen en Vercel → Settings → Environment Variables, NUNCA en el código):
//   WA_VERIFY_TOKEN   palabra secreta que inventas tú y pegas también en Meta al configurar el webhook
//   WA_APP_SECRET     "Clave secreta de la app" (Meta → tu app → Configuración → Básica)
//   WA_TOKEN          token de acceso permanente de WhatsApp (usuario del sistema)
//   WA_PHONE_ID       "Identificador del número de teléfono" (Meta → WhatsApp → Configuración de la API)
//   WA_GRAPH_VERSION  opcional, ej. v23.0
import crypto from 'node:crypto';
import { responder, aPayload } from './_bot.js';

const GRAPH = () => `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v23.0'}`;

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

async function enviar(payload) {
  const r = await fetch(`${GRAPH()}/${process.env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) console.error('WhatsApp respondió', r.status, (await r.text()).slice(0, 300));
}

// Paso 2: Meta nos manda cada mensaje que escribe un cliente.
export async function POST(request) {
  const cuerpo = await request.text();
  if (!firmaValida(cuerpo, request.headers.get('x-hub-signature-256'))) {
    return new Response('Firma inválida', { status: 401 });
  }
  let datos;
  try { datos = JSON.parse(cuerpo); } catch { return new Response('ok', { status: 200 }); }

  const trabajos = [];
  for (const entrada of datos.entry || []) {
    for (const cambio of entrada.changes || []) {
      const valor = cambio.value || {};
      if (process.env.WA_PHONE_ID && valor.metadata?.phone_number_id && valor.metadata.phone_number_id !== process.env.WA_PHONE_ID) continue;
      for (const mensaje of valor.messages || []) {
        // Solo mensajes recientes (Meta reintenta envíos viejos): máximo 5 minutos.
        if (Date.now() / 1000 - Number(mensaje.timestamp || 0) > 300) continue;
        for (const r of responder(mensaje)) trabajos.push(() => enviar(aPayload(mensaje.from, r)));
      }
    }
  }
  // En orden, para que el aviso de "cerrado" llegue antes que el menú.
  for (const t of trabajos) { try { await t(); } catch (e) { console.error(e); } }
  return new Response('ok', { status: 200 }); // Meta necesita un 200 siempre, o reintenta
}
