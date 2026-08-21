# Kharch

**Kharch** is a production-oriented expense tracking application built to combine a practical personal-finance use case with real-world backend and distributed-systems engineering.

The project is being developed with **React Native (Expo)** on the client side and **Node.js, Express.js, and PostgreSQL** on the backend. The architecture is intentionally designed to evolve from a simple single-server application into a horizontally scalable distributed system.

The goal is not only to build an expense tracker, but also to understand how production systems handle increasing traffic, caching, database growth, load balancing, replication, partitioning, failures, and horizontal scaling.

---

## 🚀 Project Vision

Kharch is designed around a simple idea:

> Build a useful application first, then progressively evolve its architecture to handle larger workloads.

The project starts with a clean monolithic application:

```text
React Native / Expo
        |
        | HTTP / REST API
        v
Node.js + Express
        |
        v
PostgreSQL
```

The architecture will then evolve toward:

```text
                    React Native
                         |
                         v
                  Nginx Load Balancer
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
          API-1       API-2       API-3
             |           |           |
             +-----------+-----------+
                         |
                         v
                       Redis
                         |
                         v
                PostgreSQL Cluster
                  /      |      \
                 /       |       \
             Node 1    Node 2    Node 3
```

This progression allows the project to demonstrate not just how to build an application, but also **why different infrastructure components are introduced and what problems they solve**.

---

## 🎯 Objectives

The major objectives of Kharch are:

* Build a complete expense tracking application.
* Implement a clean RESTful backend architecture.
* Use PostgreSQL as the primary relational database.
* Containerize infrastructure using Docker.
* Design the backend to remain stateless and horizontally scalable.
* Introduce Redis for caching and other high-performance use cases.
* Run multiple API instances.
* Use Nginx as a reverse proxy and load balancer.
* Explore PostgreSQL replication and high availability.
* Implement database partitioning for large datasets.
* Explore horizontal database scaling and sharding.
* Perform load testing and failure testing.
* Understand the trade-offs between performance, scalability, availability, consistency, and cost.

---

## 🛠️ Tech Stack

### Client

* React Native
* Expo
* Expo Router
* JavaScript / TypeScript as required

### Backend

* Node.js
* Express.js
* REST APIs
* PostgreSQL client (`pg`)
* dotenv
* Nodemon

### Database

* PostgreSQL
* SQL
* Indexing
* Transactions
* Constraints
* Partitioning
* Replication
* Distributed database concepts
* Sharding

### Infrastructure

* Docker
* Docker Compose
* Nginx
* Redis

### Development Tools

* Git
* GitHub
* Postman
* Linux / Fedora

---

## 📁 Project Structure

```text
kharch/
│
├── client/
│   ├── app/
│   ├── assets/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env
│   ├── .gitignore
│   └── package.json
│
├── infrastructure/
│   ├── nginx/
│   ├── postgres/
│   │   ├── init/
│   │   ├── config/
│   │   └── scripts/
│   └── redis/
│       ├── config/
│       └── scripts/
│
├── docker-compose.yml
├── Kharcha.jpg
└── README.md
```

---

## 🏗️ Current Architecture

The project is currently running as a single API instance connected to a PostgreSQL container.

```text
                React Native / Expo
                         |
                         v
                  Express API
                    :5000
                         |
                         v
               PostgreSQL Container
                    :5433
```

PostgreSQL is running through Docker rather than directly as the application's database installation.

The local environment currently contains:

```text
Fedora Host
│
├── Existing PostgreSQL
│   └── localhost:5432
│
└── Docker
    └── kharch-postgres
        └── PostgreSQL:5432
            └── mapped to localhost:5433
```

This separation keeps the application's database environment isolated from the PostgreSQL installation already present on the host machine.

---

# 📱 Client Application

The client is built using **React Native with Expo**.

The mobile application will provide the user-facing experience for:

