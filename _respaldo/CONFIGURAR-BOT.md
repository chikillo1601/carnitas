# Bot de WhatsApp de Carnitas

El **322 701 4207** queda **100 % en la API de WhatsApp** (ya no está en la app WhatsApp Business del celular).
- El bot contesta lo básico: menú, precios, domicilio, horario, pagos y confirma pedidos que traen código.
- Lo que el bot no entiende (o si el cliente pide una persona) queda marcado **🙋 Atender** en la **bandeja del panel**
  (carnitas.online/finanzas.html → "Chats de WhatsApp"). Ahí lees y respondes.
- El bot avisa una sola vez "¡Recibido! En un momento te responde alguien del equipo".

## Archivos
- `api/whatsapp.js` → webhook que recibe los mensajes, contesta y guarda todo en la bandeja.
- `api/_bot.js` → la lógica: qué responder a cada mensaje.
- `api/_bot-config.js` → **todo lo que dice el bot**: precios, horario, domicilio, pagos, textos y si está cerrado.
  Para reabrir la tienda: `CERRADO_TEMPORALMENTE: false`.
- `api/_chats.js` → cómo se guardan las conversaciones en Firebase (`/chats` y `/msgs`).
- `api/responder.js` → envía la respuesta que escribes en la bandeja (solo usuarios del panel).
- `api/medio.js` → muestra en la bandeja las fotos, audios y documentos de los clientes.
- `privacidad.html` → política de privacidad (Meta la exige para publicar la app). Borrado de datos: `privacidad.html#eliminar`.

## Qué hace
| El cliente… | El bot… |
|---|---|
| Saluda ("hola", "buenas"…) | Manda la bienvenida y una lista: Ver menú, Precios, Domicilios, Horario, Cómo pagar, Hablar con una persona |
| Toca una opción | Responde esa opción |
| Pregunta precio, domicilio, horario o pago con sus palabras | Responde esa opción |
| Envía el pedido desde la página (trae el código, ej. #K7Q2) | Confirma que lo recibió |
| Escribe "gracias" | Se despide |
| Pide una persona | Avisa que ya le escriben y marca el chat 🙋 Atender |
| Escribe algo que el bot no entiende, manda audio, foto o ubicación | Avisa una vez "¡Recibido!…" y marca el chat 🙋 Atender |
Mientras `CERRADO_TEMPORALMENTE` sea `true`, las respuestas empiezan con el aviso de cierre.

**Regla de las 24 horas:** WhatsApp solo deja responder gratis hasta 24 h después del último mensaje del cliente.
Pasado ese tiempo, la bandeja no deja escribir (habría que pagar una plantilla).

## Variables en Vercel (Settings → Environment Variables)
Nunca se ponen en el código ni se pegan en un chat.
| Variable | De dónde sale |
|---|---|
| `WA_VERIFY_TOKEN` | Una palabra secreta que inventas tú (ej. 20 letras al azar). La pegas también en Meta |
| `WA_APP_SECRET` | Meta → tu app → Configuración de la app → Información básica → Clave secreta de la app |
| `WA_TOKEN` | Token permanente de un usuario del sistema con permisos `whatsapp_business_messaging` y `whatsapp_business_management` |
| `WA_PHONE_ID` | Meta → WhatsApp → Configuración de la API → Identificador del número de teléfono |
| `FIREBASE_SECRET` | Firebase → Configuración del proyecto → Cuentas de servicio → Secretos de la base de datos → Mostrar. (Alternativa más moderna: `FIREBASE_SA` con el .json completo de "Generar nueva clave privada") |
| `WA_GRAPH_VERSION` | Opcional (por defecto v23.0) |
| `PANEL_UIDS` | Opcional. Usuarios de Firebase que pueden responder chats, separados por coma (por defecto, el del fundador). Para un kiosco: se crea su usuario y se agrega aquí y en las reglas |

## Reglas de Firebase (agregar junto a `stock` y `orders`)
```
"chats": { ".read": OWNER, ".write": OWNER, ".indexOn": ["ultimoTs"] },
"msgs":  { ".read": OWNER, ".write": false }
```
(OWNER = `auth != null && auth.uid === 'OunoDLahwuYkeZ4jhN7OYjiAyfD3'`). El servidor escribe con la cuenta de servicio, que no pasa por las reglas.

## Webhook en Meta
- URL de devolución de llamada: `https://carnitas.online/api/whatsapp`
- Token de verificación: el mismo `WA_VERIFY_TOKEN`
- Suscribirse al campo **messages**.
- La app debe estar **publicada** para recibir mensajes reales (pide la URL de privacidad: `https://carnitas.online/privacidad.html`).

## Costos (información de Meta, nov 2026)
Responder a un cliente dentro de las 24 horas después de su mensaje es gratis. Este bot solo responde; no inicia conversaciones, así que no genera cobros de plantillas.
