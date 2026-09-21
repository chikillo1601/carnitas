# Conectar los pedidos de la página con finanzas.html

Cada pedido que un cliente envía en la página se guarda también en tu base de datos de Firebase.
Solo tú, con tu correo y contraseña, puedes leerlos desde `finanzas.html` (pestaña **📥 Pedidos**).
Cuando marcas un pedido como **Entregado**, se suma a tus ventas y baja el inventario.

Los clientes solo pueden **crear** pedidos nuevos: no pueden leer ni modificar nada.

## Pasos (una sola vez, en https://console.firebase.google.com → proyecto `carnitas-7aafe`)

### 1. Crear tu usuario
**Authentication → Comenzar → Método de acceso → Correo electrónico/contraseña → Habilitar.**
Luego pestaña **Users → Agregar usuario**: pon tu correo y una contraseña que solo tú sepas.
Copia el **UID** que aparece en la lista (una cadena larga de letras y números).

### 2. Reglas de la base de datos
**Realtime Database → Reglas.** Agrega el bloque `orders` (cambia `TU_UID` por el UID del paso 1) y **Publicar**.
Si ya tienes un bloque `stock`, déjalo tal cual.

```json
{
  "rules": {
    "orders": {
      ".read": "auth.uid === 'TU_UID'",
      ".write": "auth.uid === 'TU_UID'",
      "$id": {
        ".write": "auth.uid === 'TU_UID' || (!data.exists() && newData.child('status').val() === 'pendiente')",
        ".validate": "newData.hasChildren(['name','total','lines','status','ts']) && newData.child('total').isNumber() && newData.child('total').val() <= 1000000"
      }
    }
  }
}
```

### 3. Clave de API
**Configuración del proyecto (⚙) → General → Tus apps → Clave de API web.**
Si no hay app web, crea una (icono `</>`). Pega la clave en `finanzas.html`:

```js
const API_KEY = 'PEGA_AQUI_TU_API_KEY';
```

La clave de API web de Firebase no es un secreto: la seguridad la dan tu contraseña y las reglas.

### 4. Publicar la página
Sube `index.html` (ya envía los pedidos) al hosting. `finanzas.html` puedes usarlo en tu PC o subirlo también.

## Uso diario
1. Abre `finanzas.html` → **📥 Pedidos** → entra con tu correo y contraseña.
2. Llegan como *pendientes*. Toca **✔ Entregado** cuando lo entregues (o **✕ Cancelar**).
3. Gastos: los sigues anotando en la pestaña **Gastos**.

## Notas
- Un pedido que no se envía por WhatsApp igual queda en la lista: revísalo antes de marcarlo entregado.
- Si alguien manda pedidos falsos, no cuentan hasta que tú los marques como entregados.
- Los datos personales de los clientes (nombre, celular, dirección) solo los ve tu cuenta.
