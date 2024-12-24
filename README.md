# Nginx Manager

**Nginx Manager** — это консольное приложение (CLI), позволяющее упростить настройку Nginx на сервере (Debian/Ubuntu), а также автоматизировать ряд типовых задач: установку, резервное копирование конфигураций, настройку SSL (через Let's Encrypt), балансировку нагрузки, оптимизацию, диагностику ошибок, настройку GitLab CI/CD и т.д.

## Возможности

- **Установка Nginx**  
  Автоматическая установка Nginx (и его зависимостей) на сервер с ОС Debian/Ubuntu.

- **Резервное копирование конфигураций**  
  Создаёт архив с конфигурациями Nginx (/etc/nginx) в директории `nginx_backup` рядом с программой.

- **Настройка Nginx (включая SSL)**  
  - Позволяет произвести базовую настройку конфигурации Nginx.  
  - Устанавливает и настраивает Let's Encrypt для автоматического получения SSL-сертификатов.

- **Настройка Firewall (UFW)**  
  Открытие стандартных портов (80 и 443), включение и базовая конфигурация UFW.

- **Настройка Load Balancer**  
  Генерирует файл конфигурации для балансировки нагрузки (на основе заданного списка серверов).

- **Оптимизация Nginx**  
  Применяет базовые «best practices» настройки (worker_processes auto, keepalive и т.п.).

- **Диагностика ошибок**  
  Проверяет синтаксис конфигураций Nginx и показывает последние 20 строк из журнала ошибок `/var/log/nginx/error.log`.

- **Настройка GitLab CI/CD**  
  Генерирует файл `.gitlab-ci.yml` с примерным конвейером для Node.js (можно адаптировать под свои нужды).

- **Генерация Docker Compose**  
  Создаёт `docker-compose.yml` с контейнером на базе Nginx, маппингом портов и монтированием локального `nginx.conf` внутрь контейнера.

- **Запуск, остановка и проверка статуса Nginx**  
  Позволяет запустить/остановить Nginx и посмотреть его статус.

## Установка

1. Убедитесь, что у вас установлен Node.js и npm.  
   Рекомендуемая версия Node.js — не ниже 14.x.

2. Клонируйте репозиторий (или скопируйте файлы приложения к себе на сервер):

   ```bash
   git clone https://github.com/your-username/nginx-manager.git
   ```

3. Перейдите в директорию проекта и установите зависимости:

   ```bash
   cd nginx-manager
   npm install
   ```

4. Убедитесь, что у вас есть права на выполнение `sudo`-команд.  
   Большинство действий (установка пакетов, редактирование конфигов и т.д.) требуют прав суперпользователя.

## Запуск программы

После успешной установки зависимостей запустите программу:

```bash
node index.js
```

Если скрипт назван по-другому, замените `index.js` на нужное имя.

В терминале появится главное меню с вопросом:

```plaintext
Что вы хотите сделать?
```

Далее вам будут предложены действия в формате списка (используйте клавиши вверх/вниз для выбора нужной команды, а затем нажмите Enter).

## Использование

После запуска программы вы увидите список основных команд:

- `install Nginx` — Установить Nginx на сервер.
- `backup Nginx Configs` — Создать резервную копию конфигураций.
- `setup Nginx` — Настроить Nginx (включая установку SSL, если нужно).
- `setup Firewall` — Настроить базовый фаервол (UFW).
- `configure Load Balancer` — Настроить конфигурацию балансировки нагрузки.
- `optimize Nginx` — Применить базовые оптимизационные настройки.
- `diagnose Errors` — Провести диагностику (проверка синтаксиса и логов).
- `setup GitLab CI/CD` — Сгенерировать заготовку `.gitlab-ci.yml`.
- `generate Docker Compose` — Создать `docker-compose.yml` для вашего проекта.
- `display Help` — Показать справку.
- `run Nginx` — Запустить Nginx.
- `stop Nginx` — Остановить Nginx.
- `get status Nginx` — Проверить статус Nginx.
- `exit` — Выйти из программы.

## Примеры использования

- **Установка Nginx**  
  Выберите в меню пункт `install Nginx`. Программа выполнит команды `sudo apt update` и `sudo apt install -y nginx`.

- **Резервное копирование**  
  При выборе `backup Nginx Configs` будет создана папка `nginx_backup` (если её ещё нет) и сжатый архив конфигураций `/etc/nginx`.

- **Настройка SSL**  
  При выборе `setup Nginx` программа спросит, хотите ли вы настраивать Let's Encrypt, а также ваш домен. Затем запустит скрипт, устанавливающий certbot и генерирующий бесплатный сертификат.

- **Настройка балансировки**  
  При выборе `configure Load Balancer` программа попросит указать имя `upstream`-блока (например, `backend`) и список серверов через запятую. Затем создаст новый файл `/etc/nginx/conf.d/load_balancer.conf` с рабочей конфигурацией.

- **Оптимизация**  
  `optimize Nginx` заменит ваш `/etc/nginx/nginx.conf` на версию с базовыми параметрами для более эффективной работы.

- **Диагностика**  
  `diagnose Errors` запустит `nginx -t` для проверки синтаксиса, а также выведет последние 20 строк из `error.log`.

## Важно

- Скрипт предполагает, что у вас Debian/Ubuntu и установлен `sudo`.
- Если вы используете другую ОС, возможно, нужно изменить команды установки пакетов (`apt-get` на `yum` и т.д.).
- Если у вас ограниченные права, то может потребоваться выполнять команды через root или настраивать `sudo`.

## Лицензия

Данный проект может распространяться на условиях MIT License (при необходимости создайте файл `LICENSE` в корне проекта).

## Авторы

[Ваше имя или ник на GitHub]  
Будем рады принять ваши Pull Request’ы и улучшения!
