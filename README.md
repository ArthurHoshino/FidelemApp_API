# API Backend para o aplicativo de fidelidade de clientes FidelemApp

## Projeto Extensionista desenvolvido em conjunto com o Centro Universitário Eurípides de Marília (UNIVEM)

### 💡 Objetivo e motivação do projeto
Este projeto surgiu com o objetivo de auxiliar pequenas e médias empresas que trabalham com compra e venda de mercadorias e gostariam de implementar um sistema de fidelização do cliente, oferecendo métodos de pagamento mais flexíveis e sistema de pontos ao realizar compras, o famoso cashback 💵.

### 🔨 Tecnologias utilizadas
* Node.JS
* Express.JS
* PostgreSQL
* Docker
* WSL

### ⚙️ Como executar
Clone o repositório para a sua pasta desejada e entre na pasta gerada. Recomendamos o uso do WSL para rodar o projeto em um ambiente Linux:
```shell
git clone https://github.com/ArthurHoshino/FidelemApp_API.git

cd FidelemApp_API
```

Com isso, instale as dependências (o package.json se encontra dentro da pasta api):
```shell
cd api

npm install
```

Mude o arquivo `.env.example` para os valores do seu ambiente e com o Docker habilitado, rode o seguinte comando para subir os containeres necessários (o arquivo de comandos Makefile se encontra na raiz do projeto):
```shell
cd ../

make up
```

Dessa forma tanto o serviço Backend quanto o de banco de dados devem ser executados juntos. Para garantir que tudo está funcionando, rode o seguinte comando no seu terminal (utilize os dados que você definiu no seu `.env` caso esteja diferente do exemplo):
```shell
curl http://localhost:3000
```

Isso deve mostrar a seguinte mensagem: `{"message":"API FidelemApp rodando!"}`

Para acessar a api pelo aplicativo FideleApp, é necessário trocar o valor da variável `baseUrl` no arquivo `web_client.dart` com o endereço IPv4 da sua rede e ter o firewall configurado para receber requisições externas, pois o seu dispositvo móvel o qual possui o aplicativo instalado é externo ao local do equipamento que está rodando o servidor.

#### Outros comandos
| Descrição | Comando |
| :-------- | ------: |
| Para encerrar a execução do projeto | `make down` |
| Para verificar os logs dos containers | `make logs` |
| Para verificar os logs do container da api | `make logs-api` |
| Para verificar os logs do container do banco | `make logs-db` |

### 🧑‍💻 Integrantes
* [Arthur Osaka Hoshino](https://github.com/ArthurHoshino)
* [Bruno Koji Nakao](https://github.com/brunokojota)
* [Fernando Manso Isaac](https://github.com/Fernando-MI)
* [Guilherme Silva Piantamar](https://github.com/gpiantamar)
* [João Henrique Guimarães da Silva](https://github.com/joao591)
* [Nikolas Dalton Perassoli Varella](https://github.com/Nikolas-Dalton)
