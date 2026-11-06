# Bot de WhatsApp de Carnitas

Responde solo en el **322 701 4207** (WhatsApp Business + API de WhatsApp en "coexistencia").
Lo que el bot no entiende **no lo responde**: lo ves en tu WhatsApp y contestas tú.

## Archivos
- `api/whatsapp.js` → el webhook que recibe los mensajes (Vercel).
- `api/_bot.js` → la lógica: qué responder a cada mensaje.
- `api/_bot-config.js` → **todo lo que dice el bot**: precios, horario, domicilio, pagos, textos y si está cerrado.
  Para reabrir la tienda: `CERRADO_TEMPORALMENTE: false`.

## Qué hace
| El cliente… | El bot… |
|---|---|
| Saluda ("hola", "buenas"…) | Manda la bienvenida y una lista: Ver menú, Precios, Domicilios, Horario, Cómo pagar, Hablar con una persona |
| Toca una opción | Responde esa opción |
| Pregunta precio, domicilio, horario o pago con sus palabras | Responde esa opción |
| Envía el pedido desde la página (trae el código, ej. #K7Q2) | Confirma que lo recibió |
| Escribe "gracias" | Se despide |
| Escribe algo que el bot no entiende, manda audio, foto o ubicación | **No responde.** Contestas tú |
Mientras `CERRADO_TEMPORALMENTE` sea `true`, toda respuesta empieza con el aviso de cierre.

## Variables en Vercel (Settings → Environment Variables)
Nunca se ponen en el código ni se pegan en un chat.
| Variable | De dónde sale |
|---|---|
| `WA_VERIFY_TOKEN` | Una palabra secreta que inventas tú (ej. 20 letras al azar). La pegas también en Meta |
| `WA_APP_SECRET` | Meta → tu app → Configuración de la app → Básica → Clave secreta de la app |
| `WA_TOKEN` | Token permanente de un usuario del sistema con permiso de WhatsApp |
| `WA_PHONE_ID` | Meta → WhatsApp → Configuración de la API → Identificador del número de teléfono |
| `WA_GRAPH_VERSION` | Opcional (por defecto v23.0) |

## Webhook en Meta
- URL de devolución de llamada: `https://carnitas.online/api/whatsapp`
- Token de verificación: el mismo `WA_VERIFY_TOKEN`
- Suscribirse al campo **messages**.

## Costos (información de Meta, nov 2026)
Responder a un cliente dentro de las 24 horas después de su mensaje es gratis. Este bot solo responde; no inicia conversaciones, así que no genera cobros de plantillas.
