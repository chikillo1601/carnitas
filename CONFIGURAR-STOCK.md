# Conectar el stock compartido (Firebase)

Sin esto, el stock solo baja en el celular de cada cliente. Con esto, baja para todos al mismo tiempo.
Es gratis (plan Spark) y toma unos 10 minutos.

## 1. Crear la base de datos

1. Entra a https://console.firebase.google.com con tu cuenta de Google.
2. **Agregar proyecto** → ponle un nombre (ej. `carnitas`) → puedes desactivar Google Analytics.
3. En el menú izquierdo: **Compilación → Realtime Database → Crear base de datos**.
   Elige la ubicación que prefieras y **inicia en modo bloqueado**.

## 2. Pegar las reglas

En la pestaña **Reglas**, borra lo que haya, pega esto y toca **Publicar**:

```json
{
  "rules": {
    "stock": {
      ".read": true,
      "sandwiches": {
        ".write": "newData.isNumber() && newData.val() >= 0 && newData.val() <= data.val()"
      },
      "ribs": {
        ".write": "newData.isNumber() && newData.val() >= 0 && newData.val() <= data.val()"
      }
    }
  }
}
```

Estas reglas permiten que cualquiera **lea** el stock y que solo se pueda **bajar** (nunca dejarlo en negativo).
Para subirlo o reponerlo, tú lo editas a mano desde la consola de Firebase (la consola no pasa por las reglas).

## 3. Crear el stock inicial

En la pestaña **Datos**, importa este JSON (menú de tres puntos → **Importar JSON**) o créalo a mano:

```json
{
  "stock": {
    "sandwiches": 25,
    "ribs": 4
  }
}
```

## 4. Pegar la URL en la página

En la pestaña **Datos**, arriba, está la URL de la base de datos, algo como
`https://carnitas-abc12-default-rtdb.firebaseio.com`.

Pégala en `index.html`, dentro de `CARNITAS_CONFIG`:

```js
STOCK_DB_URL: "https://carnitas-abc12-default-rtdb.firebaseio.com",
```

Sube el cambio y listo.

## Cómo funciona

- El stock baja **una vez**, cuando el cliente toca "Enviar pedido por WhatsApp" (no cuando pagas ni cuando confirmas).
- Si un pedido se envía pero luego no se concreta, repón las unidades a mano en la consola de Firebase.
- Si dos clientes piden la última unidad al mismo tiempo, solo uno se la lleva; al otro se le avisa y se le ajusta el pedido.
- Si Firebase no responde, el cliente igual puede enviar su pedido (no se le niega la venta), pero el stock no se descuenta.

## Límite conocido

Como la página es pública, alguien con conocimientos técnicos podría bajar el stock a 0 a propósito.
No puede subirlo ni ver datos de clientes (esos solo viajan por WhatsApp). Si pasa, lo repones en la consola.
