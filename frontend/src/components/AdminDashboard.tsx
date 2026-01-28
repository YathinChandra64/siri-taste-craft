import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Package, DollarSign, Users, AlertCircle, MessageSquare } from "lucide-react";
import  api  from "@/lib/api";
import { useAuth } from "@/contexts/useAuth";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    recentOrders: [],
    dailyRevenue: [],
    issueStats: {},
    orderStatusDistribution: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch all orders
      const ordersResponse = await fetch("http://localhost:5000/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orders = await ordersResponse.json();

      // Fetch all users
      const usersResponse = await fetch("http://localhost:5000/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const users = await usersResponse.json();

      // Fetch issue stats
      const issueResponse = await fetch("http://localhost:5000/api/issues/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const issueStats = await issueResponse.json();

      // Calculate metrics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const pendingOrders = orders.filter(o => o.status === "pending_payment").length;
      const totalCustomers = users.filter(u => u.role === "customer").length;

      // Process daily revenue for chart
      const dailyData = {};
      orders.forEach(order => {
        const date = new Date(order.createdAt).toLocaleDateString();
        dailyData[date] = (dailyData[date] || 0) + (order.totalAmount || 0);
      });

      const dailyRevenue = Object.entries(dailyData)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-30); // Last 30 days

      // Order status distribution
      const statusDistribution = {};
      ["pending_payment", "payment_submitted", "confirmed", "shipped", "delivered"].forEach(status => {
        statusDistribution[status] = orders.filter(o => o.status === status).length;
      });

      const orderStatusDistribution = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }));

      // Recent orders
      const recentOrders = orders.slice(-5).reverse();

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        totalCustomers,
        recentOrders,
        dailyRevenue,
        issueStats,
        orderStatusDistribution
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#9333ea", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome back, {user?.name}! Here's your business overview.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs opacity-75 mt-2">All time</p>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-pink-600 to-pink-900 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Total Orders</h3>
              <Package className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{stats.totalOrders}</p>
            <p className="text-xs opacity-75 mt-2">Orders placed</p>
          </div>

          {/* Pending Payments */}
          <div className="bg-gradient-to-br from-amber-600 to-amber-900 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Pending Payments</h3>
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{stats.pendingOrders}</p>
            <p className="text-xs opacity-75 mt-2">Awaiting payment</p>
          </div>

          {/* Total Customers */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium opacity-90">Total Customers</h3>
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{stats.totalCustomers}</p>
            <p className="text-xs opacity-75 mt-2">Active customers</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Revenue Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#9333ea" dot={{ fill: "#9333ea" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.orderStatusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.orderStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #475569" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Issue Stats */}
          {stats.issueStats.total > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  Issue Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-200">Reported</span>
                    <span className="text-xl font-bold text-amber-400">{stats.issueStats.reported}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-200">In Progress</span>
                    <span className="text-xl font-bold text-blue-400">{stats.issueStats.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-700 rounded-lg">
                    <span className="text-slate-200">Resolved</span>
                    <span className="text-xl font-bold text-green-400">{stats.issueStats.resolved}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Orders */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.recentOrders.map((order) => (
                  <div key={order._id} className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-200">Order #{order._id.slice(-6)}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "delivered" ? "bg-green-600 text-white" :
                        order.status === "pending_payment" ? "bg-amber-600 text-white" :
                        "bg-blue-600 text-white"
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">₹{order.totalAmount.toLocaleString()}</span>
                      <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {stats.recentOrders.length === 0 && (
                  <p className="text-slate-400 text-sm text-center py-4">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;