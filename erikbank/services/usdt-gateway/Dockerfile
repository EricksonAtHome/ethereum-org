FROM php:7.4-apache

RUN apt-get update && apt-get install -y \
    libgmp-dev \
    libzip-dev \
    unzip \
    redis-tools \
    && docker-php-ext-install gmp mysqli pdo_mysql \
    && pecl install redis-5.3.7 \
    && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

RUN a2enmod rewrite

WORKDIR /var/www/html
COPY . /var/www/html/

RUN mkdir -p runtime public/upload/qrcode \
    && chmod -R 777 runtime public/upload \
    && cp .env.docker .env \
    && chmod +x docker-entrypoint.sh

COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

ENV REDIS_HOST=upay-redis
ENV REDIS_PORT=6379

EXPOSE 80

ENTRYPOINT ["/var/www/html/docker-entrypoint.sh"]
CMD ["apache2-foreground"]
