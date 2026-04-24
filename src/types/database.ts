// ============================================================
// Database types — mirrors Supabase PostgreSQL schema
// ============================================================

export type ProjectStatus = 'active' | 'paused' | 'completed';
export type ExpenseType = 'materials' | 'labor' | 'services' | 'other';
export type WorkerStatus = 'active' | 'inactive';
export type IncomeSource = 'personal' | 'loan' | 'other';

// ── projects ────────────────────────────────────────────────
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  total_budget: number;
  start_date: string;
  status: ProjectStatus;
  created_at: string;
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at'>;
export type ProjectUpdate = Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>;

// ── income_entries ───────────────────────────────────────────
export interface IncomeEntry {
  id: string;
  project_id: string;
  amount: number;
  description: string;
  source: IncomeSource;
  date: string;
  created_at: string;
}

export type IncomeEntryInsert = Omit<IncomeEntry, 'id' | 'created_at'>;

// ── expense_categories ───────────────────────────────────────
export interface ExpenseCategory {
  id: string;
  project_id: string;
  name: string;
  color: string;
  icon: string;
  type: ExpenseType;
  created_at: string;
}

export type ExpenseCategoryInsert = Omit<ExpenseCategory, 'id' | 'created_at'>;

// ── expenses ─────────────────────────────────────────────────
export interface Expense {
  id: string;
  project_id: string;
  category_id: string | null;
  amount: number;
  description: string;
  date: string;
  receipt_url: string | null;
  created_at: string;
  // joined
  expense_categories?: ExpenseCategory;
}

export type ExpenseInsert = Omit<Expense, 'id' | 'created_at' | 'expense_categories'>;
export type ExpenseUpdate = Partial<Omit<Expense, 'id' | 'project_id' | 'created_at' | 'expense_categories'>>;

// ── materials ────────────────────────────────────────────────
export interface Material {
  id: string;
  project_id: string;
  name: string;
  unit: string;
  stock_current: number;
  stock_min: number;
  category: string;
  created_at: string;
}

export type MaterialInsert = Omit<Material, 'id' | 'created_at'>;
export type MaterialUpdate = Partial<Omit<Material, 'id' | 'project_id' | 'created_at'>>;

// ── stock_movements ──────────────────────────────────────────
export interface StockMovement {
  id: string;
  material_id: string;
  project_id: string;
  user_id: string;
  delta: number;
  stock_after: number;
  note: string | null;
  created_at: string;
}

export type StockMovementInsert = Omit<StockMovement, 'id' | 'created_at'>;

// ── material_purchases ───────────────────────────────────────
export interface MaterialPurchase {
  id: string;
  expense_id: string;
  material_id: string;
  quantity: number;
  unit_price: number;
  supplier: string | null;
  created_at: string;
  // joined
  materials?: Material;
}

export type MaterialPurchaseInsert = Omit<MaterialPurchase, 'id' | 'created_at' | 'materials'>;

// ── workers ──────────────────────────────────────────────────
export interface Worker {
  id: string;
  project_id: string;
  name: string;
  role: string;
  daily_rate: number;
  phone: string | null;
  status: WorkerStatus;
  created_at: string;
}

export type WorkerInsert = Omit<Worker, 'id' | 'created_at'>;
export type WorkerUpdate = Partial<Omit<Worker, 'id' | 'project_id' | 'created_at'>>;

// ── payroll_entries ──────────────────────────────────────────
export interface PayrollEntry {
  id: string;
  project_id: string;
  worker_id: string;
  amount: number;
  period_start: string;
  period_end: string;
  days_worked: number;
  notes: string | null;
  date_paid: string;
  created_at: string;
  // joined
  workers?: Worker;
}

export type PayrollEntryInsert = Omit<PayrollEntry, 'id' | 'created_at' | 'workers'>;

// ── views ────────────────────────────────────────────────────
export interface BalanceSummary {
  project_id: string;
  total_income: number;
  total_expenses: number;
  total_payroll: number;
  balance: number;
  budget: number;
  budget_used_pct: number;
}

export interface MonthlyExpense {
  project_id: string;
  month: string; // 'YYYY-MM'
  category_name: string;
  category_color: string;
  total: number;
}

// ── combined / UI types ──────────────────────────────────────
export interface TransactionItem {
  id: string;
  type: 'income' | 'expense' | 'payroll';
  amount: number;
  description: string;
  date: string;
  category?: string;
  color?: string;
}