* User registration
* Login
* Expense creation
* Expense editing
* Expense deletion
* Expense history
* Expense filtering
* Categories
* Budgets
* Dashboard and summaries
* Profile and account management

The client communicates with the backend through HTTP APIs instead of directly accessing the database.

```text
React Native
      |
      | HTTP / HTTPS
      v
Express API
```

This separation is important because it allows the backend to scale independently from the mobile application.

---

# 🖥️ Backend

The backend is built using **Node.js and Express.js**.

The server is responsible for:

* Authentication
* Authorization
* Request validation
* Expense management
* Category management
* Budget management
* Business logic
* Database interaction
* Error handling
* Logging
* Security controls

The backend follows a layered approach so that controllers do not contain all application logic.

A typical flow will be:

```text
Request
   |
   v
Route
   |
   v
Middleware
   |
   v
Controller
   |
   v
Service
   |
   v
Database / Repository Layer
   |
   v
PostgreSQL
```

This separation makes the application easier to test, maintain, and scale.

---

# 🗄️ Database Design

PostgreSQL is used because the application contains strongly related entities and requires transactional consistency.

The initial domain model is centered around:

```text
User
 |
 +---- Category
 |
 +---- Expense
 |
 +---- Budget
```

### Planned Core Entities

#### Users

Stores account information and authentication-related data.

#### Categories

Stores expense categories such as:

* Food
* Transportation
* Shopping
* Bills
* Entertainment
* Education

Categories can later support both system-wide and user-specific behavior.

#### Expenses

Stores individual transactions including:

* Amount
* Description
* Category
* User
* Date
* Metadata

#### Budgets

Stores spending limits that can be associated with a user and category over a defined period.

---

# ⚡ Redis

Redis will be introduced after the initial application is stable.

Potential use cases include:

* Frequently accessed dashboard data
* Caching expensive queries
* Rate limiting
* Temporary application state
* Session-related infrastructure where appropriate
* Frequently requested reference data

The goal is to understand cache behavior rather than simply adding Redis because it is popular.

Expected flow:

```text
Client
  |
  v
API
  |
  v
Redis
  |
  +---- Cache Hit ----> Return Data
  |
  +---- Cache Miss
            |
            v
       PostgreSQL
            |
            v
          Redis
            |
            v
        API Response
```

---

# ⚖️ Horizontal Scaling

One of the major goals of the project is to understand **horizontal scaling**.

Instead of continuously making one server stronger, multiple instances of the same application will be run.

```text
                Nginx
                  |
        +---------+---------+
        |         |         |
        v         v         v
      API-1     API-2     API-3
```

Each instance will run the same backend code.

The application will therefore be designed to be **stateless**, so that any API instance can process a request.

This allows the system to scale by adding more instances when demand increases.

---

# 🌐 Nginx Load Balancing

Nginx will eventually act as the reverse proxy and load balancer.

Its responsibilities will include:

* Receiving incoming API traffic
* Routing requests to available API instances
* Distributing traffic
* Handling upstream failures
* Providing a single public entry point
* Supporting future scalability

Example:

```text
Mobile App
    |
    v
Nginx :80
    |
    +------> API-1
    |
    +------> API-2
    |
    +------> API-3
```

The API instances will remain internal services rather than being directly exposed to clients.

---

# 🗃️ PostgreSQL Scaling

Database scalability is one of the more advanced goals of Kharch.

The project will explore several different strategies because they solve different problems.

## Replication

Replication will be used to explore availability and read scalability.

Conceptually:

```text
                Primary
                  |
          +-------+-------+
          |               |
          v               v
      Replica 1       Replica 2
```

Replication helps improve resilience and can support read-heavy workloads, but simply creating replicas does not automatically multiply write capacity.

---

## Partitioning

Large tables can eventually be partitioned to improve manageability and query performance for appropriate workloads.

For example:

```text
expenses
   |
   +-- expenses_2026
   +-- expenses_2027
   +-- expenses_2028
```

