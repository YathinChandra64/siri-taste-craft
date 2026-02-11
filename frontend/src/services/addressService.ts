import { Address } from "@/types/checkout";
import API from "@/lib/api";

/**
 * ✅ FIXED: Get all addresses for the authenticated user
 * Uses Axios API instance with automatic token attachment
 */
export const getAddressAPI = async (): Promise<Address[]> => {
  try {
    console.log("🔄 Fetching addresses...");
    const response = await API.get("/addresses");
    
    const data = response.data;
    const addresses = data.addresses || data.data || [];
    
    console.log("✅ Addresses fetched successfully:", addresses.length, "items");
    return Array.isArray(addresses) ? addresses : [];
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
    console.log("🔄 Fetching address:", addressId);
    const response = await API.get(`/addresses/${addressId}`);
    
    const data = response.data;
    const address = data.address || data.data;
    
    console.log("✅ Address fetched successfully:", addressId);
    return address || ({} as Address);
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
    // Validate required fields
    if (!address.fullName || !address.houseFlat || !address.city || !address.state || !address.pincode) {
      throw new Error("All address fields are required");
    }

    console.log("🔄 Adding new address...");
    const response = await API.post("/addresses", address);
    
    const data = response.data;
    const newAddress = data.address || data.data;
    
    console.log("✅ Address added successfully");
    return newAddress || ({} as Address);
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
    console.log("🔄 Updating address:", addressId);
    const response = await API.put(`/addresses/${addressId}`, address);
    
    const data = response.data;
    const updatedAddress = data.address || data.data;
    
    console.log("✅ Address updated successfully:", addressId);
    return updatedAddress || ({} as Address);
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
    console.log("🔄 Deleting address:", addressId);
    await API.delete(`/addresses/${addressId}`);
    
    console.log("✅ Address deleted successfully:", addressId);
    return { success: true };
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
    console.log("🔄 Setting default address:", addressId);
    const response = await API.patch(`/addresses/${addressId}/default`);
    
    const data = response.data;
    const defaultAddress = data.address || data.data;
    
    console.log("✅ Default address set successfully:", addressId);
    return defaultAddress || ({} as Address);
  } catch (error) {
    console.error("❌ Error setting default address:", error);
    throw error;
  }
};