import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { getAllUsers, updateUserRole, deleteUser, createUserRecord } from "@/lib/users";
import { adminCreateUser } from "@/lib/auth";
import { User } from "@/lib/supabase";
import { Trash2, Plus, Loader2 } from "lucide-react";

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [saving, setSaving] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "staff">("staff");
  const { signup } = useAuth();

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError("");
      const { users: loadedUsers, error: usersError } = await getAllUsers();
      if (usersError) {
        setError(usersError);
      } else {
        setUsers(loadedUsers);
      }
      setLoading(false);
    };

    loadUsers();
  }, []);

  const refreshUsers = async () => {
    const { users: loadedUsers, error: usersError } = await getAllUsers();
    if (usersError) {
      setError(usersError);
    } else {
      setUsers(loadedUsers);
      setError("");
    }
  };

  const handleCreateUser = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please enter name, email and password.");
      return;
    }

    setSaving(true);
    setError("");

    // Try to actually sign them up so they get a login account via throwaway client
    const { error: signUpError } = await adminCreateUser(email.trim(), password.trim(), name.trim(), role);
    
    if (signUpError) {
       console.error("SignUp Error:", signUpError);
       setError(`Signup failed: ${signUpError}`);
       setSaving(false);
       return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");

    await refreshUsers();
    setSaving(false);
  };

  const handleEditUserSubmit = async () => {
     if (!editingUser || !editName.trim()) return;
     setError("");
     const { user: updatedRole, error: roleError } = await updateUserRole(editingUser.id, editRole);
     if (roleError) {
       setError(roleError);
       return;
     }
     
     // Simple trick: We just reuse create record logic which updates Name by email
     await createUserRecord(editName.trim(), editingUser.email, editRole);
     
     setEditingUser(null);
     await refreshUsers();
  };

  const handleRoleChange = async (id: string, newRole: "admin" | "staff") => {
    setError("");
    const { user: updated, error: roleError } = await updateUserRole(id, newRole);
    if (roleError) {
      setError(roleError);
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === id ? updated! : u)));
  };

  const handleDeleteUser = async (id: string) => {
    if (user?.id === id) {
      setError("You cannot delete your own account here.");
      return;
    }
    if (!window.confirm("Delete this user?")) {
      return;
    }
    setError("");
    const { success, error: deleteError } = await deleteUser(id);
    if (deleteError) {
      setError(deleteError);
      return;
    }
    if (success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <Layout title="User Management">
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Manage Users</h2>
            <p className="text-sm text-muted-foreground">Edit user roles and remove users from the system.</p>
          </div>
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-base font-semibold mb-4">Add New Staff</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm text-foreground bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm text-foreground bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm text-foreground bg-background focus:ring-2 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "staff")} className="w-full rounded-lg border px-4 py-2 text-sm text-foreground bg-background focus:ring-2 focus:ring-primary outline-none">
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={handleCreateUser} disabled={saving} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create User
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Active Users</h3>
              <p className="text-sm text-muted-foreground">{users.length} user(s) in the system</p>
            </div>
            <button type="button" onClick={refreshUsers} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted transition">
              <Plus className="w-4 h-4" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found.</div>
          ) : (
            <div className="grid gap-3">
              {users.map((account) => (
                <div key={account.id} className="rounded-3xl border bg-background p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                    <p className="text-xs text-muted-foreground">Created: {new Date(account.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select value={account.role} onChange={(e) => handleRoleChange(account.id, e.target.value as "admin" | "staff")} className="rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none">
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => { setEditingUser(account); setEditName(account.name); setEditRole(account.role); }} className="rounded-lg border px-3 py-2 text-sm hover:bg-muted transition font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteUser(account.id)} className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setEditingUser(null)}>
           <div className="bg-card rounded-xl border p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-lg mb-4">Edit User</h3>
              <div className="space-y-4">
                 <div>
                    <label className="text-sm text-muted-foreground block mb-2">Name</label>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 outline-none" />
                 </div>
                 <div>
                    <label className="text-sm text-muted-foreground block mb-2">Role</label>
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value as "admin"|"staff")} className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-2 outline-none">
                       <option value="staff">Staff</option>
                       <option value="admin">Admin</option>
                    </select>
                 </div>
                 <p className="text-xs text-muted-foreground italic mb-2">* Password cannot be edited here due to permissions.</p>
                 <div className="flex gap-2">
                    <button onClick={() => setEditingUser(null)} className="flex-1 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition">Cancel</button>
                    <button onClick={handleEditUserSubmit} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition">Save</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default UsersPage;
