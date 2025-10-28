Database Project — API with PostgreSQL & MongoDB

This project was developed as part of an assignment to demonstrate **practical understanding of two different database paradigms**  **PostgreSQL** (relational) and **MongoDB** (document-oriented)  integrated into a single Node.js/Express application.

---

 Project Goal

The API implements a small sales management system with the following features:

- Full CRUD for **clients** and **products**
- Recording of **sales** and **order items** within a transaction
- **Automatic stock update** when a sale is created
- Proper **HTTP status codes** and JSON responses
- Basic **payload validation** on the server side

---

 Why Two Databases?

>  **Note for recruiters:**  
> The use of **both PostgreSQL and MongoDB** is **intentional** and **educational**.  
> It shows that the student understands both **relational modeling** (SQL, foreign keys, joins) and **document modeling** (NoSQL with Mongoose).

- **PostgreSQL** — used for the core relational logic (transactions, constraints, foreign keys, stock management)  
- **MongoDB** — included in parallel, mirroring the same entities to demonstrate Mongoose proficiency

Both database layers are active and can be tested through separate REST endpoints.

---

PostgreSQL Schema Overview

Tables included:

| Table | Description |
|--------|-------------|
| `cliente` | Customer data |
| `produto` | Product catalog |
| `venda` | Sale header |
| `pedido` | Sale items |
| `estoque` | Product inventory |

The [`/sql/schema.sql`](./sql/schema.sql) file includes:

- **CHECK constraints** to prevent negative prices or quantities  
- **Indexes** on join columns (`cliente_id`, `venda_id`, `produto_id`) to improve query performance  
- **Foreign keys** for data integrity

---

##  Tech Stack

| Category | Technology |
|-----------|-------------|
| Backend | Node.js + Express |
| Relational DB | PostgreSQL + `pg` |
| NoSQL DB | MongoDB + `mongoose` |
| Validation | Express JSON middleware + simple server-side checks |
| Other | dotenv, REST, transactions |

---

##  How to Run

1. **Install dependencies**

   npm install

2. **Set up environment variables**
   - **Copy** .env and configure your database connections
   - **PostgreSQL:** PG_URI=postgresql://username:password@localhost:5432/ProjDB
   - **MongoDB:** MONGO_URI=mongodb://127.0.0.1:27017/ProjDB

3. **Initialize PostgreSQL database**
   
  -  node scripts/init-db.js

4. **Start the server**
   - node app.js

**Example Request** (on powershell terminal)
   

   # Create a sale (updates stock automatically)
   $body = @{
    cliente_id = 1
    itens = @(@{ produto_id = 1; quantidade = 2; preco_unitario = 14.90 })
   } | ConvertTo-Json

   Invoke-RestMethod -Uri "http://localhost:3000/vendas" -Method Post -Body $body -ContentType "application/json"
