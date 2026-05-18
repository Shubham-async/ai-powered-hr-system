import { authClient } from "./axiosClient";
import { LoginCredentials, RegisterData, User } from "@/types/user";

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await authClient.post("/auth/login", credentials);
    // Backend returns: { message, user: {...}, token }
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await authClient.post("/auth/register", data);
    // Backend returns: { message, user: {...}, token }
    return response.data;
  },

  validateToken: async (): Promise<{ message: string; user: User }> => {
    const response = await authClient.get("/auth/me");
    // Backend returns: { success: true, user }
    return { message: "Success", user: response.data.user };
  },

  getEmployees: async (): Promise<{ success: boolean; users: User[] }> => {
    const response = await authClient.get("/auth/employees");
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },
};
