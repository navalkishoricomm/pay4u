# Pay4U Wallet Application

Pay4U is a digital wallet application that allows users to manage their money, make mobile/DTH recharges, and pay bills.

## Features

- User Authentication (Signup/Login)
- Wallet Management (Balance check, Top-up)
- Mobile/DTH Recharge
- Bill Payments
- Transaction History

## Project Structure

The project is divided into two main parts:

### Frontend
- React-based web application
- Located in the `/frontend` directory
- Uses React Router for navigation
- Uses Context API for state management

### Backend
- Node.js with Express
- Located in the `/backend` directory
- MongoDB for database
- JWT for authentication

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```
2. Start the frontend development server:
   ```
   cd frontend
   npm start
   ```

## Future Integrations

- Payment Gateway for wallet top-up
- API integration for actual mobile/DTH recharges
- API integration for actual bill payments

## License

MIT