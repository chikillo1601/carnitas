# Control de stock de sándwiches (opcional)

**Hoy los sándwiches no tienen límite.** En `index.html`, dentro de `CARNITAS_CONFIG`, está así:

```js
STOCK_ENABLED: false,
```

Con `false` la página no muestra ni descuenta stock y **no usa Firebase**. Esta guía solo hace falta si algún día
quieres volver a limitar los sándwiches (por ejemplo, para un lanzamiento con unidades contadas).

## Cómo funciona cuando está activado (`STOCK_ENABLED: true`)

Hay dos contadores: sándwiches de **res** y de **cerdo**. Cada pedido descuenta de su proteína, sin importar si es
Texas BBQ, Bistek o Azteca. Las malteadas, los adicionales y las gaseosas no descuentan stock.

- El cliente ve el **total** de sándwiches que quedan (res + cerdo). La proteína que se agota se marca "· agotado".
- El stock baja **una vez**, cuando el cliente toca "Enviar pedido por WhatsApp".
- Si dos clientes piden la última unidad al mismo tiempo, solo uno se la lleva; al otro se le ajusta el pedido.
- Si Firebase no responde, el pedido sale igual, pero el mensaje de WhatsApp trae la línea
  `⚠️ Stock sin descontar (descontar a mano): …` para que lo restes tú.
- Si un pedido se envía pero no se concreta, repón las unidades a mano en la consola de Firebase.

## Para activarlo

### 1. Reglas (pestaña **Reglas** de Realtime Database → Publicar)

```json
{
  "rules": {
    "stock": {
      ".read": true,
      "res": {
        ".write": "newData.isNumber() && newData.val() >= 0 && newData.val() <= data.val()"
      },
      "cerdo": {
        ".write": "newData.isNumber() && newData.val() >= 0 && newData.val() <= data.val()"
      }
    }
  }
}
```

Las reglas permiten que cualquiera **lea** el stock y que solo se pueda **bajar** (nunca dejarlo en negativo).
Para subirlo o reponerlo, lo editas tú a mano desde la consola de Firebase.

### 2. Datos (pestaña **Datos**)

```json
{
  "stock": {
    "res": 5,
    "cerdo": 18
  }
}
```

Si existe un nodo `ribs` (de la versión anterior con costillas), puedes borrarlo.

### 3. Configuración en `index.html`

```js
STOCK_ENABLED: true,
STOCK_DB_URL: "https://carnitas-7aafe-default-rtdb.firebaseio.com",
```

## Límite conocido

Como la página es pública, alguien con conocimientos técnicos podría bajar el stock a 0 a propósito.
No puede subirlo ni ver datos de clientes (esos solo viajan por WhatsApp). Si pasa, lo repones en la consola.
