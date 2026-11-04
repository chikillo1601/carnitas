# Panel de finanzas (carnitas.online/finanzas.html)

Cada vez que un cliente toca **"Enviar pedido por WhatsApp"**, la página guarda una copia del pedido en Firebase
con estado `pendiente` y un código corto (ej. `#K7Q2`) que también aparece al final del mensaje de WhatsApp.

Al cerrar, entras a `carnitas.online/finanzas.html` y marcas cada pedido:
- ✅ **Entregado**: se entregó y se pagó. Solo estos cuentan como venta.
- ❌ **No se concretó**: el cliente no envió el mensaje, canceló o no pagó.

El botón **"Copiar resumen para Gerencia"** copia los números del día o de la semana para pegarlos en el chat.

## Configuración (una sola vez, ~10 minutos, gratis)

En https://console.firebase.google.com → proyecto **carnitas-7aafe**:

### 1. Activar el inicio de sesión con correo
**Authentication → Sign-in method → Correo electrónico/contraseña → Habilitar.**

### 2. Crear tu usuario
**Authentication → Users → Agregar usuario.** Pon tu correo y una clave fuerte.
Copia el **UID** que aparece en la lista (una cadena larga de letras y números).

### 3. Copiar la clave de API web
**Configuración del proyecto (engranaje) → General → "Clave de API web".**
Pégala en `finanzas.html`, en `FIREBASE_API_KEY`.
Si no aparece, en esa misma página agrega una app web (ícono `</>`) y vuelve a mirar.

### 4. Reglas de la base de datos
**Realtime Database → Reglas.** NO borres lo que ya tienes en `"stock"`.
Solo agrega (o reemplaza) el bloque `"orders"` dentro de `"rules"`, cambiando `TU_UID` por el UID del paso 2:

```json
"orders": {
  ".read": "auth != null && auth.uid === 'TU_UID'",
  ".indexOn": ["ts"],
  "$id": {
    ".write": "(!data.exists() && newData.child('status').val() === 'pendiente') || (auth != null && auth.uid === 'TU_UID')"
  }
}
```

Qué hacen estas reglas:
- **Nadie más puede leer los pedidos** (tienen nombre, celular y dirección de tus clientes). Solo tú, con tu correo y clave.
- La página pública solo puede **crear** pedidos nuevos en estado `pendiente`. No puede cambiar ni borrar pedidos.
- Solo tú puedes marcarlos como entregados o no concretados.

Publica las reglas.

## Límite conocido
Como la página es pública, alguien con conocimientos técnicos podría crear pedidos falsos en estado `pendiente`.
No puede ver ni cambiar los tuyos. Si aparece uno que no llegó por WhatsApp, márcalo ❌.
