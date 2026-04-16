# Fichar API - Guía de Endpoints Oficial
Base URL: `http://localhost:8000/api/`

---

## 🧍 Personas y Accesos (`/usuarios/`)

### 1. Perfil del Empleado Logueado
- **Endpoint:** `GET /usuarios/me/`
- **Permiso:** Cualquier usuario con token.
- **Respuesta:**
  ```json
  {
    "id": 1,
    "username": "carlos",
    "nombre": "Carlos Perez",
    "empresa": 1,
    "is_active": true,
    "groups": ["Empleado"],
    "configuracion_laboral": {
      "valor_hora": "1500.00",
      "turno_preferido": "Mañana",
      "dias_laborales": [1, 2, 3, 4]
    }
  }
  ```

### 2. Gestión General de Usuarios
- **Endpoints:**
  - `GET /usuarios/` (Obtener Todos)
  - `POST /usuarios/` (Agregar)
  - `PUT /usuarios/{id}/` (Modificar)
- **Permiso:** 🔒 Sólo Admin / RRHH.

### 3. Asignación de RH / Valor Hora
- **Endpoints:**
  - `POST/PUT /usuarios/configuracion/`
- **Formato Requerido:**
  ```json
  {
    "usuario": 1,
    "valor_hora": 2500.50,
    "turno_preferido": "Tarde",
    "dias_laborales": [1, 3, 5]
  }
  ```
- **Permiso:** 🔒 Sólo Admin / RRHH.

---

## ⏱️ Sistema Operativo (`/asistencia/`)

### 1. Fichar (El Reloj)
- **Endpoint:** `POST /asistencia/`
- **Permiso:** 🧑‍🏭 Sólo Empleados. (Los admins pueden hacer `GET` para leer todos).
- **Formato Requerido:**
  ```json
  {
    "empresa": 1,
    "sucursal": 1,
    "tipo_fichada": "entrada", 
    "fecha_hora": "2026-04-14T09:00:00Z"
  }
  ```
  *(El ID del empleado se auto-detecta por el Token. Usar `salida` como tipo para cerrar el día).*

---

## 📅 Grillas y Teoría (`/horarios/`)

### 1. Sistema de Planificación de Turnos
- **Endpoints:**
  - `GET /horarios/` (Buscar grillas)
  - `POST /horarios/` (Asignar Turno a un Trabajador)
  - `PUT /horarios/{id}/`
- **Permiso:** 🔒 Sólo Admin / RRHH.
- **Formato Requerido:**
  ```json
  {
    "empresa": 1,
    "sucursal": 1,
    "empleado": 3,
    "dia": 1,
    "hora_inicio": "09:00:00",
    "hora_fin": "15:00:00"
  }
  ```
- ⚠️ **Manejo de Errores Frontend:** Si el empleado no trabaja ese día, o si ya tiene otro turno asignado en ese horario que genera superposición, recibirás un `HTTP 400 Bad Request` con un Array que explicará el error bajo la clave `["hora_inicio"]` o `["empleado"]`. Listos para pintar en el modal debajo del campo en rojo.

---

## 💵 Recibos y Sueldos (`/sueldos/`)

### 1. Grilla Principal de Liquidaciones
- **Endpoints:**
  - `GET /sueldos/liquidaciones/`
- **Permisos:** 
  - Admin visualiza todos.
  - Empleados visualizan y reciben SÓLO los suyos automáticamente.
- **Respuesta (JSON enriquecido con nuestra lógica):**
  ```json
  {
    "id": 5,
    "empleado": 3,
    "periodo_anio": 2026,
    "periodo_mes": 4,
    "total_horas": "45.50",
    "total_neto": "68500.00",
    "resumen_semanal": {
      "1": { "horas": "10.00", "subtotal": "15000.00" },
      "2": { "horas": "35.50", "subtotal": "53500.00" }
    },
    ...
  }
  ```

### 2. Botón Rojo: Generador Automático de horas
- **Endpoint:** `POST /sueldos/liquidaciones/{id}/generar_detalles/`
- **Permisos:** 🔒 Sólo Admin.
- **Qué hace:** Al apretarlo, el sistema busca las miles de entradas de ese empleado de todo ese mes, las resta, genera el total de horas, y te devuelve inmediatamente como Respuesta el mismo JSON de arriba actualizado y fresquito con el recibo del mes.

### 3. Click sobre la fila (Ver días en Detalle)
- **Endpoint:** `GET /sueldos/detalles/?liquidacion_id=5`
- **Permisos:** Admin accede a todas, Empleado sólo puede consultarlo si esa Liquidación le pertenece.
- **Respuesta (Para listar de Lunes a viernes):**
  ```json
  [
    {
      "fecha": "2026-04-01",
      "horas": "8.50",
      "subtotal": "12750.00",
      "semana": 1,
      "sucursal": 1
    }
  ]
  ```
