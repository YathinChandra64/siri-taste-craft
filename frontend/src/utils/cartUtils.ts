// Centralized cart clearing logic
export const clearUserCart = async (): Promise<void> => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Not authenticated");
  
  const response = await fetch("http://localhost:5000/api/cart", {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  
  if (!response.ok) {
    throw new Error("Failed to clear cart");
  }
  
  return response.json();
};