import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Shield, User as UserIcon, Search, CheckCircle, AlertCircle } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Input } from "@/components/ui/input";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  createdAt: string;
};

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/users", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showNotification("error", "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setActionLoading(userId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        fetchUsers();
        showNotification("success", `User promoted to ${newRole}`);
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      showNotification("error", "Failed to update user role");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) return;

    setActionLoading(userId);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchUsers();
        showNotification("success", `User ${userName} deleted`);
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      showNotification("error", "Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-900">
              <span className="text-sm font-bold text-blue-700 dark:text-blue-200">USER MANAGEMENT</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Manage Users</h1>
          <p className="text-muted-foreground">Promote customers to admins or remove users from the system</p>
        </motion.div>

        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              notification.type === "success"
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span className="font-medium">{notification.message}</span>
          </motion.div>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 py-6"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <UserIcon size={40} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </Card>
            ) : (
              filteredUsers.map((u, index) => (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between gap-6">
                      {/* User Info */}
                      <div className="flex-1 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-saree flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{u.name}</h3>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                        </div>
                      </div>

                      {/* Role Badge */}
                      <div className="flex items-center gap-3">
                        <div className={`px-4 py-2 rounded-full font-semibold flex items-center gap-2 ${
                          u.role === "admin"
                            ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                            : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        }`}>
                          {u.role === "admin" && <Shield size={16} />}
                          <span className="capitalize">{u.role}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {u._id !== currentUser?.id && (
                            <>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  onClick={() => updateUserRole(u._id, u.role === "admin" ? "customer" : "admin")}
                                  disabled={actionLoading === u._id}
                                  className={u.role === "admin"
                                    ? "bg-orange-600 hover:bg-orange-700"
                                    : "bg-purple-600 hover:bg-purple-700"
                                  }
                                >
                                  {actionLoading === u._id ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                    />
                                  ) : (
                                    <>{u.role === "admin" ? "Remove Admin" : "Make Admin"}</>
                                  )}
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteUser(u._id, u.name)}
                                  disabled={actionLoading === u._id}
                                >
                                  {actionLoading === u._id ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                    />
                                  ) : (
                                    <><Trash2 size={16} /></>
                                  )}
                                </Button>
                              </motion.div>
                            </>
                          )}
                          {u._id === currentUser?.id && (
                            <span className="text-sm text-muted-foreground italic">That's you</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;