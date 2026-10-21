# Docker Clientes — demo de Docker Compose

Aplicação didática de cadastro de clientes com três serviços: frontend (Vite compilado e servido por Nginx), API (Node.js + Express) e PostgreSQL. O frontend faz proxy de `/api` para o backend; o navegador não precisa conhecer o endereço interno da API nem o do banco.

## Pré-requisitos

Docker instalado com o plugin Docker Compose v2. No diretório deste projeto:

```bash
docker compose up --build
```

Abra [http://localhost:8080](http://localhost:8080). O primeiro build pode levar alguns minutos por causa do download das imagens e dependências. Para parar, use `Ctrl+C` e depois `docker compose down`.

## O que observar na demo

- `docker compose ps` — três serviços/contêineres e estado dos healthchecks.
- `docker compose logs -f` — logs dos serviços; `docker compose logs -f backend` filtra a API.
- `docker compose images` e `docker image ls` — imagens usadas/construídas.
- `docker compose config` — configuração final interpretada pelo Compose.
- `docker network inspect docker_clientes_network` — rede bridge dedicada; os serviços localizam-se por nome (`backend`, `db`).
- `docker volume inspect docker_clientes_postgres_data` — volume nomeado dos dados do PostgreSQL.
- `docker compose exec db psql -U app -d clientes_db` — entrar no banco; executar `SELECT * FROM clientes;` e sair com `\q`.
- `docker compose exec backend sh` — explorar o filesystem do contêiner da API.

A API não tem porta publicada no host: o frontend chega a ela pela rede Compose. O PostgreSQL é publicado em `localhost:5432` para facilitar a exploração em aula. O browser acede apenas à porta `8080` do frontend.

## Ciclo de vida e persistência

```bash
# Subir em segundo plano
docker compose up -d --build

# Acompanhar o estado
docker compose ps

docker compose logs -f

# Parar e remover contêineres/rede (preserva o volume nomeado)
docker compose down

# Remover também os dados do banco — operação destrutiva!
docker compose down -v
```

`depends_on` com `condition: service_healthy` aguarda o healthcheck do banco antes de iniciar o backend, e o healthcheck da API antes do frontend. Isso ajuda na demo, mas não substitui lógica de retry/reconexão em sistemas de produção.

## Endpoints do CRUD

A API é servida sob `/api` (use `http://localhost:8080/api/...` no host):

| Método | Endpoint | Ação |
|---|---|---|
| GET | `/api/health` | Verifica API e conexão com o banco |
| GET | `/api/clientes` | Lista clientes |
| GET | `/api/clientes/:id` | Consulta um cliente |
| POST | `/api/clientes` | Cria cliente (`{"nome":"Ana Souza","email":"ana@exemplo.com"}`) |
| PUT | `/api/clientes/:id` | Atualiza cliente |
| DELETE | `/api/clientes/:id` | Exclui cliente |

Exemplo com curl:

```bash
curl http://localhost:8080/api/clientes
curl -X POST http://localhost:8080/api/clientes \
  -H 'Content-Type: application/json' \
  -d '{"nome":"Ana Souza","email":"ana@exemplo.com"}'
```

## Pontos para explicar nos Dockerfiles

- Backend: imagem base Node Alpine, `WORKDIR`, cópia separada dos manifests para favorecer cache, instalação de dependências de produção, `USER node`, `EXPOSE` e `CMD`.
- Frontend: build em múltiplas etapas. Node/Vite só é necessário durante a compilação; a imagem final contém Nginx e os ficheiros estáticos. A configuração Nginx encaminha `/api` para o serviço `backend`.
- Compose: `build.context` seleciona cada pasta; `ports` publica portas no host; `environment` configura a app; `networks` liga serviços; `volumes` persiste o banco; `healthcheck` e `depends_on` mostram ordenação por prontidão.

## Observações didáticas / limites desta versão

As credenciais, porta do PostgreSQL e rede são valores fixos para facilitar a aula; não use esta configuração em produção. O `docker compose down` preserva os dados, enquanto `docker compose down -v` apaga o volume. A tabela é criada pelo backend na inicialização para evitar infraestrutura extra numa demo introdutória; num projeto real, considere migrações versionadas. O front carrega a fonte DM Sans do Google Fonts quando há internet; sem acesso externo, usa a fonte sans-serif do sistema.
