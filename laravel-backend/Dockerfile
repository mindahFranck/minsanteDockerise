# =============================================================================
# API Health FOSA (Laravel 11) — PHP 8.3 + Apache
# Aucune migration n'est exécutée : la base provient du dump existant.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: dépendances Composer (sans dev)
# -----------------------------------------------------------------------------
FROM composer:2 AS vendor

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist \
      --no-interaction --ignore-platform-reqs

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-scripts

# -----------------------------------------------------------------------------
# Stage 2: runtime
# -----------------------------------------------------------------------------
FROM php:8.3-apache

RUN apt-get update && apt-get install -y --no-install-recommends \
      libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libicu-dev libxml2-dev curl \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql zip gd intl bcmath exif opcache \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/vhost.conf /etc/apache2/sites-available/000-default.conf
RUN a2enmod rewrite headers

WORKDIR /var/www/html
COPY --from=vendor --chown=www-data:www-data /app /var/www/html

RUN mkdir -p storage/app/public storage/framework/cache storage/framework/sessions \
      storage/framework/views storage/logs bootstrap/cache \
    && find app routes config bootstrap -name '*.php' -print0 | xargs -0 -n1 php -l > /dev/null \
    && php artisan package:discover --ansi \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/app-entrypoint
RUN chmod +x /usr/local/bin/app-entrypoint

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fs http://localhost/api/health/live || exit 1

ENTRYPOINT ["app-entrypoint"]
CMD ["apache2-foreground"]
