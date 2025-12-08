## 💡 Objetivo
O objetivo é deixar documentado alguns detalhes de implementação que possam gerar dúvidas no momento de utilizar a api para criar uma nova tela ou funcionalidade.

## 🧑‍💻 Questões de implementação
Todas as rotas precisam, de uma forma ou de outra, do ID da empresa que aquele registro pertence, seja por conter uma coluna com essa informação, para fazer algum relacionamento com uma tabela que tenha essa informação ou simplesmente para fazer o registro de auditoria/exceção.</br>
Rotas que possuem a informação de empresa vão receber essa informação no JSON com o nome correto da coluna. Tabelas que utilizam apenas para fazer um relacionamento ou para registro de auditoria/exceção recebem com o nome `empresa`.

### 📨 Multipart Request
A estrutura da requisição para inserir uma imagem no banco é diferente da utilizada para salvar um registro comum como um novo cadastro de usuário, por exemplo. Ao invés do corpo da requisição possuir apenas um objeto JSON ele irá conter mais de uma informação, pois precisamos enviar uma imagem, a empresa e o produto que aquela imagem estará atralada.

### 📥 Recuperando imagens
Ao fazer uma busca dos produtos, a query irá retornar as informações do produto e também das imagens, mesmo que o produot não possua imagens, dessa forma não será necessário realizar duas requisições para recuperar o produto + imagem. Entretanto, para inserir/atualizar um produto e imagem será necessário fazer em duas requisições para separar as operações.</br>
O backend irá entregar para o frontend uma imagem em string convertida para base64 que será necessário traduzir para bytes novamente antes de mostrar ao usuário.