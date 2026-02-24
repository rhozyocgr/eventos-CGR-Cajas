# Gestión de Eventos de Ventas (CGR-Cajas)

Aplicación moderna para la gestión de productos, proveedores y ventas en eventos.

## Requisitos
- Docker y Docker Compose
- Windows 11 (PowerShell recomendado)

## Configuración de Google Login
Para que el login funcione, debes:
1. Ir a [Google Cloud Console](https://console.cloud.google.com/).
2. Crear un proyecto y configurar la pantalla de consentimiento OAuth.
3. Crear credenciales de tipo **ID de cliente de OAuth** (Web Application).
4. Agregar `http://localhost:5173` a los **Orígenes de JavaScript autorizados**.
5. Copiar el Client ID y pegarlo en el archivo `.env` en `GOOGLE_CLIENT_ID`.

## Estructura
- **Backend**: Node.js v20 (Express + Sequelize + MariaDB)
- **Frontend**: React + Vite (Modern Glassmorphism UI)
- **Database**: MariaDB 11.2

## Cómo Ejecutar

1. Clona el repositorio (si no lo has hecho).
2. Asegúrate de que el archivo `.env` tenga las credenciales correctas.
3. Ejecuta el comando:
   ```powershell
   docker-compose up --build
   ```
4. Accede a:
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Características
- Interface **Mobile-First** responsiva.
- Diseño **Glassmorphism** moderno con efectos de desenfosque y gradientes.
- Sincronización automática de base de datos con Sequelize.
- Contenerizado completamente con Docker.

## Mantenimiento de Base de Datos

Se han incluido scripts para facilitar el respaldo y la restauración de la base de datos MariaDB.

### Usando PowerShell (Recomendado en Windows)

**Realizar un backup:**
```powershell
.\scripts\db_manager.ps1 backup
```
*El archivo se guardará en la carpeta `backups/` con un timestamp.*

**Restaurar un backup:**
```powershell
.\scripts\db_manager.ps1 restore -File .\backups\nombre_del_archivo.sql
```

### Usando Bash (Git Bash / WSL)

**Realizar un backup:**
```bash
./scripts/db_manager.sh backup
```

**Restaurar un backup:**
```bash
./scripts/db_manager.sh restore ./backups/nombre_del_archivo.sql
```

