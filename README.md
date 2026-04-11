# CourseConnect

A full-stack web app for UBC students to collaborate on courses, share resources, and schedule study sessions.

Built with the MERN stack (MongoDB, Express, React, Node.js) for COSC 360.

## Team
- **Samarth Grover** – Backend (Node.js, Express, REST API, MongoDB)
- **Michael Montgomery** – Frontend (React, UI/UX)

## Docker

Run the app with Docker Compose.

1. Make sure the root `.env` file exists and has `MONGODB_URI` and `JWT_SECRET` set.
2. Start the stack:

```bash
docker compose up --build
```

By default, the frontend is exposed on port `80` and the backend runs on port `5050` inside the compose network.
Open the app at http://localhost


Optional environment overrides supported by `docker-compose.yml`:
- `PORT` for the backend container
- `APP_PORT` for the frontend host port
- `JWT_EXPIRES_IN`
- `FRONTEND_ORIGIN`
- `SEED_DATABASE` to populate demo data on first run

The older separate backend/frontend startup flow is no longer part of the documented setup.

## Features
- Browse courses and discussion threads
- Post and categorize course resources
- Schedule and join study sessions
- User authentication and profile management
- Admin dashboard for moderation
