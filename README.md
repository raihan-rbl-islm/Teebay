# Teebay - Marketplace Platform

A full-stack marketplace application that allows users to buy and rent products. Built with modern web technologies and following best software engineering practices.

## 📺 Demo Video
[![Watch the Demo](https://img.shields.io/badge/YouTube-View_Demo-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/17Yuf-mzNonDspVF1eAN6fMwYBtkblKpG/view?usp=sharing)

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication system
- **Product Management**: Create, read, update, and delete product listings
- **Dual Pricing**: Support for both purchase and rental pricing models
- **Transaction History**: Track purchases, sales, rentals, and lending
- **View Analytics**: Automatic view tracking for products
- **Category System**: Multi-category product classification
- **Responsive UI**: Modern, user-friendly interface built with Mantine UI

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Apollo Client** - GraphQL client
- **React Router** - Client-side routing
- **Mantine UI** - Component library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Apollo Server** - GraphQL server
- **Prisma** - ORM and database toolkit
- **PostgreSQL** - Relational database
- **JWT** - Authentication tokens

### Development Tools
- **Docker** - Containerization for database
- **TypeScript** - Type safety across the stack

## 📁 Project Structure

```
Teebay/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── graphql/       # GraphQL queries and mutations
│   │   └── main.tsx       # Application entry point
│   └── package.json
│
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── resolvers/     # GraphQL resolvers (modular)
│   │   │   ├── queries.ts
│   │   │   ├── mutations.ts
│   │   │   └── fieldResolvers.ts
│   │   ├── config/        # Configuration management
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   ├── typeDefs.ts    # GraphQL schema
│   │   └── index.ts       # Server entry point
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
│
└── docker-compose.yml      # Docker configuration for PostgreSQL
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose
- PostgreSQL (via Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Teebay
   ```

2. **Set up the database**
   ```bash
   # Start PostgreSQL container
   docker-compose up -d
   ```

3. **Configure environment variables**

   Create `server/.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/teebay_db"
   JWT_SECRET="your-secret-key-here"
   PORT=4000
   JWT_EXPIRES_IN="7d"
   CORS_ORIGIN="*"
   NODE_ENV="development"
   ```

   Create `client/.env` (optional, for production):
   ```env
   VITE_API_URL=http://localhost:4000/graphql
   ```

4. **Install dependencies**

   Backend:
   ```bash
   cd server
   npm install
   ```

   Frontend:
   ```bash
   cd client
   npm install
   ```

5. **Set up the database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma generate
   ```

6. **Start the development servers**

   Backend (from `server/` directory):
   ```bash
   npm run dev
   ```

   Frontend (from `client/` directory):
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173 (or port shown in terminal)
   - Backend GraphQL: http://localhost:4000/graphql
   - Health Check: http://localhost:4000/health

## 📚 API Documentation

### GraphQL Endpoint

The GraphQL API is available at `/graphql`. You can use GraphQL Playground (in development) or any GraphQL client.

### Authentication

All protected operations require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Key Queries

- `hello` - Health check
- `myProducts` - Get authenticated user's products
- `allProducts` - Get all available products (marketplace)
- `product(id: Int!)` - Get single product details
- `myTransactionHistory(filter: String!)` - Get transaction history

### Key Mutations

- `register(input: RegisterInput!)` - Create new user account
- `login(input: LoginInput!)` - Authenticate user
- `createProduct(input: CreateProductInput!)` - Create product listing
- `updateProduct(id: Int!, input: UpdateProductInput!)` - Update product
- `deleteProduct(id: Int!)` - Delete product
- `buyProduct(productId: Int!)` - Purchase a product
- `rentProduct(input: RentInput!)` - Rent a product

## 🗄️ Database Schema

### Models

- **User**: User accounts with authentication
- **Product**: Product listings with pricing and rental options
- **Transaction**: Purchase and rental transaction records

### Enums

- **Category**: ELECTRONICS, FURNITURE, HOME_APPLIANCES, SPORTING_GOODS, OUTDOOR, TOYS
- **RentType**: PER_HOUR, PER_DAY
- **TransactionType**: BUY, RENT

## 🔒 Security Considerations

⚠️ **Note**: This project currently stores passwords in plain text for development purposes. In production, implement proper password hashing (e.g., bcrypt).

## 🧪 Development

### Code Quality

The project follows these best practices:
- TypeScript for type safety
- Modular resolver structure
- Comprehensive JSDoc comments
- Error handling with custom error classes
- Environment-based configuration

## 📝 Scripts

### Server Scripts
- `npm run dev` - Start development server with hot reload

### Client Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.
