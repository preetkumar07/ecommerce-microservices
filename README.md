

```markdown
# 🚀 Event-Driven E-Commerce Microservices (Ab-e-Aurum)

Welcome to the backend engine of **Ab-e-Aurum**, a premium, real-time e-commerce platform. This project implements a highly scalable, event-driven microservices architecture designed to handle distributed data, asynchronous communication, and seamless request routing.

## 🏗️ Architecture Overview

Unlike a traditional monolith, this system is divided into independent microservices. They communicate asynchronously using a message broker, ensuring that heavy operations (like sending emails) do not block the main application thread. A central API Gateway handles all incoming client traffic.

* **API Gateway (NGINX):** Acts as the single entry point (Reverse Proxy), routing requests to the appropriate backend service.
* **Asynchronous Messaging:** Utilizes RabbitMQ for pub/sub event broadcasting (e.g., `order.placed`).
* **Polyglot Persistence:** Each service manages its own database (PostgreSQL for relational integrity, MongoDB for flexible documents) to prevent data coupling.

## 🛠️ Tech Stack

* **Backend Runtime:** Node.js, Express.js
* **API Gateway:** NGINX
* **Message Broker:** RabbitMQ
* **Databases:** PostgreSQL, MongoDB
* **Caching:** Redis
* **Containerization:** Docker, Docker Compose
* **Notifications:** Nodemailer (SMTP Integration)

## 📦 Microservices Ecosystem

| Service | Port | Database | Description |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8080` | None | NGINX proxy routing external traffic. |
| **User Service** | `3001` | PostgreSQL | Handles authentication, JWT issuance, and user management. |
| **Product Service** | `3002` | MongoDB | Manages inventory, product catalog, and caching via Redis. |
| **Order Service** | `3003` | PostgreSQL | Processes orders with atomic transactions and publishes events. |
| **Notification Service**| `3004` | None | Background consumer that listens to RabbitMQ and sends HTML emails. |

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Node.js](https://nodejs.org/) installed on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/YourUsername/event-driven-ecommerce-microservices.git](https://github.com/YourUsername/event-driven-ecommerce-microservices.git)
cd event-driven-ecommerce-microservices

```

### 2. Set Up Infrastructure (Docker)

Start the foundational services (PostgreSQL, MongoDB, Redis, RabbitMQ, and the NGINX API Gateway) using Docker Compose:

```bash
docker compose up -d

```

### 3. Environment Variables

Create a `.env` file in each microservice directory (`user-service`, `product-service`, `order-service`, `notification-service`). Example for `notification-service`:

```env
NODE_ENV=development
PORT=3004
RABBITMQ_URL=amqp://app:secret@localhost:5672
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=Ab-e-Aurum

```

### 4. Run the Microservices

Open separate terminals for each service and start them:

```bash
cd services/user-service && npm install && npm run dev
cd services/product-service && npm install && npm run dev
cd services/order-service && npm install && npm run dev
cd services/notification-service && npm install && npm run dev

```

## 🔌 Core API Endpoints (Via API Gateway)

All requests should be directed to the NGINX API Gateway at `http://localhost:8080`.

* **Auth:** `POST /api/v1/auth/login`
* **Products:** `GET /api/v1/products`
* **Orders:** `POST /api/v1/orders` *(Requires Bearer Token)*

> **Note:** Placing an order automatically triggers an `order.placed` event in RabbitMQ, which is instantly consumed by the Notification Service to dispatch an email receipt.

## 👨‍💻 Author

**Preet Kumar**
*Final-Year Computer Science Student | Backend Developer*

* **Location:** Karachi, Pakistan
* **Interests:** Scalable Backend Engineering, Microservices, Event-Driven Architecture.

```

```
