import { Address } from "@/types/checkout";

// ✅ FIXED: Corrected the API base URL - removed incorrect import
const API_BASE_URL = "http://localhost:5000/api";
const API_URL = `${API_BASE_URL}/addresses`;

/**
 * Helper function to check if response is JSON before parsing
 */
const parseJsonResponse = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get("content-type");
  
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    console.error("❌ Non-JSON response received:", {
      contentType,
      status: response.status,
      text: text.substring(0, 200)
    });
    throw new Error(`Expected JSON response but got ${contentType || 'unknown'} (Status: ${response.status})`);
  }
  
  return response.json();
};

/**
 * ✅ FIXED: Get all addresses for the authenticated user
 */
export const getAddressAPI = async (): Promise<Address[]> => {
  try {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      console.warn("⚠️ No auth token found in localStorage");
      throw new Error("Authentication required. Please login first.");
    }
    
    const response = await fetch(`${API_URL}/`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await parseJsonResponse(response) as { message?: string };
      throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
    }

    const data = await parseJsonResponse(response) as { addresses?: Address[], data?: Address[] };
    return data.addresses || data.data || [];
  } catch (error) {
    console.error("❌ Error fetching addresses:", error);
    throw error;
  }
};

/**
 * ✅ FIXED: Get a single address by ID
 */
export const getSingleAddressAPI = async (addressId: string): Promise<Address> => {
  try {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    const response = await fetch(`${API_URL}/${addressId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await parseJsonResponse(response) as { message?: string };
      throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
    }

    const data = await parseJsonResponse(response) as { address?: Address, data?: Address };
    return data.address || (data.data as Address) || ({} as Address);
  } catch (error) {
    console.error("❌ Error fetching single address:", error);
    throw error;
  }
};

/**
 * ✅ FIXED: Add a new address with proper validation
 */
export const addAddressAPI = async (address: Address): Promise<Address> => {
  try {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    // Validate required fields
    if (!address.fullName || !address.houseFlat || !address.city || !address.state || !address.pincode) {
      throw new Error("All address fields are required");
    }

    const response = await fetch(`${API_URL}/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(address)
    });

    if (!response.ok) {
      const errorData = await parseJsonResponse(response) as { message?: string };
      throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
    }

    const data = await parseJsonResponse(response) as { address?: Address, data?: Address };
    return data.address || (data.data as Address) || ({} as Address);
  } catch (error) {
    console.error("❌ Error adding address:", error);
    throw error;
  }
};

/**
 * ✅ FIXED: Update an existing address
 */
export const updateAddressAPI = async (addressId: string, address: Partial<Address>): Promise<Address> => {
  try {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    const response = await fetch(`${API_URL}/${addressId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(address)
    });

    if (!response.ok) {
      const errorData = await parseJsonResponse(response) as { message?: string };
      throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
    }

    const data = await parseJsonResponse(response) as { address?: Address, data?: Address };
    return data.address || (data.data as Address) || ({} as Address);
  } catch (error) {
    console.error("❌ Error updating address:", error);
    throw error;
  }
};

/**
 * ✅ FIXED: Delete an address with proper return type
 */
export const deleteAddressAPI = async (addressId: string): Promise<{ success: boolean }> => {
  try {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    const response = await fetch(`${API_URL}/${addressId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await parseJsonResponse(response) as { message?: string };
      throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
    }

    const data = await parseJsonResponse(response) as { success?: boolean };
    return { success: data?.success || true };
  } catch (error) {
    console.error("❌ Error deleting address:", error);
    throw error;
  }
};

/**
 * ✅ FIXED: Set an address as default
 */
export const setDefaultAddressAPI = async (addressId: string): Promise<Address> => {
  try {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    const response = await fetch(`${API_URL}/${addressId}/default`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await parseJsonResponse(response) as { message?: string };
      throw new Error(errorData?.message || `HTTP Error: ${response.status}`);
    }

    const data = await parseJsonResponse(response) as { address?: Address, data?: Address };
    return data.address || (data.data as Address) || ({} as Address);
  } catch (error) {
    console.error("❌ Error setting default address:", error);
    throw error;
  }
};