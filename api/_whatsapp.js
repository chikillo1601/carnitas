// Envío y medios de la API de WhatsApp (Cloud API de Meta).
// Usa WA_TOKEN, WA_PHONE_ID y WA_GRAPH_VERSION (opcional) de las variables de Vercel.
export const GRAPH = () => `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v23.0'}`;

// Envía un mensaje. Devuelve { ok, error }.
export async function enviar(payload) {
  try {
    const r = await fetch(`${GRAPH()}/${process.env.WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) return { ok: true };
    const texto = (await r.text()).slice(0, 300);
    console.error('WhatsApp respondió', r.status, texto);
    return { ok: false, error: texto };
  } catch (e) {
    console.error('No se pudo enviar a WhatsApp', e);
    return { ok: false, error: String(e) };
  }
}

// Descarga un archivo (foto, audio, documento) que mandó un cliente.
export async function descargarMedio(id) {
  const h = { Authorization: `Bearer ${process.env.WA_TOKEN}` };
  const info = await fetch(`${GRAPH()}/${id}`, { headers: h });
  if (!info.ok) return null;
  const { url, mime_type } = await info.json();
  if (!url) return null;
  const archivo = await fetch(url, { headers: h });
  if (!archivo.ok) return null;
  return { tipo: mime_type || archivo.headers.get('content-type') || 'application/octet-stream', datos: await archivo.arrayBuffer() };
}
