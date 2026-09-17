# Triply

Triply is a full-stack travel planning application that helps users organize trips, manage day-wise itineraries, collaborate with members, track expenses, view weather information, and share trips publicly.

## Tech Stack

### Frontend
- React
- Vite
- Socket.IO Client

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO

### Other Services
- Cloudinary for file storage
- Open-Meteo for weather information
- OpenRouter for AI-assisted itinerary generation
- Nodemailer for email notifications
- JWT for authentication

## Main Features

- User registration, mandatory email verification, login, and password reset
- Create and manage trips with owner/member permissions
- Day-wise itinerary management with AI-assisted generation
- Real-time itinerary updates
- Manual expense tracking with per-user ownership permissions
- Equal expense share calculation for trip members
- Member file uploads with per-user deletion permissions
- Weather information for destinations
- Public trip sharing with itinerary, activities, and optional budget display
- Scheduled email reminders three days before and during a trip

## Project Structure

```text
Triply/
├── client/              # React frontend
├── public/              # Backend public files
├── src/                 # Backend source code
│   ├── controllers/
│   ├── db/
│   ├── jobs/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   └── utils/
├── .env.example
├── package.json
├── render.yaml
└── README.md
```

## Configuration

Copy `.env.example` to `.env` for the backend and `client/.env.example` to `client/.env` for the frontend. Replace every placeholder with local or deployment-specific values. Do not commit active `.env` files or credentials.

## Run Locally

Install dependencies in the repository root and in `client`, then start the API and frontend in separate terminals:

```bash
npm install
cd client && npm install

# terminal 1, from the repository root
npm run dev

# terminal 2, from client
npm run dev
```

The API runs on `http://localhost:2000` and the Vite client runs on `http://localhost:5173` by default.