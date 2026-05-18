export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  password?: string;
  role: 'user' | 'hr' | 'employee'; // Only these 3 roles
  avatar?: string;
  permissions?: string[];
  department?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'user' | 'hr' | 'employee';
}
