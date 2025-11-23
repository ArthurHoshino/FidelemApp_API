# Use uma imagem base leve do Node.js
FROM node:18-alpine

# Defina o diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copie o package.json e package-lock.json
COPY package*.json ./

# Instale as dependências
RUN npm install

# Copie o restante do código da aplicação
# (Vamos usar um volume no docker-compose para /src,
# mas é bom ter isso para 'builds' de produção)
COPY . .

# Expõe a porta que o app vai rodar (definida no .env)
EXPOSE 3000

# Comando padrão para iniciar a app
CMD [ "npm", "start" ]