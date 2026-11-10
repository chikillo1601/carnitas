// La persona del equipo responde un chat desde la bandeja del panel (finanzas.html).
// POST /api/responder   Authorization: Bearer <sesión de Firebase>   { "para": "573001234567", "texto": "..." }
import { enviar } from './_whatsapp.js';
import { db, clave, usuarioDelPanel } from './_firebase.js';
import { guardarSaliente } from './_chats.js';

const VENTANA = 24 * 3600 * 1000; // WhatsApp solo deja responder gratis hasta 24 h después del último mensaje del cliente
const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(request) {
  if (!(await usuarioDelPanel(request))) return json({ error: 'Tu sesión venció. Vuelve a entrar al panel.' }, 401);
  let para, texto;
  try { ({ para, texto } = await request.json()); } catch { return json({ error: 'Datos inválidos' }, 400); }
  para = String(para || '');
  texto = String(texto || '').trim();
  if (!/^[0-9]{6,15}$/.test(para)) return json({ error: 'Número inválido' }, 400);
  if (!texto || texto.length > 4096) return json({ error: 'Escribe un mensaje (máximo 4.096 letras).' }, 400);

  let chat;
  try { chat = await db('GET', `chats/${clave(para)}`); } catch (e) { return json({ error: 'No se pudo leer el chat.' }, 502); }
  if (!chat) return json({ error: 'Ese chat no existe.' }, 404);
  if (!chat.ultimoCliente || Date.now() - chat.ultimoCliente > VENTANA) {
    return json({ error: 'Pasaron más de 24 horas desde el último mensaje del cliente. WhatsApp no deja responder gratis: espera a que el cliente vuelva a escribir.' }, 409);
  }

  const r = await enviar({ messaging_product: 'whatsapp', to: para, type: 'text', text: { body: texto, preview_url: true } });
  if (!r.ok) return json({ error: 'WhatsApp no aceptó el mensaje. Intenta de nuevo en un momento.' }, 502);
  try { await guardarSaliente(para, texto, 'equipo'); } catch (e) { console.error('Bandeja: no se guardó la respuesta', e.message); }
  return json({ ok: true });
}
