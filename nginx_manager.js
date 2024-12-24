const { execSync, spawnSync } = require('child_process');
const inquirer = require('inquirer');
const fs = require('fs');
const chalk = require('chalk');
const figlet = require('figlet');
const path = require('path');

// Вспомогательная функция для выполнения команд в терминале
function executeCommand(command) {
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red(`Ошибка при выполнении команды: ${error.message}`));
  }
}

// Установить Nginx на Debian
function installNginx() {
  console.log(chalk.cyan('Устанавливаем Nginx...'));
  executeCommand('sudo apt update');
  executeCommand('sudo apt install -y nginx');
  console.log(chalk.green('Nginx успешно установлен.'));
}

// Резервное копирование конфигураций Nginx
function backupNginxConfigs() {
  const backupDir = path.join(__dirname, 'nginx_backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.tar.gz`);

  console.log(chalk.cyan('Создаем резервную копию конфигураций Nginx...'));
  executeCommand(`sudo tar -czf ${backupPath} /etc/nginx`);
  console.log(chalk.green(`Резервная копия создана: ${backupPath}`));
}

// Установить SSL через Let's Encrypt (вызывается внутри configureNginx)
async function setupLetsEncrypt(serverName) {
  console.log(chalk.cyan('Устанавливаем Certbot для автоматической настройки SSL...'));
  executeCommand('sudo apt update');
  executeCommand('sudo apt install -y certbot python3-certbot-nginx');

  console.log(chalk.cyan(`Настраиваем SSL для ${serverName}...`));
  executeCommand(`sudo certbot --nginx -d ${serverName}`);
  console.log(chalk.green('SSL успешно настроен.'));
}

// Настройка Nginx (примерная логика)
async function configureNginx() {
  // Спросим у пользователя, нужен ли ему SSL и домен
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'needSSL',
      message: 'Хотите настроить SSL через Let\'s Encrypt?',
      default: true,
    },
    {
      type: 'input',
      name: 'serverName',
      message: 'Укажите ваш домен (например, example.com):',
      when: (ans) => ans.needSSL,
    },
  ]);

  // Пример настройки Nginx (можно расширить)
  console.log(chalk.cyan('Проверяем синтаксис Nginx...'));
  executeCommand('sudo nginx -t');

  // Применим изменения (если какие-то были)
  console.log(chalk.cyan('Перезапускаем Nginx...'));
  executeCommand('sudo systemctl reload nginx');

  // Если пользователь хочет настроить SSL
  if (answers.needSSL && answers.serverName) {
    await setupLetsEncrypt(answers.serverName);
  } else {
    console.log(chalk.green('Настройка Nginx завершена без SSL.'));
  }
}

// Пример настройки Firewall (UFW)
function setupFirewall() {
  console.log(chalk.cyan('Настраиваем firewall (UFW)...'));
  // Проверим, установлен ли ufw
  executeCommand('sudo apt-get update');
  executeCommand('sudo apt-get install -y ufw');

  // Разрешим нужные порты
  executeCommand('sudo ufw allow 22');   // SSH (пример)
  executeCommand('sudo ufw allow 80');   // HTTP
  executeCommand('sudo ufw allow 443');  // HTTPS

  // Включим ufw
  try {
    executeCommand('sudo ufw enable');
  } catch (error) {
    console.log(chalk.yellow('UFW, возможно, уже включён или требует дополнительной настройки.'));
  }
  console.log(chalk.green('Firewall (UFW) настроен.'));
}

// Генерация конфигурации для Load Balancer
async function configureLoadBalancer() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'upstreamName',
      message: 'Введите имя upstream группы (например, backend):',
      default: 'backend',
    },
    {
      type: 'input',
      name: 'serverList',
      message: 'Введите список серверов через запятую (например, 192.168.0.1:8080,192.168.0.2:8080):',
    },
  ]);

  const upstreamConfig = `upstream ${answers.upstreamName} {
${answers.serverList.split(',').map(server => `  server ${server.trim()};`).join('\n')}
}`;

  const loadBalancerConfig = `
server {
  listen 80;

  location / {
    proxy_pass http://${answers.upstreamName};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}`;

  console.log(chalk.cyan('Создаем конфигурацию Load Balancer...'));
  const configPath = `/etc/nginx/conf.d/load_balancer.conf`;
  fs.writeFileSync(configPath, `${upstreamConfig}\n\n${loadBalancerConfig}`);
  executeCommand('sudo nginx -t');
  executeCommand('sudo systemctl reload nginx');
  console.log(chalk.green('Конфигурация Load Balancer успешно применена.'));
}

// Пример оптимизации Nginx (минимальный)
function optimizeNginx() {
  console.log(chalk.cyan('Оптимизируем Nginx...'));
  // Можно, например, внести правки в /etc/nginx/nginx.conf
  // Ниже лишь пример (общепринятые настройки)
  const optimizationConfig = `
worker_processes auto;
events {
  worker_connections 1024;
}
http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;

  # Дополнительные настройки...
  include /etc/nginx/conf.d/*.conf;
}
`;

  // Сохраним старый nginx.conf и запишем новый
  executeCommand('sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup');
  fs.writeFileSync('/tmp/nginx.conf', optimizationConfig); // Запишем во временный файл
  executeCommand('sudo mv /tmp/nginx.conf /etc/nginx/nginx.conf');

  console.log(chalk.cyan('Проверяем синтаксис Nginx...'));
  executeCommand('sudo nginx -t');

  console.log(chalk.cyan('Применяем изменения...'));
  executeCommand('sudo systemctl reload nginx');
  console.log(chalk.green('Оптимизация завершена.'));
}

