.PHONY: install dev build preview clean help

# Standardziel
.DEFAULT_GOAL := help

install: ## Abhängigkeiten installieren
	npm install

dev: ## Entwicklungsserver mit Hot Reload starten
	npm run dev

build: ## Typcheck + Produktions-Build erstellen
	npm run build

preview: build ## Produktions-Build lokal vorschauen
	npm run preview

clean: ## dist/ Ordner löschen
	rm -rf dist

help: ## Alle verfügbaren Befehle anzeigen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'
