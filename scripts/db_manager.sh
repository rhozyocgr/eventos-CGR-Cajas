#!/bin/bash

# Obtener la ruta del directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Cargar variables del archivo .env de forma segura
if [ -f "$ROOT_DIR/.env" ]; then
    # Leer el archivo línea por línea para evitar problemas con espacios o caracteres especiales
    while IFS= read -r line || [[ -n "$line" ]]; do
        # Ignorar comentarios y líneas vacías
        if [[ ! "$line" =~ ^# ]] && [[ "$line" == *=* ]]; then
            # Extraer nombre y valor
            name=$(echo "$line" | cut -d'=' -f1 | xargs)
            value=$(echo "$line" | cut -d'=' -f2- | xargs | sed 's/^["'\'']//;s/["'\'']$//')
            export "$name=$value"
        fi
    done < "$ROOT_DIR/.env"
fi

CONTAINER_NAME="event-db"

backup() {
    if [ -z "$DB_NAME" ]; then
        echo -e "\e[31mError: DB_NAME no definido en .env\e[0m"
        exit 1
    fi

    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_DIR="/home/ubuntu/backups"
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"
    
    echo -e "\e[36mIniciando backup de $DB_NAME...\e[0m"
    docker exec $CONTAINER_NAME mariadb-dump -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "\e[32mBackup completado exitosamente: $BACKUP_FILE\e[0m"
    else
        echo -e "\e[31mError al realizar el backup\e[0m"
    fi
}

restore() {
    if [ -z "$1" ]; then
        echo -e "\e[31mError: Debe especificar un archivo. Uso: ./db_manager.sh restore <archivo.sql>\e[0m"
        exit 1
    fi
    
    RESTORE_FILE=$1
    if [ ! -f "$RESTORE_FILE" ]; then
        # Intentar ruta relativa a la raíz
        if [ -f "$ROOT_DIR/$RESTORE_FILE" ]; then
            RESTORE_FILE="$ROOT_DIR/$RESTORE_FILE"
        else
            echo -e "\e[31mError: Archivo no encontrado: $RESTORE_FILE\e[0m"
            exit 1
        fi
    fi

    echo -e "\e[36mRestaurando $DB_NAME desde $(basename "$RESTORE_FILE")...\e[0m"
    cat "$RESTORE_FILE" | docker exec -i $CONTAINER_NAME mariadb -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "\e[32mRestauración completada con éxito.\e[0m"
    else
        echo -e "\e[31mError durante la restauración\e[0m"
    fi
}

case "$1" in
    backup)
        backup
        ;;
    restore)
        restore "$2"
        ;;
    *)
        echo "Uso: $0 {backup|restore <archivo.sql>}"
        exit 1
        ;;
esac
