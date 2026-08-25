const pool = require("../config/database");

// Columns returned to clients. Never SELECT * - keeps the shape stable and
// explicit even as the table grows.
const BASE_COLUMNS = `
  id,
  user_id,
  type,
  amount,
  category_id,
  description,
  transaction_date,
  created_at,
  updated_at
`;

// Whitelist of columns a caller is allowed to sort by. Never interpolate
// `sortBy` from the client straight into SQL.
const SORTABLE_COLUMNS = {
  transactionDate: "transaction_date",
  amount: "amount",
  createdAt: "created_at",
};

const Transaction = {
  async create({
    userId,
    type,
    amount,
    categoryId = null,
    description = null,
    transactionDate,
  }) {
    const query = `
      INSERT INTO transactions (
        user_id,
        type,
        amount,
        category_id,
        description,
        transaction_date
      )
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE))
      RETURNING ${BASE_COLUMNS}
    `;

    const values = [
      userId,
      type,
      amount,
      categoryId,
      description,
      transactionDate,
    ];

    const { rows } = await pool.query(query, values);

    return rows[0];
  },

  async findById(id, userId) {
    const query = `
      SELECT ${BASE_COLUMNS}
      FROM transactions
      WHERE id = $1
        AND user_id = $2
      LIMIT 1
    `;

    const { rows } = await pool.query(query, [id, userId]);

    return rows[0] ?? null;
  },

  // Builds the shared WHERE clause + params used by both findAllForUser and
  // countForUser, so the filters can never drift apart between the two.
  _buildFilters(userId, filters) {
    const conditions = ["user_id = $1"];
    const values = [userId];

    if (filters.type) {
      values.push(filters.type);
      conditions.push(`type = $${values.length}`);
    }

    if (filters.categoryId) {
      values.push(filters.categoryId);
      conditions.push(`category_id = $${values.length}`);
    }

    if (filters.startDate) {
      values.push(filters.startDate);
      conditions.push(`transaction_date >= $${values.length}`);
    }

    if (filters.endDate) {
      values.push(filters.endDate);
      conditions.push(`transaction_date <= $${values.length}`);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(`description ILIKE $${values.length}`);
    }

    return { whereClause: conditions.join(" AND "), values };
  },

  // Paginated + filtered listing. Uses COUNT(*) OVER() so the total row
  // count comes back in the same round trip as the page of rows, instead of
  // firing a second query.
  async findAllForUser(userId, filters = {}) {
    const { whereClause, values } = Transaction._buildFilters(
      userId,
      filters,
    );

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    const sortColumn = SORTABLE_COLUMNS[filters.sortBy] || "transaction_date";
    const sortOrder = filters.sortOrder === "asc" ? "ASC" : "DESC";

    values.push(limit, offset);

    const query = `
      SELECT
        ${BASE_COLUMNS},
        COUNT(*) OVER() AS total_count
      FROM transactions
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}, id ${sortOrder}
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `;

    const { rows } = await pool.query(query, values);

    const total = rows[0] ? Number(rows[0].total_count) : 0;

    const transactions = rows.map(({ total_count, ...row }) => row);

    return { transactions, total };
  },

  async update(id, userId, fields) {
    const setClauses = [];
    const values = [];

    const assignable = {
      amount: fields.amount,
      category_id: fields.categoryId,
      description: fields.description,
      transaction_date: fields.transactionDate,
      type: fields.type,
    };

    for (const [column, value] of Object.entries(assignable)) {
      if (value !== undefined) {
        values.push(value);
        setClauses.push(`${column} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return Transaction.findById(id, userId);
    }

    setClauses.push("updated_at = NOW()");

    values.push(id, userId);

    const query = `
      UPDATE transactions
      SET ${setClauses.join(", ")}
      WHERE id = $${values.length - 1}
        AND user_id = $${values.length}
      RETURNING ${BASE_COLUMNS}
    `;

    const { rows } = await pool.query(query, values);

    return rows[0] ?? null;
  },

  async delete(id, userId) {
    const query = `
      DELETE FROM transactions
      WHERE id = $1
        AND user_id = $2
      RETURNING id
    `;

    const { rows } = await pool.query(query, [id, userId]);

    return rows[0] ?? null;
  },

  // Single aggregation query for the dashboard summary card - one round
  // trip to PostgreSQL instead of separate income/expense queries.
  async getSummaryTotals(userId, { startDate, endDate } = {}) {
    const conditions = ["user_id = $1"];
    const values = [userId];

    if (startDate) {
      values.push(startDate);
      conditions.push(`transaction_date >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`transaction_date <= $${values.length}`);
    }

    const query = `
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense,
        COUNT(*) FILTER (WHERE type = 'income') AS income_count,
        COUNT(*) FILTER (WHERE type = 'expense') AS expense_count
      FROM transactions
      WHERE ${conditions.join(" AND ")}
    `;

    const { rows } = await pool.query(query, values);

    return rows[0];
  },

  async getRecentForUser(userId, limit = 5) {
    const query = `
      SELECT
        t.id,
        t.type,
        t.amount,
        t.description,
        t.transaction_date,
        t.category_id,
        c.name AS category_name
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = $1
      ORDER BY t.transaction_date DESC, t.id DESC
      LIMIT $2
    `;

    const { rows } = await pool.query(query, [userId, limit]);

    return rows;
  },

  // Income/expense breakdown per category, scoped to a user and optional
  // date range. Shared by the dashboard summary and /analytics/categories.
  async getCategoryBreakdown(userId, { startDate, endDate } = {}) {
    const conditions = ["t.user_id = $1"];
    const values = [userId];

    if (startDate) {
      values.push(startDate);
      conditions.push(`t.transaction_date >= $${values.length}`);
    }

    if (endDate) {
      values.push(endDate);
      conditions.push(`t.transaction_date <= $${values.length}`);
    }

    const query = `
      SELECT
        t.category_id,
        COALESCE(c.name, 'Uncategorized') AS category_name,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0) AS income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) AS expense,
        COUNT(*) AS transaction_count
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE ${conditions.join(" AND ")}
      GROUP BY t.category_id, c.name
      ORDER BY expense DESC, income DESC
    `;

    const { rows } = await pool.query(query, values);

    return rows;
  },

  // Monthly income/expense totals for a given year. Uses generate_series so
  // months with zero activity still show up as 0 rather than being omitted.
  async getMonthlyForUser(userId, year) {
    const query = `
      SELECT
        months.month_number,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0) AS income,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0) AS expense
      FROM generate_series(1, 12) AS months(month_number)
      LEFT JOIN transactions t
        ON t.user_id = $1
        AND EXTRACT(YEAR FROM t.transaction_date) = $2
        AND EXTRACT(MONTH FROM t.transaction_date) = months.month_number
      GROUP BY months.month_number
      ORDER BY months.month_number
    `;

    const { rows } = await pool.query(query, [userId, year]);

    return rows;
  },
};

module.exports = Transaction;
