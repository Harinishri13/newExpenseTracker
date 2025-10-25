import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { useSnackbar } from "notistack";
import { FiPlus, FiEdit, FiTrash2 } from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

Modal.setAppElement("#root");

const DEFAULT_BALANCE = 5000;
const STORAGE_KEY = "expenses";
const BALANCE_KEY = "walletBalance";

const CATEGORY_COLORS = {
  Food: "#8884d8",
  Travel: "#82ca9d",
  Shopping: "#ffc658",
  Bills: "#8dd1e1",
  Entertainment: "#a4de6c",
  Other: "#d0ed57",
};

export default function App() {
  const [walletBalance, setWalletBalance] = useState(DEFAULT_BALANCE);
  const [expenses, setExpenses] = useState([]);

  // Modals
  const [isAddBalanceOpen, setAddBalanceOpen] = useState(false);
  const [isAddExpenseOpen, setAddExpenseOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { enqueueSnackbar } = useSnackbar ? useSnackbar() : { enqueueSnackbar: () => {} };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setExpenses(JSON.parse(stored));

    const storedBal = localStorage.getItem(BALANCE_KEY);
    if (storedBal != null) setWalletBalance(Number(storedBal));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(BALANCE_KEY, String(walletBalance));
  }, [walletBalance]);

  function showNotification(message, variant = "default") {
    if (enqueueSnackbar) enqueueSnackbar(message, { variant });
    else alert(message);
  }

  // Balance handlers
  function openAddBalance() {
    setAddBalanceOpen(true);
  }
  function closeAddBalance() {
    setAddBalanceOpen(false);
  }

  function handleAddBalance(e) {
    e.preventDefault();
    const amount = Number(e.target.elements.amount.value || 0);
    if (!amount || amount <= 0) {
      showNotification("Please enter a valid amount", "warning");
      return;
    }
    setWalletBalance((b) => b + amount);
    showNotification(`Added $${amount.toFixed(2)} to wallet`, "success");
    closeAddBalance();
    e.target.reset();
  }

  // Expense handlers
  function openAddExpense() {
    setEditingExpense(null);
    setAddExpenseOpen(true);
  }
  function closeAddExpense() {
    setAddExpenseOpen(false);
  }

  function handleAddExpense(e) {
    e.preventDefault();
    const form = e.target;
    const title = form.elements.title.value.trim();
    const price = Number(form.elements.price.value);
    const category = form.elements.category.value;
    const date = form.elements.date.value;

    // Validation
    if (!title || !price || !category || !date) {
      showNotification("Please fill all required fields", "warning");
      return;
    }

    if (price > walletBalance) {
      showNotification("Insufficient wallet balance for this expense", "error");
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      title,
      price: Number(price),
      category,
      date,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setWalletBalance((b) => b - price);

    showNotification("Expense added", "success");
    form.reset();
    closeAddExpense();
  }

  function openEdit(exp) {
    setEditingExpense(exp);
    setEditOpen(true);
  }
  function closeEdit() {
    setEditOpen(false);
    setEditingExpense(null);
  }

  function handleEditExpense(e) {
    e.preventDefault();
    const form = e.target;
    const title = form.elements.title.value.trim();
    const price = Number(form.elements.price.value);
    const category = form.elements.category.value;
    const date = form.elements.date.value;

    if (!title || !price || !category || !date) {
      showNotification("Please fill all required fields", "warning");
      return;
    }

    const old = expenses.find((ex) => ex.id === editingExpense.id);
    if (!old) {
      showNotification("Original expense not found", "error");
      return;
    }

    // Calculate balance change: refund old.price then subtract new price
    const tentativeBalance = walletBalance + old.price - price;
    if (tentativeBalance < 0) {
      showNotification("Insufficient wallet balance for this change", "error");
      return;
    }

    const updated = expenses.map((ex) =>
      ex.id === editingExpense.id ? { ...ex, title, price, category, date } : ex
    );

    setExpenses(updated);
    setWalletBalance(tentativeBalance);
    showNotification("Expense updated", "success");
    closeEdit();
  }

  function handleDelete(id) {
    const ex = expenses.find((e) => e.id === id);
    if (!ex) return;
    if (!window.confirm("Delete this expense?")) return;
    setExpenses((prev) => prev.filter((p) => p.id !== id));
    setWalletBalance((b) => b + ex.price);
    showNotification("Expense deleted", "info");
  }

  // Charts data
  const summaryData = Object.entries(
    expenses.reduce((acc, ex) => {
      acc[ex.category] = (acc[ex.category] || 0) + ex.price;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const trendsData = Object.entries(
    expenses.reduce((acc, ex) => {
      acc[ex.category] = (acc[ex.category] || 0) + ex.price;
      return acc;
    }, {})
  ).map(([name, value]) => ({ category: name, amount: value }));

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Expense Tracker</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column - Wallet & Actions */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold">Wallet Balance</h2>
            <p className="text-2xl font-bold mt-2">Wallet Balance: ${walletBalance.toFixed(2)}</p>

            <div className="mt-4 space-x-2">
              <button type="button" className="px-3 py-1 border rounded" onClick={openAddBalance}>
                + Add Income
              </button>

              <button type="button" className="px-3 py-1 border rounded" onClick={openAddExpense}>
                + Add Expense
              </button>
            </div>

            <div className="mt-6">
              <h3 className="font-medium">Quick Summary</h3>
              <p>Total Expenses: {expenses.length}</p>
              <p>Last expense: {expenses[0] ? `${expenses[0].title} - $${expenses[0].price}` : "—"}</p>
            </div>
          </div>

          {/* Middle column - Charts */}
          <div className="bg-white rounded shadow p-4 lg:col-span-2">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 min-h-[240px]">
                <h3 className="font-medium mb-2">Expense Summary</h3>
                {summaryData.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={summaryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                        {summaryData.map((entry) => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || "#cccccc"} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500">No expenses yet</p>
                )}
              </div>

              <div className="flex-1 min-h-[240px]">
                <h3 className="font-medium mb-2">Expense Trends</h3>
                {trendsData.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={trendsData}>
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount">
                        {trendsData.map((entry) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#8884d8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500">No expenses yet</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Expense History</h3>
              <ExpenseList
                expenses={expenses}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            </div>
          </div>
        </div>

        {/* Add Balance Modal */}
        <Modal isOpen={isAddBalanceOpen} onRequestClose={closeAddBalance} contentLabel="Add Balance">
          <div>
            <h2 className="text-xl font-semibold mb-2">Add Balance</h2>
            <form onSubmit={handleAddBalance}>
              <div className="mb-2">
                <input name="amount" type="number" placeholder="Income Amount" className="w-full p-2 border rounded" />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeAddBalance} className="px-3 py-1 border rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Add Balance</button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Add Expense Modal */}
        <Modal isOpen={isAddExpenseOpen} onRequestClose={closeAddExpense} contentLabel="Add Expense">
          <div>
            <h2 className="text-xl font-semibold mb-2">Add Expense</h2>
            <form onSubmit={handleAddExpense}>
              <div className="mb-2">
                <label className="block text-sm">Title</label>
                <input name="title" className="w-full p-2 border rounded" />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Amount</label>
                <input name="price" type="number" className="w-full p-2 border rounded" />
              </div>
              <div className="mb-2">
                <label className="block text-sm">Category</label>
                <select name="category" className="w-full p-2 border rounded">
                  <option value="">Select</option>
                  <option>Food</option>
                  <option>Travel</option>
                  <option>Shopping</option>
                  <option>Bills</option>
                  <option>Entertainment</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="mb-2">
                <label className="block text-sm">Date</label>
                <input name="date" type="date" className="w-full p-2 border rounded" />
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeAddExpense} className="px-3 py-1 border rounded">Cancel</button>
                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Add Expense</button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onRequestClose={closeEdit} contentLabel="Edit Expense">
          <div>
            <h2 className="text-xl font-semibold mb-2">Edit Expense</h2>
            {editingExpense && (
              <form onSubmit={handleEditExpense}>
                <div className="mb-2">
                  <label className="block text-sm">Title</label>
                  <input name="title" defaultValue={editingExpense.title} className="w-full p-2 border rounded" />
                </div>
                <div className="mb-2">
                  <label className="block text-sm">Amount</label>
                  <input name="price" type="number" defaultValue={editingExpense.price} className="w-full p-2 border rounded" />
                </div>
                <div className="mb-2">
                  <label className="block text-sm">Category</label>
                  <select name="category" defaultValue={editingExpense.category} className="w-full p-2 border rounded">
                    <option value="">Select</option>
                    <option>Food</option>
                    <option>Travel</option>
                    <option>Shopping</option>
                    <option>Bills</option>
                    <option>Entertainment</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block text-sm">Date</label>
                  <input name="date" type="date" defaultValue={editingExpense.date} className="w-full p-2 border rounded" />
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={closeEdit} className="px-3 py-1 border rounded">Cancel</button>
                  <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}

function ExpenseList({ expenses, onEdit, onDelete }) {
  if (!expenses.length) return <p className="text-sm text-gray-500">No expenses recorded.</p>;
  return (
    <div className="space-y-2">
      {expenses.map((ex) => (
        <div key={ex.id} className="flex items-center justify-between p-2 border rounded">
          <div>
            <div className="font-medium">{ex.title}</div>
            <div className="text-sm text-gray-600">{ex.category} • {ex.date}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-semibold">${ex.price.toFixed(2)}</div>
            <button onClick={() => onEdit(ex)} aria-label="edit" className="p-2 rounded hover:bg-gray-100">
              <FiEdit />
            </button>
            <button onClick={() => onDelete(ex.id)} aria-label="delete" className="p-2 rounded hover:bg-gray-100">
              <FiTrash2 />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
