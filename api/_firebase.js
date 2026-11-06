// Acceso del servidor a Firebase (Realtime Database) y verificación del usuario del panel.
// Variables de Vercel:
//   FIREBASE_SA          JSON completo de la cuenta de servicio (Firebase → Configuración → Cuentas de servicio → Generar nueva clave privada)
//   FIREBASE_DB_URL      opcional; por defecto la base de Carnitas
//   PANEL_UIDS           opcional; usuarios que pueden responder chats, separados por coma (por defecto, el del fundador)
import crypto from 'node:crypto';

const DB = () => (process.env.FIREBASE_DB_URL || 'https://carnitas-7aafe-default-rtdb.firebaseio.com').replace(/\/$/, '');
// Clave web pública de Firebase (la misma de finanzas.html). Solo sirve para verificar sesiones.
const API_KEY = 'AIzaSyDkrGjlPMvFX7BvQyi9W9hZt1b1nuh35vs';
const UIDS = () => (process.env.PANEL_UIDS || 'OunoDLahwuYkeZ4jhN7OYjiAyfD3').split(',').map(s => s.trim()).filter(Boolean);

// Firebase no acepta . # $ [ ] / en las claves.
export const clave = s => String(s ?? '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 120);

let cache = null;
async function tokenDeServicio() {
  if (cache && Date.now() < cache.exp) return cache.token;
  let sa;
  try { sa = JSON.parse(process.env.FIREBASE_SA || ''); } catch { sa = null; }
  if (!sa?.client_email || !sa?.private_key) throw new Error('Falta la variable FIREBASE_SA');
  const ahora = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const cabeza = b64({ alg: 'RS256', typ: 'JWT' });
  const datos = b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',
    aud: 'https://oauth2.googleapis.com/token', iat: ahora, exp: ahora + 3600,
  });
  const firma = crypto.sign('RSA-SHA256', Buffer.from(`${cabeza}.${datos}`), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cabeza}.${datos}.${firma}` }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error('Google no dio acceso a Firebase: ' + (d.error_description || d.error || r.status));
  cache = { token: d.access_token, exp: Date.now() + (Number(d.expires_in) - 120) * 1000 };
  return cache.token;
}

// db('GET' | 'PUT' | 'PATCH', 'chats/573001234567', cuerpo?)
export async function db(metodo, ruta, cuerpo) {
  const t = await tokenDeServicio();
  const r = await fetch(`${DB()}/${ruta}.json?access_token=${encodeURIComponent(t)}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`Firebase ${metodo} ${ruta}: ${r.status}`);
  return r.json();
}

// Devuelve el uid si el token de sesión del panel es válido y pertenece a un usuario autorizado; si no, null.
export async function usuarioDelPanel(request) {
  const idToken = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken || idToken.length > 4000) return null;
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }),
    });
    if (!r.ok) return null;
    const uid = (await r.json()).users?.[0]?.localId;
    return uid && UIDS().includes(uid) ? uid : null;
  } catch { return null; }
}
