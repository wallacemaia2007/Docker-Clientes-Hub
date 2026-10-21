# Docker Clientes Hub

Aplicação demonstrativa de cadastro de clientes, criada pela **Maiawall** para apoiar o **Minicurso de Docker & Compose na prática da TechnoMonte, na Universidade Federal de Uberlândia (UFU)**. A interface segue a identidade visual do [Maiawall Cursos](https://github.com/wallacemaia2007/Maiawall-Courses), com a marca, paleta vermelha e hero escuro; acompanhe também o [LinkedIn do instrutor](https://www.linkedin.com/in/wallacemaia-dev/).

A proposta é aprender Docker construindo e executando uma aplicação pequena, mas completa: um frontend, uma API e um banco de dados, cada um em seu próprio serviço/contêiner. Ao longo da prática, o projeto permite observar Dockerfiles, build de imagens, rede entre serviços, publicação de portas, volume persistente, healthchecks, logs e ciclo de vida via Docker Compose.

> Projeto didático para uso local em aula. As credenciais e configurações incluídas são apenas para demonstração e não devem ser reutilizadas em produção.

## Marca e autoria

A logo oficial do Maiawall Cursos está em `frontend/public/assets/brand/logo-light.png` e é servida pelo frontend. A interface combina a paleta vermelha e branca da Maiawall (`#a6273f`, `#861d32`, branco) com o hero escuro inspirado nas superfícies `#202226` e `#181a1d` do site de cursos.

- **Instrutor:** [LinkedIn de Wallace Maia](https://www.linkedin.com/in/wallacemaia-dev/)
- **Marca:** [maiawall.com](https://maiawall.com)
- **Plataforma de cursos:** [Maiawall Cursos no GitHub](https://github.com/wallacemaia2007/Maiawall-Courses)

## O que a aplicação faz

A interface web permite cadastrar, listar, editar e excluir clientes. Cada cliente tem nome e e-mail. O frontend envia as requisições para a API, e a API persiste os dados no PostgreSQL.

## Arquitetura

```
Navegador
   │ http://localhost:8080
   ▼
frontend (Vite + Nginx) ── /api ──► backend (Node.js + Express)
                                          │
                                          │ rede Docker: db:5432
                                          ▼
                                    db (PostgreSQL)
                                          │
                                          ▼
                               volume nomeado persistente
```

O `compose.yaml` define os três serviços e os liga à rede bridge `docker_clientes_network`:

| Serviço | Tecnologia | Função | Acesso publicado no host |
| --- | --- | --- | --- |
| `frontend` | Vite, Nginx | Interface web e proxy das chamadas `/api` para o backend | `http://localhost:8080` |
| `backend` | Node.js, Express, `pg` | API REST de clientes e acesso ao banco | Não publica porta no host; fica acessível pela rede Compose |
| `db` | PostgreSQL 16 Alpine | Armazenamento relacional dos clientes | `localhost:5432` |

O Nginx recebe o tráfego do navegador e encaminha `/api/` para `backend:3000`. O nome `backend` é resolvido pelo DNS interno do Compose. Da mesma forma, o backend usa `db` como host do banco. Assim, os serviços conversam pela rede Docker sem precisar conhecer endereços IP fixos.

Os dados do PostgreSQL ficam no volume nomeado `docker_clientes_postgres_data`. Remover os contêineres não remove esse volume por padrão.

## Tecnologias e estrutura

- **Frontend:** JavaScript, Vite e CSS; compilado em arquivos estáticos e servido pelo Nginx.

- **Backend:** Node.js 22, Express e `pg`.

- **Banco:** PostgreSQL 16 Alpine.

- **Orquestração:** Docker Compose v2.

```
.
├── compose.yaml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── server.js
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.js
        └── style.css
```

## Pré-requisitos

- Docker instalado e em execução.

- Docker Compose v2 (`docker compose`, com espaço entre `docker` e `compose`).

- Portas livres no host: `8080` para o frontend e, opcionalmente, `5432` para o PostgreSQL.

Confira as versões:

```bash
docker --version
docker compose version
```

## Executar a aplicação

Clone o repositório e entre na pasta:

```bash
git clone https://github.com/wallacemaia2007/Docker-Clientes-Hub.git
cd Docker-Clientes-Hub
```

Faça o build das imagens e suba os serviços:

```bash
docker compose up --build
```

Na primeira execução, o Docker pode levar algum tempo para baixar as imagens base e instalar dependências. Quando os serviços estiverem prontos, abra [http://localhost:8080](http://localhost:8080).

Para executar em segundo plano:

```bash
docker compose up --build -d
```

## Roteiro de exploração para o minicurso

Os comandos abaixo ajudam a relacionar os conceitos vistos no minicurso com os recursos concretos criados pelo Compose.

### 1. Ler e validar a configuração

```bash
cat compose.yaml
docker compose config
```

Observe os serviços, o bloco `build`, as variáveis de ambiente, as portas, dependências, healthchecks, rede e volume. `docker compose config` mostra a configuração consolidada interpretada pelo Compose.

### 2. Ver serviços e contêineres

```bash
docker compose ps
docker ps
docker compose top
```

O Compose cria contêineres a partir dos serviços declarados. Os nomes podem incluir o nome do projeto, por isso prefira comandos `docker compose` quando estiver trabalhando com esta aplicação.

### 3. Acompanhar logs

```bash
docker compose logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f db
```

Use `Ctrl+C` para deixar de acompanhar os logs. Se estiver em primeiro plano com `docker compose up`, `Ctrl+C` também interrompe essa execução.

### 4. Inspecionar imagens

```bash
docker compose images
docker image ls
```

O serviço `db` usa a imagem oficial `postgres:16-alpine`. Os serviços `backend` e `frontend` são construídos a partir dos Dockerfiles locais.

### 5. Inspecionar a rede

```bash
docker network ls
docker network inspect docker_clientes_network
```

Os três serviços são ligados à mesma rede bridge definida no Compose. Dentro dessa rede, o backend acessa o banco por `db:5432`, e o Nginx encaminha chamadas para `backend:3000`. Esses nomes são nomes de serviço e funcionam como nomes DNS internos; não são endereços que o navegador do host deve usar.

### 6. Inspecionar o volume e os dados

```bash
docker volume ls
docker volume inspect docker_clientes_postgres_data
docker compose exec db psql -U app -d clientes_db
```

No prompt do PostgreSQL, consulte os dados:

```sql
SELECT id, nome, email, criado_em FROM clientes ORDER BY id;
```

Saia do `psql` com `\q`. O volume desacopla os dados do ciclo de vida do contêiner do banco.

### 7. Entrar nos contêineres

```bash
docker compose exec backend sh
docker compose exec frontend sh
docker compose exec db sh
```

Use `exit` para sair do shell. A imagem final do frontend é baseada em Nginx; o build do Vite ocorre numa etapa anterior do Dockerfile e não precisa estar presente na imagem final.

### 8. Testar a API

A API não publica diretamente a porta `3000` no host. Para os exemplos abaixo, use o endereço do frontend, que encaminha `/api` ao backend:

```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/clientes
```

Criar um cliente:

```bash
curl -X POST http://localhost:8080/api/clientes \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Souza","email":"ana@example.com"}'
```

Atualizar, usando o `id` retornado pela criação:

```bash
curl -X PUT http://localhost:8080/api/clientes/1 \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Souza Lima","email":"ana.lima@example.com"}'
```

Consultar um cliente:

```bash
curl http://localhost:8080/api/clientes/1
```

Excluir:

```bash
curl -i -X DELETE http://localhost:8080/api/clientes/1
```

## Endpoints

Todos os endpoints começam com `/api`. A URL de teste no host é `http://localhost:8080`.

| Método | Rota | Descrição | Respostas relevantes |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Verifica a API e a conexão com o PostgreSQL | `200` conectado; `503` sem conexão com o banco |
| `GET` | `/api/clientes` | Lista clientes, do mais recente para o mais antigo | `200` |
| `GET` | `/api/clientes/:id` | Busca um cliente pelo ID | `200`, `404` |
| `POST` | `/api/clientes` | Cadastra cliente | `201`, `400`, `409` |
| `PUT` | `/api/clientes/:id` | Atualiza nome e e-mail | `200`, `400`, `404`, `409` |
| `DELETE` | `/api/clientes/:id` | Exclui cliente | `204`, `404` |

O corpo esperado para `POST` e `PUT` é JSON, por exemplo:

```json
{
  "nome": "Ana Souza",
  "email": "ana@example.com"
}
```

Nome e e-mail são obrigatórios, o formato do e-mail é validado e o banco exige e-mails únicos.

## O que observar nos Dockerfiles

### `backend/Dockerfile`

- `FROM node:22-alpine`: seleciona uma imagem base Node.js compacta.

- `WORKDIR /app`: define o diretório de trabalho no contêiner.

- `COPY package*.json` antes do restante do código: separa a camada de dependências para favorecer o cache do build.

- `RUN npm install --omit=dev`: instala as dependências necessárias em execução.

- `COPY --chown=node:node` e `USER node`: executa a aplicação sem usar root dentro do contêiner.

- `EXPOSE 3000`: documenta a porta usada pelo processo; não publica a porta no host por si só.

- `CMD`: define o comando padrão para iniciar a API.

### `frontend/Dockerfile`

É um Dockerfile com múltiplas etapas (*multi-stage build*):

1. A etapa `build`, baseada em Node, instala as dependências e executa `npm run build`.

1. A etapa final, baseada em Nginx, recebe apenas os arquivos estáticos gerados e a configuração do proxy.

Isso demonstra que ferramentas necessárias para compilar a aplicação podem ficar fora da imagem final de execução.

## O que observar no Compose

- **`services`** organiza os componentes da aplicação.

- **`build.context`** aponta para as pastas que contêm os Dockerfiles do backend e do frontend.

- **`image`** usa a imagem publicada do PostgreSQL para o serviço `db`.

- **`ports`** publica `8080:80` para o navegador e `5432:5432` para facilitar o acesso local ao PostgreSQL. A API não publica sua porta.

- **`environment`** configura a conexão da API com o banco e inicializa o PostgreSQL.

- **`depends_on`**** com ****`condition: service_healthy`** espera o healthcheck do serviço dependente passar antes de iniciar o próximo serviço.

- **`healthcheck`** verifica a disponibilidade do PostgreSQL e da API.

- **`networks`** conecta os serviços à rede privada criada para a aplicação.

- **`volumes`** mantém os arquivos de dados do banco fora do ciclo de vida do contêiner.

- **`restart: unless-stopped`** permite que o Docker reinicie os serviços em algumas situações de falha.

> `EXPOSE` no Dockerfile é documentação da porta do contêiner. A publicação para o host é feita com `ports` no Compose.

## Build e ciclo de vida

```bash
# Construir (ou reconstruir) as imagens sem iniciar os serviços
docker compose build

# Construir e iniciar
docker compose up --build

# Iniciar em segundo plano
docker compose up -d

# Ver estado e healthchecks
docker compose ps

# Parar/remover contêineres e a rede do projeto; preservar o volume
docker compose down

# Remover também o volume do banco: APAGA os dados persistidos
docker compose down -v
```

Use `docker compose down -v` somente quando quiser reiniciar a demo sem os dados cadastrados. A opção `-v` remove volumes associados ao projeto e, portanto, é destrutiva para os dados armazenados neles.

## Exercícios sugeridos para a prática

1. Suba a aplicação e identifique quais imagens são baixadas e quais são construídas localmente.

1. Cadastre um cliente pela interface e encontre a linha correspondente no PostgreSQL.

1. Pare e remova os contêineres com `docker compose down`, suba novamente e verifique se os dados continuam no volume.

1. Remova o volume com `docker compose down -v`, suba novamente e compare o estado do banco.

1. Pare o backend e observe o que acontece com a aplicação e com o healthcheck.

1. Altere uma mensagem ou estilo do frontend, reconstrua com `docker compose up --build` e observe o build.

1. Compare o que `EXPOSE` faz com o mapeamento `ports` do Compose.

1. Inspecione a rede e explique por que o backend usa `db` como host em vez de `localhost`.

## Solução de problemas

### A porta 8080 ou 5432 já está em uso

Encerre o processo que ocupa a porta ou ajuste o lado esquerdo do mapeamento em `compose.yaml`. Por exemplo, para abrir o frontend em `8081`, altere `8080:80` para `8081:80`; o acesso passa a ser `http://localhost:8081`.

### O serviço não fica saudável

Confira os logs e o estado dos serviços:

```bash
docker compose ps
docker compose logs db backend frontend
```

O backend depende do healthcheck do PostgreSQL e o frontend depende do healthcheck do backend. A primeira inicialização também pode demorar enquanto as imagens são baixadas e compiladas.

### Quero apagar os dados da demo

```bash
docker compose down -v
```

Isso remove o volume persistente. Só faça isso se não precisar dos dados cadastrados.

## Limitações e segurança

- `POSTGRES_PASSWORD` e `DB_PASSWORD` têm valores fixos e didáticos no arquivo Compose. Não são segredos e não devem ser usados em produção.

- A porta `5432` está publicada no host para apoiar a exploração em aula. Em outros cenários, publique-a apenas quando necessário.

- A tabela é criada pelo backend na inicialização com `CREATE TABLE IF NOT EXISTS`, para manter a demo introdutória simples. Projetos maiores devem considerar migrações versionadas.

- Não há autenticação, autorização, proteção contra abuso ou configuração de produção; a aplicação é voltada para aprendizado local.

- A interface usa uma fonte externa do Google Fonts, com fontes de sistema como alternativa.

## Contexto do minicurso

Este repositório acompanha o **Minicurso de Docker & Compose na prática da TechnoMonte, na UFU**. A aplicação de clientes serve como fio condutor para experimentar o fluxo de desenvolvimento em contêineres e visualizar, na prática, como os componentes de uma aplicação se comunicam e como o Compose os organiza.

## Licença

Nenhuma licença específica foi definida neste repositório. Se a intenção for permitir reutilização, distribuição ou contribuição pública sob termos explícitos, adicione um arquivo `LICENSE` com a licença escolhida.