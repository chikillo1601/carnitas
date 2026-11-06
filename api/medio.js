// Muestra en la bandeja una foto, audio o documento que mandó un cliente.
// GET /api/medio?id=123456   Authorization: Bearer <sesión de Firebase>
import { descargarMedio } from './_whatsapp.js';
import { usuarioDelPanel } from './_firebase.js';

export async function GET(request) {
  if (!(await usuarioDelPanel(request))) return new Response('No autorizado', { status: 401 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[0-9]{5,30}$/.test(id)) return new Response('Id inválido', { status: 400 });
  const m = await descargarMedio(id);
  if (!m) return new Response('WhatsApp ya no tiene este archivo (se borran a los 30 días).', { status: 404 });
  return new Response(m.datos, { status: 200, headers: { 'Content-Type': m.tipo, 'Cache-Control': 'private, max-age=3600' } });
}
