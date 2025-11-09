# AI CV Evaluator

This project is a backend service for an AI-powered CV evaluation platform. It provides a RESTful API for user authentication, job description management, CV evaluation, and more. This application is built with consideration for evaluator point-of-view. All user in this app is an evaluator.

## Architectural Decisions

### Framework and Language
-   **Framework**: [NestJS](https://nestjs.com/) - A progressive Node.js framework for building efficient, reliable, and scalable server-side applications. Its modular architecture helps in organizing the code and separating concerns.
-   **Language**: [TypeScript](https://www.typescriptlang.org/) - We use TypeScript to benefit from static typing, which helps in catching errors early and improving the developer experience.

### Authentication

-   **JWT-based Authentication**: The application uses JSON Web Tokens (JWT) for securing the API endpoints.
-   **Google OAuth2**: Users can register and log in using their Google accounts.
-   **Password-based Authentication**: Traditional email/password registration and login are also supported.
-   **Refresh Tokens**: To provide a better user experience, refresh tokens are implemented for persistent sessions.
-   **Custom Decorator (`@GetUser`)**: A custom decorator `@GetUser` is created for cleanly accessing the authenticated user object in the request handlers.

### Database

-   **Database**: [MongoDB](https://www.mongodb.com/) - A NoSQL database that provides flexibility and scalability.
-   **ODM**: [Mongoose](https://mongoosejs.com/) - An Object Data Modeling (ODM) library for MongoDB and Node.js, used for modeling the application data.

### File Storage

-   **Google Cloud Storage**: All uploaded files, such as CVs, are stored in Google Cloud Storage for durability and scalability.

### Modularity

The project is divided into several modules, each responsible for a specific domain:

-   `AuthModule`: Handles user authentication and authorization.
-   `EvaluationModule`: Manages CV uploads and evaluations.
-   `JobDescriptionModule`: Manages job descriptions.
-   `TelegramModule`: Integrates with a Telegram bot.
-   `DatabaseModule`: Manages the database connection and schemas.

### Configuration

The application is configured using environment variables. A `.env` file is used to store sensitive information like database connection strings and API keys.

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [Yarn](https://yarnpkg.com/) (or npm)
-   A [MongoDB](https://www.mongodb.com/) instance
-   A Google Cloud project with Google Cloud Storage and OAuth2 credentials.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/ai-cv-evaluator.git
    cd ai-cv-evaluator
    ```

2.  Install the dependencies:
    ```bash
    yarn install
    ```

### Configuration

1.  Create a `.env` file by copying the example file:
    ```bash
    cp .env.example .env
    ```

2.  Open the `.env` file and fill in the required environment variables:
    -   `DATABASE_URL`: Your MongoDB connection string.
    -   `GOOGLE_CLIENT_ID`: Your Google OAuth2 client ID.
    -   `GOOGLE_CLIENT_SECRET`: Your Google OAuth2 client secret.
    -   `GOOGLE_SA_PATH`: The absolute path to your Google Cloud service account JSON file.
    -   `JWT_SECRET`: A secret key for signing JWTs.

### Running the Application

-   **Development Mode**:
    ```bash
    yarn start:dev
    ```
    This will start the application in development mode with hot-reloading.

-   **Production Mode**:
    ```bash
    yarn build
    yarn start
    ```

## API Endpoints
Endpoints postman collection will be included in project as well.

### Authentication (`/auth`)

-   `POST /auth/register`: Register a new user.
-   `POST /auth/login`: Log in with username and password.
-   `GET /auth/google`: Initiate Google OAuth2 login.
-   `GET /auth/google/callback`: Google OAuth2 callback.
-   `POST /auth/refresh`: Refresh an access token.
-   `GET /auth/profile`: Get the authenticated user's profile.

### Evaluation (`/evaluate`)

-   `GET /`: Get the list of evaluations for the authenticated user.
-   `POST /`: Evaluate a CV.
-   `POST /upload`: Upload a CV and project file.
-   `POST /:id/result`: Save the result of a CV evaluation.

### Job Description (`/job-description`)

-   `POST /`: Create a new job description.
-   `GET /`: Get a list of all job descriptions.
-   `GET /:id`: Get a specific job description by ID.
-   `PATCH /:id`: Update a job description.
-   `DELETE /:id`: Delete a job description.

### Telegram (`/telegram`)

-   `POST /webhook`: Webhook for receiving updates from the Telegram bot.
-   `POST /setWebhook`: Set the webhook for the Telegram bot.