The actual partitioning strategy will be selected based on real query patterns and data growth rather than being added artificially.

---

## Sharding

For large-scale horizontal database distribution, the project will explore sharding.

Conceptually:

```text
                  Expenses
                     |
           +---------+---------+
           |         |         |
           v         v         v
        Shard 1   Shard 2   Shard 3
```

A shard key will determine where records are stored.

For an expense application, possible strategies may involve user-based distribution, but the final choice will depend on access patterns and workload characteristics.

The project will explicitly examine the trade-offs involved in:

* Cross-shard queries
* Data distribution
* Hot partitions
* Rebalancing
* Transactions
* Consistency
* Operational complexity

---

# 🐳 Docker Infrastructure

Docker is used to create isolated, reproducible local infrastructure.

The project uses Docker so that components can be run independently without requiring multiple physical machines.

The local environment can eventually contain:

```text
Docker
│
├── Nginx
├── API-1
├── API-2
├── API-3
├── Redis
├── PostgreSQL Node 1
├── PostgreSQL Node 2
└── PostgreSQL Node 3
```

All of these components can run on the same development machine while behaving as independent services.

This provides a practical local environment for experimenting with distributed-system concepts.

---

# 🧪 Testing Strategy

The application will be tested at multiple levels.

### API Testing

Postman will be used for:

* Authentication requests
* CRUD operations
* Error scenarios
* Authorization
* Pagination
* Validation
* Edge cases

### Database Testing

The database layer will be evaluated for:

* Query correctness
* Index usage
* Constraints
* Transaction behavior
* Data integrity
* Partition performance

### Load Testing

The distributed architecture will eventually be tested with increasing traffic to observe:

* Request throughput
* Latency
* CPU usage
* Memory usage
* Database load
* Cache hit ratio
* Load-balancer distribution

### Failure Testing

The system will also be tested under failures such as:

```text
API instance unavailable
        ↓
Nginx routes traffic elsewhere
```

and:

```text
Database replica unavailable
        ↓
System continues according to configured failure strategy
```

The objective is to understand how distributed systems behave under partial failure.

---

# 🔐 Security

Security will be treated as part of the architecture rather than as a final feature.

Planned security measures include:

* Password hashing
* Authentication and authorization
* Input validation
* Parameterized SQL queries
* Environment-based secrets
* API rate limiting
* Secure HTTP headers
* Proper CORS configuration
* Token expiration and rotation strategies
* Protection against common API attacks
* Principle of least privilege

Sensitive files such as `.env` and dependency directories will not be committed to version control.

---

# 📈 Scalability Strategy

Kharch is intentionally developed in phases.

## Phase 1 — Application Foundation

```text
React Native
      ↓
Express
      ↓
PostgreSQL
```

## Phase 2 — Core Features

* Authentication
* Users
* Categories
* Expenses
* Budgets
* Validation
* Error handling

## Phase 3 — Performance

* Database indexes
* Query optimization
* Pagination
* Redis caching

## Phase 4 — Horizontal API Scaling

```text
              Nginx
                |
       +--------+--------+
       |        |        |
      API-1   API-2    API-3
```

## Phase 5 — Database Availability

```text
             Primary
             /     \
        Replica    Replica
```

## Phase 6 — Database Partitioning

Large tables will be partitioned according to actual access and data-growth patterns.

## Phase 7 — Distributed Database

The project will explore sharding and horizontally distributed database nodes.

## Phase 8 — Testing

The complete architecture will be load-tested and failure-tested to identify bottlenecks and architectural weaknesses.

---

# 💡 Why This Project?

Many projects stop at:

```text
Frontend → Backend → Database
```

Kharch is intended to go further.

The project is being developed to answer practical engineering questions such as:

* What happens when one API server reaches its capacity?
* How does a load balancer distribute traffic?
* Why should API servers be stateless?
* When does caching actually help?
* What happens when a database grows too large?
* What is the difference between replication and sharding?
* When should a table be partitioned?
* How do database bottlenecks differ from application bottlenecks?
* What happens when one server or database node fails?
* How should a system scale without introducing unnecessary complexity?
* What are the real trade-offs between scalability, consistency, availability, performance, and cost?

