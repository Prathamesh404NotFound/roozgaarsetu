import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ref, get, update, remove } from "firebase/database";
import { Search, Loader2, ArrowLeft, Mail, Calendar, User, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { database } from "@/lib/firebase";
import { toast } from "sonner";

interface UserObj {
  id: string;
  email: string;
  displayName: string;
  role: "client" | "worker" | "admin";
  createdAt?: string;
  lastLoginAt?: string;
}

interface FirebaseUser {
  email?: string;
  displayName?: string;
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserObj[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<"client" | "worker" | "admin">("client");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snap = await get(ref(database, "users"));
        if (snap.exists()) {
          const data = snap.val();
          const list: UserObj[] = Object.entries(data).map(([id, u]: [string, FirebaseUser]) => ({
            id,
            email: u.email ?? "",
            displayName: u.displayName ?? "",
            role: (u.role === "client" || u.role === "worker" || u.role === "admin") ? u.role : "client",
            createdAt: u.createdAt,
            lastLoginAt: u.lastLoginAt,
          }));
          setUsers(list);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const name = u.displayName.toLowerCase();
    const email = u.email.toLowerCase();
    const role = u.role.toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || email.includes(query) || role.includes(query);
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "worker":
        return "bg-green-100 text-green-700 border-green-200";
      case "client":
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const handleRoleChange = async (uid: string, role: "client" | "worker" | "admin") => {
    setEditingUser(uid);
    try {
      await update(ref(database, `users/${uid}`), { role });
      setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role } : u)));
      toast.success(`User role updated to ${role}`);
    } catch (err) {
      console.error("Failed to update role:", err);
      toast.error("Failed to update user role");
    } finally {
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setDeletingId(uid);
    try {
      await remove(ref(database, `users/${uid}`));
      setUsers((prev) => prev.filter((u) => u.id !== uid));
      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <section className="bg-gradient-hero py-10 lg:py-14">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="font-heading text-2xl font-bold text-white">Users</h1>
            <p className="text-white/70">Search and view roles of all registered users</p>
          </motion.div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="container space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm outline-none ring-ring transition focus:ring-2"
              />
            </div>
            <div className="text-sm text-muted-foreground sm:text-right">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              No users found matching your search.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Created At</th>
                      <th className="px-6 py-4">Last Login</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-y-border">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="transition hover:bg-muted/10">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{u.displayName || "Unknown User"}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" /> {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${getRoleBadge(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {u.createdAt ? (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(u.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {u.lastLoginAt ? (
                            <span>{new Date(u.lastLoginAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}</span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {editingUser === u.id ? (
                              <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value as "client" | "worker" | "admin")}
                                onBlur={() => handleRoleChange(u.id, newRole)}
                                className="text-xs rounded border border-border bg-background px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="client">Client</option>
                                <option value="worker">Worker</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingUser(u.id);
                                  setNewRole(u.role);
                                }}
                                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                title="Edit role"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={deletingId === u.id || u.role === "admin"}
                              className="rounded p-1.5 text-destructive hover:bg-destructive/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete user"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AdminUsersPage;
