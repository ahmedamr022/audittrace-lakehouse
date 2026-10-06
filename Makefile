.PHONY: help up down logs test lint dbt-run dbt-test dbt-compile producer processor dashboard clean

PYTHON := python
PIP    := pip
DBT    := dbt

## ──────────────────────────────────────
##  Help
## ──────────────────────────────────────
help:
	@echo "FinFlow Lakehouse – Available Commands"
	@echo "======================================="
	@echo "  make up            Start all Docker services"
	@echo "  make down          Stop all Docker services"
	@echo "  make logs          Tail Docker Compose logs"
	@echo "  make test          Run pytest with coverage"
	@echo "  make lint          Run ruff linter"
	@echo "  make dbt-run       Execute dbt run"
	@echo "  make dbt-test      Execute dbt test"
	@echo "  make dbt-compile   Compile dbt models (no DB write)"
	@echo "  make producer      Start Kafka producer"
	@echo "  make processor     Start stream processor"
	@echo "  make dashboard     Launch Streamlit dashboard"
	@echo "  make clean         Remove __pycache__ and .pyc files"

## ──────────────────────────────────────
##  Infrastructure
## ──────────────────────────────────────
up:
	docker-compose up -d
	@echo "✅ Services started. Kafka on :9092 | Postgres on :5432 | Redis on :6379"

down:
	docker-compose down -v

logs:
	docker-compose logs -f

## ──────────────────────────────────────
##  Testing
## ──────────────────────────────────────
test:
	$(PYTHON) -m pytest tests/ -v --cov=. --cov-report=term-missing --cov-report=html

lint:
	ruff check . --fix

## ──────────────────────────────────────
##  dbt
## ──────────────────────────────────────
dbt-run:
	cd dbt_finflow && $(DBT) run --profiles-dir .

dbt-test:
	cd dbt_finflow && $(DBT) test --profiles-dir .

dbt-compile:
	cd dbt_finflow && $(DBT) compile --profiles-dir .

## ──────────────────────────────────────
##  Pipeline
## ──────────────────────────────────────
producer:
	$(PYTHON) -m stream_producer.producer

processor:
	$(PYTHON) -m stream_processor.processor

dashboard:
	streamlit run dashboard/app.py

## ──────────────────────────────────────
##  Housekeeping
## ──────────────────────────────────────
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null; true
	find . -name "*.pyc" -delete 2>/dev/null; true
	@echo "✅ Cleaned pycache and .pyc files"
