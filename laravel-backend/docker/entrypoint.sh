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

exec "$@"
