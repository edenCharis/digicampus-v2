VENV = venv/bin
PYTHON = $(VENV)/python
PIP = $(VENV)/pip

# ── Backend ──────────────────────────────────────────────────
backend-install:
	python3 -m venv venv
	$(PIP) install -r backend/requirements.txt

backend-migrate:
	cd backend && ../$(PYTHON) manage.py migrate

backend-seed:
	cd backend && ../$(PYTHON) seed.py

backend-dev:
	cd backend && ../$(PYTHON) manage.py runserver 8000

backend-admin:
	cd backend && ../$(PYTHON) manage.py createsuperuser

# ── Frontend ─────────────────────────────────────────────────
frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

# ── Shortcuts ────────────────────────────────────────────────
install: backend-install frontend-install

dev-backend: backend-dev
dev-frontend: frontend-dev

setup: backend-install backend-migrate backend-seed frontend-install
	@echo "✓ DigitalCampus v2 ready"
	@echo "  Backend:  make backend-dev  → http://localhost:8000"
	@echo "  Frontend: make frontend-dev → http://localhost:3000"
	@echo "  Login:    admin / Admin@123!"
