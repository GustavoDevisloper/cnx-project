#!/bin/bash
# Script para implantação do projeto na VPS

# Variáveis (ajuste conforme necessário)
APP_DIR="/var/www/app"
DOMAIN="seu-dominio.com"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Iniciando implantação do projeto...${NC}"

# 1. Configuração inicial
echo -e "${YELLOW}Atualizando pacotes...${NC}"
sudo apt-get update
sudo apt-get upgrade -y

# 2. Instalando dependências
echo -e "${YELLOW}Instalando dependências...${NC}"
sudo apt-get install -y nodejs npm nginx certbot python3-certbot-nginx

# 3. Criando diretório da aplicação
echo -e "${YELLOW}Configurando diretório da aplicação...${NC}"
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 4. Copiando arquivos (assume que os arquivos já foram transferidos para a VPS)
echo -e "${YELLOW}Copiando arquivos da aplicação...${NC}"
# Descomente e ajuste se os arquivos estiverem em outra localização
# cp -r ./dist/* $APP_DIR/
# cp .env.production $APP_DIR/.env

# 5. Instalando dependências do projeto
echo -e "${YELLOW}Instalando dependências do projeto...${NC}"
cd $APP_DIR
npm install --production

# 6. Configurando Nginx
echo -e "${YELLOW}Configurando Nginx...${NC}"
sudo tee $NGINX_CONF > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }

    # Regras de cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
EOF

# 7. Ativando configuração do Nginx
echo -e "${YELLOW}Ativando site no Nginx...${NC}"
sudo ln -s $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# 8. Configurando HTTPS
echo -e "${YELLOW}Configurando HTTPS com Let's Encrypt...${NC}"
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email seu-email@exemplo.com

# 9. Finalização
echo -e "${GREEN}Implantação concluída!${NC}"
echo -e "Seu aplicativo deve estar disponível em: https://$DOMAIN"
echo -e "Se encontrar problemas, verifique os logs do Nginx: sudo journalctl -u nginx"
echo -e "Ou os logs da aplicação em: $APP_DIR/logs (se aplicável)" 