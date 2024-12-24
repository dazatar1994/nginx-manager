const { execSync, spawnSync } = require('child_process');
const inquirer = require('inquirer');
const fs = require('fs');
const chalk = require('chalk');
const figlet = require('figlet');

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

// Установить SSL через Let's Encrypt
async function setupLetsEncrypt(serverName) {
  console.log(chalk.cyan('Устанавливаем Certbot для автоматической настройки SSL...'));
  executeCommand('sudo apt update');
  executeCommand('sudo apt install -y certbot python3-certbot-nginx');

  console.log(chalk.cyan(`Настраиваем SSL для ${serverName}...`));
  executeCommand(`sudo certbot --nginx -d ${serverName}`);
  console.log(chalk.green('SSL успешно настроен.'));
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
${answers.serverList.split(',').map(server => `  server ${server};`).join('\n')}
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

// Оптимизация производительности Nginx
function optimizeNginx() {
  console.log(chalk.cyan('Оптимизируем производительность Nginx...'));
  const optimizationConfig = `
events {
  worker_connections 1024;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 65;
  types_hash_max_size 2048;
  server_tokens off;
}`;

  const configPath = `/etc/nginx/nginx.conf`;
  fs.appendFileSync(configPath, optimizationConfig);
  executeCommand('sudo nginx -t');
  executeCommand('sudo systemctl reload nginx');
  console.log(chalk.green('Оптимизация завершена.'));
}

// Расширенная диагностика ошибок
function diagnoseErrors() {
  console.log(chalk.cyan('Диагностика ошибок Nginx...'));
  try {
    executeCommand('sudo journalctl -u nginx --since "1 hour ago"');
  } catch {
    console.log(chalk.yellow('Ошибки не найдены или журнал недоступен.'));
  }
}

// Настройка интеграции GitLab CI/CD
async function setupGitlabCI() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'repositoryUrl',
      message: 'Введите URL репозитория GitLab:',
    },
    {
      type: 'input',
      name: 'runnerToken',
      message: 'Введите токен GitLab Runner:',
    },
  ]);

  console.log(chalk.cyan('Настраиваем GitLab CI/CD...'));
  executeCommand('sudo apt update && sudo apt install -y gitlab-runner');
  executeCommand(`sudo gitlab-runner register --non-interactive --url ${answers.repositoryUrl} --registration-token ${answers.runnerToken} --executor shell`);
  console.log(chalk.green('GitLab CI/CD успешно настроен.'));
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
        'setup Nginx',
        'setup Firewall',
        'configure Load Balancer',
        'optimize Nginx',
        'diagnose Errors',
        'setup GitLab CI/CD',
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
