# 🧠 Projeto TCC – Setup e Inicialização

Este projeto utiliza **PNPM + Turborepo**, com:

* **API**: NestJS + Prisma + PostgreSQL (via Docker)
* **Web**: Next.js

---

## 🔹 Requisitos obrigatórios

Antes de qualquer coisa, garanta que você tem instalado:

* **Node.js** (recomendado: versão LTS compatível com o projeto)
* **PNPM**
* **Docker Desktop** (obrigatório para o banco)
* **Git**

Verifique:

```bash
node -v
pnpm -v
docker -v
docker compose version
```

---

# 🚀 Processo 1 — Primeira inicialização (máquina limpa)

## 1️⃣ Clonar o repositório

```bash
git clone https://github.com/gabrielvscodee/tcc.git
cd tcc
```

---

## 2️⃣ Instalar dependências

Na raiz do projeto:

```bash
pnpm install
```

> ⚠️ Use **sempre pnpm**, nunca npm ou yarn.

---

## 3️⃣ Subir infraestrutura (PostgreSQL)

Inicie o Docker Desktop.

Depois, na raiz do projeto:

```bash
docker compose up -d
```

Verifique se o container está rodando:

```bash
docker ps
```

Você deve ver algo como:

```
tcc-postgres   postgres:16   running
```

---

## 4️⃣ Configurar variáveis de ambiente

Crie os arquivos `.env` (se ainda não existirem).

### 📄 apps/api/.env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tcc?schema=public"
JWT_SECRET="super-secret-key"
JWT_EXPIRES_IN=86400
```

---

## 5️⃣ Rodar migrations do Prisma

```bash
pnpm prisma migrate dev
```

> Isso cria as tabelas no banco.

---

## 6️⃣ Subir o projeto

```bash
pnpm dev
```

Serviços disponíveis:

* Web: [http://localhost:3000](http://localhost:3000)
* API: [http://localhost:3001](http://localhost:3001) (ou porta configurada)
* Swagger: [http://localhost:3001/api](http://localhost:3001/api)

---

# 🔁 Processo 2 — Inicialização com projeto já instalado

Use este checklist **sempre que ligar o PC ou voltar ao projeto**.

## ✅ Checklist rápido

### 1️⃣ Docker Desktop está rodando?

* Abra o Docker Desktop
* Confirme com:

```bash
docker ps
```

Se não estiver rodando:

```bash
docker compose up -d
```

---

### 2️⃣ PostgreSQL local NÃO está conflitando

⚠️ Importante:

* PostgreSQL local (porta 5432) **não deve estar rodando**
* O banco é **exclusivamente via Docker**

---

### 3️⃣ Subir o projeto

```bash
pnpm dev
```

---