// Пример диагностики ошибок
function diagnoseErrors() {
  console.log(chalk.cyan('Проводим диагностику...'));

  // Проверим синтаксис
  console.log(chalk.cyan('1) Проверяем синтаксис Nginx...'));
  executeCommand('sudo nginx -t');

  // Посмотрим последние 20 строк логов (пример)
  console.log(chalk.cyan('2) Последние 20 строк error.log:'));
  try {
    const logs = execSync('sudo tail -n 20 /var/log/nginx/error.log');
    console.log(logs.toString());
  } catch (error) {
    console.log(chalk.yellow('Не удалось прочитать /var/log/nginx/error.log.'));
  }

  console.log(chalk.green('Диагностика завершена.'));
}

// Пример настройки GitLab CI/CD
async function setupGitlabCI() {
  // Спросим у пользователя какие-нибудь параметры
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'gitlabProjectUrl',
      message: 'Введите URL проекта в GitLab:',
    },
    {
      type: 'input',
      name: 'branch',
      message: 'Введите ветку для CI/CD (например, main):',
      default: 'main',
    },
  ]);

  console.log(chalk.cyan('Настраиваем GitLab CI/CD...'));
  // Примерная логика: создаём .gitlab-ci.yml
  const ciContent = `
image: node:latest

stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - echo "Build stage..."

test:
  stage: test
  script:
    - echo "Test stage..."

deploy:
  stage: deploy
  script:
    - echo "Deploy stage..."
`;
  fs.writeFileSync('.gitlab-ci.yml', ciContent);
  console.log(chalk.green(`Файл .gitlab-ci.yml создан. Загрузите его в репозиторий ${answers.gitlabProjectUrl} (ветка ${answers.branch}).`));
}

// Генерация Docker Compose
async function generateDockerCompose() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Введите имя проекта для Docker Compose:',
      default: 'nginx_project',
    },
    {
      type: 'input',
      name: 'nginxImage',
      message: 'Введите версию образа Nginx (например, nginx:latest):',
      default: 'nginx:latest',
    },
    {
      type: 'input',
      name: 'ports',
      message: 'Введите порты для проброса (например, 80:80,443:443):',
      default: '80:80,443:443',
    },
  ]);

  const composeContent = `version: '3.8'
services:
  nginx:
    image: ${answers.nginxImage}
    container_name: ${answers.projectName}_nginx
    ports:
${answers.ports.split(',').map(port => `      - "${port.trim()}"`).join('\n')}
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
`;

  fs.writeFileSync('docker-compose.yml', composeContent);
  console.log(chalk.green('Файл docker-compose.yml успешно создан.'));
}

// Команда help
function displayHelp() {
  console.log(chalk.blue(figlet.textSync('Nginx Manager Help')));
  console.log(`
${chalk.cyan('Доступные команды:')}

1. install Nginx - Установить Nginx на сервере.
2. backup Nginx Configs - Создать резервную копию конфигураций.
3. setup Nginx - Настроить сервер и SSL.
4. setup Firewall - Настроить фаервол.
5. configure Load Balancer - Настроить балансировку нагрузки.
6. optimize Nginx - Оптимизировать производительность.
7. diagnose Errors - Провести диагностику ошибок.
8. setup GitLab CI/CD - Настроить интеграцию с GitLab.
9. generate Docker Compose - Создать файл docker-compose.yml для проекта.
10. run Nginx - Запустить Nginx.
11. stop Nginx - Остановить Nginx.
12. get status Nginx - Проверить статус Nginx.
13. exit - Выйти из программы.
`);
}

// Запустить Nginx
function startNginx() {
  console.log(chalk.cyan('Запускаем Nginx...'));
  executeCommand('sudo systemctl start nginx');
  console.log(chalk.green('Nginx запущен.'));
}

// Остановить Nginx
function stopNginx() {
  console.log(chalk.cyan('Останавливаем Nginx...'));
  executeCommand('sudo systemctl stop nginx');
  console.log(chalk.green('Nginx остановлен.'));
}

// Проверить статус Nginx
function nginxStatus() {
  console.log(chalk.cyan('Проверяем статус Nginx...'));
  executeCommand('sudo systemctl status nginx');
}

// Главное меню
async function mainMenu() {
  console.log(chalk.blue(figlet.textSync('Nginx Manager')));
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Что вы хотите сделать?',
      choices: [
        'install Nginx',
        'backup Nginx Configs',
        'setup Nginx',
        'setup Firewall',
        'configure Load Balancer',
        'optimize Nginx',
        'diagnose Errors',
        'setup GitLab CI/CD',
        'generate Docker Compose',
        'display Help',
        'run Nginx',
        'stop Nginx',
        'get status Nginx',
        'exit',
      ],
    },
  ]);

  switch (action) {
    case 'install Nginx':
      installNginx();
      break;
    case 'backup Nginx Configs':
      backupNginxConfigs();
      break;
    case 'setup Nginx':
      await configureNginx();
      break;
    case 'setup Firewall':
      setupFirewall();
      break;
    case 'configure Load Balancer':
      await configureLoadBalancer();
      break;
    case 'optimize Nginx':
      optimizeNginx();
      break;
    case 'diagnose Errors':
      diagnoseErrors();
      break;
    case 'setup GitLab CI/CD':
      await setupGitlabCI();
      break;
    case 'generate Docker Compose':
      await generateDockerCompose();
      break;
    case 'display Help':
      displayHelp();
      break;
    case 'run Nginx':
      startNginx();
      break;
    case 'stop Nginx':
      stopNginx();
      break;
    case 'get status Nginx':
      nginxStatus();
      break;
    case 'exit':
      console.log(chalk.green('Выход...'));
      process.exit(0);
  }

  await mainMenu();
}

// Запуск главного меню
mainMenu().catch((error) => console.error(chalk.red(`Ошибка: ${error.message}`)));
