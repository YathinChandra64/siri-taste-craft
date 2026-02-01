import { Address } from "@/types/checkout";
import  API_BASE_URL  from "@/lib/api";  // ✅ FIXED: Named import with curly braces

const API_URL = `${API_BASE_URL}/addresses`;

export const getAddressAPI = async (): Promise<Address[]> => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}/`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch addresses");
  }

  const data = await response.json();
  return data.addresses || [];
};

export const getSingleAddressAPI = async (addressId: string): Promise<Address> => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}/${addressId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch address");
  }

  const data = await response.json();
  return data.address;
};

export const addAddressAPI = async (address: Address): Promise<Address> => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(address)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add address");
  }

  const data = await response.json();
  return data.address;
};

export const updateAddressAPI = async (addressId: string, address: Partial<Address>): Promise<Address> => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}/${addressId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(address)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update address");
  }

  const data = await response.json();
  return data.address;
};

export const deleteAddressAPI = async (addressId: string): Promise<{ success: boolean }> => {  // ✅ FIXED: Added proper return type
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}/${addressId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete address");
  }

  return await response.json();
};

export const setDefaultAddressAPI = async (addressId: string): Promise<Address> => {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${API_URL}/${addressId}/default`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to set default address");
  }

  const data = await response.json();
  return data.address;
};