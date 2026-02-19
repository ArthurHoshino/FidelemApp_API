.PHONY: up
up:
	docker compose up -d --build

# Para os conteiners sem remove-los
.PHONY: down
down:
	docker compose down

# Mostra os logs de todos os serviços (em tempo real)
logs:
	docker compose logs -f

# Mostra os logs apenas do serviço 'api'
logs-api:
	docker compose logs -f api

# Mostra os logs apenas do serviço 'db'
logs-db:
	docker compose logs -f db

# Mostra o status dos containers
ps:
	docker compose ps

teste-make:
	@echo Funcionando
