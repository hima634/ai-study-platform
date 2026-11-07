# AI Study Platform

Upload a textbook PDF, chat with it, and get notes, formulas and practice questions, with progress tracking.

## Features

- Chat with your book (RAG): answers come from the PDF, with source chunks
- Notes, formulas and practice questions generated for each section
- Progress tracking with progress bars
- Secure login (JWT in an httpOnly cookie)
- Redis for a query-embedding cache and per-user rate limiting
- Runs with one Docker Compose command

## How it works

PDF upload → Cloudinary → text extraction → chunks → Gemini embeddings → MongoDB Atlas Vector Search → top 5 matching chunks → Gemini writes the answer

## Tech stack

React (Vite), Tailwind CSS, Node.js, Express, MongoDB Atlas Vector Search, Google Gemini, Redis, Cloudinary, Docker

## Run it

1. Clone the repo and create your env file:

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
cp Server/.env.example Server/.env
```

2. Fill in `Server/.env`: `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`

3. In MongoDB Atlas, create a Vector Search index named `vector_index` on the `chunks` collection:

```json
{
  "fields": [
    { "type": "vector", "path": "embedding", "numDimensions": 3072, "similarity": "cosine" },
    { "type": "filter", "path": "userId" },
    { "type": "filter", "path": "documentId" }
  ]
}
```

4. Start everything:

```bash
docker compose up --build
```

Open http://localhost:5173