The project therefore acts both as an application and as a **hands-on distributed-systems laboratory**.

---

# 🧑‍💻 Local Development

## Prerequisites

Install the following:

* Node.js
* npm
* Docker
* Docker Compose
* Expo CLI / Expo tooling
* Git

---

## Start PostgreSQL

From the project root:

```bash
docker compose up -d
```

Check running containers:

```bash
docker ps
```

The current PostgreSQL environment uses:

```text
Host: localhost
Port: 5433
Database: kharch
User: kharch_user
```

---

## Start Backend

```bash
cd server
npm install
npm run dev
```

The API currently runs on:

```text
http://localhost:5000
```

Health endpoint:

```http
GET /health
```

Expected response:

```json
{
  "success": true,
  "message": "Kharch API is running"
}
```

---

## Start Mobile Application

```bash
cd client
npm install
npx expo start
```

The application can then be opened using the appropriate Expo development workflow.

---

# ⚙️ Environment Variables

Environment variables are stored locally and should not be committed to Git.

Example:

```env
PORT=5000

DB_HOST=localhost
DB_PORT=5433
DB_NAME=kharch
DB_USER=kharch_user
DB_PASSWORD=your_local_password
```

For production deployments, secrets should be managed through an appropriate secret-management mechanism instead of committing credentials to source control.

---

# 🧭 Current Development Status

### Completed

* [x] Project initialized
* [x] Git repository configured
* [x] Expo React Native application initialized
* [x] Docker installed and configured
* [x] PostgreSQL container configured
* [x] PostgreSQL running through Docker
* [x] Express backend initialized
* [x] PostgreSQL connection established
* [x] Basic API health endpoint implemented

### In Progress

* [ ] Database schema
* [ ] Authentication
* [ ] User management
* [ ] Expense management
* [ ] Categories
* [ ] Budgets
* [ ] Validation and error handling

### Planned

* [ ] Redis caching
* [ ] Multiple API instances
* [ ] Nginx load balancing
* [ ] PostgreSQL replication
* [ ] Database partitioning
* [ ] Sharding
* [ ] Load testing
* [ ] Failure testing
* [ ] Performance benchmarking
* [ ] Production deployment

---

# 📚 Engineering Principles

The project follows several engineering principles:

### Separation of Concerns

Client, API, business logic, database access, and infrastructure are kept separate.

### Stateless Services

The backend is designed so that any API instance can process a request.

### Database Integrity

Relational constraints, transactions, indexes, and proper schema design are preferred over relying solely on application logic.

### Security by Design

Security considerations are incorporated during architecture and implementation.

### Observability

Performance and failure behavior will be measured instead of assumed.

### Scale Only When Necessary

Distributed components are introduced when there is a real architectural reason for them, rather than adding complexity without purpose.

---

# 📌 Project Philosophy

Kharch is being built with a simple philosophy:

> **Understand the system before scaling the system.**

The application will first be made correct, maintainable, and testable.

Only then will additional infrastructure be introduced to solve specific problems.

This makes it possible to compare:

```text
Single Server
      ↓
Horizontally Scaled API
      ↓
Cached Application
      ↓
Replicated Database
      ↓
Partitioned Database
      ↓
Distributed / Sharded Database
```

and understand the engineering trade-offs at every stage.

---

# 📜 License

This project is currently under development. A formal open-source license will be added when the project reaches its intended release stage.

---

# 👨‍💻 Author

**Tanvir**

Software Engineering student focused on full-stack development, backend engineering, system design, scalability, and distributed systems.

---

## ⭐ Project Status

> **Kharch is an actively developed learning and engineering project focused on building a real-world expense tracker while progressively implementing scalable and distributed system architecture.**
