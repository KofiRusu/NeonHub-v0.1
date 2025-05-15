# NeonHub

A modern real-time collaboration platform for teams.

## Features

- 🔐 Secure authentication with JWT and OAuth
- 📊 Project management with Kanban boards
- 💬 Real-time messaging and notifications
- 📁 Document sharing and collaboration
- 👥 Team management and permissions

## Tech Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Deployment**: Docker, Kubernetes (optional)

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/neonhub.git
   cd neonhub
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Update the values with your own configuration

4. Set up the database:
   ```bash
   cd backend
   npx prisma migrate dev
   ```

5. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev
   
   # In a new terminal, start frontend server
   cd frontend
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Development

### Project Structure

```
neonhub/
├── frontend/          # Next.js React application
│   ├── components/    # React components
│   ├── context/       # React context for state management
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Next.js pages
│   ├── public/        # Static assets
│   ├── styles/        # CSS styles
│   └── utils/         # Utility functions
├── backend/           # Express API server
│   ├── config/        # Configuration files
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Express middleware
│   ├── models/        # Prisma models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── prisma/        # Prisma schema and migrations
└── docs/              # Documentation
```

### Scripts

Frontend:
- `npm run dev`: Start development server
- `npm run build`: Build production version
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

Backend:
- `npm run dev`: Start development server
- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

## Testing

```bash
# Run frontend tests
cd frontend
npm run test

# Run backend tests
cd backend
npm run test
```

## Deployment

The project includes Docker configuration for easy deployment.

```bash
# Build and run Docker containers
docker-compose up -d
```

See the [deployment documentation](./docs/deployment.md) for more details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 