#!/bin/sh
# Démarrage : prépare storage/ (volume) et vide les caches.
# Volontairement AUCUN `php artisan migrate` : le schéma vient du dump de production.
set -e
cd /var/www/html

mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions \
         storage/framework/views storage/logs
chown -R www-data:www-data storage bootstrap/cache

[ -L public/storage ] || ln -sfn ../storage/app/public public/storage

su -s /bin/sh www-data -c "php artisan optimize:clear" || true

# Synchronisation idempotente et NON destructive du schéma (recommandation ImmoSanté) :
# ajoute uniquement les colonnes manquantes via Schema::hasColumn. Ne bloque pas le
# démarrage si la base n'est pas joignable (|| true) — réessayée au prochain boot.
su -s /bin/sh www-data -c "php artisan immosante:sync-schema" || true

exec "$@"
