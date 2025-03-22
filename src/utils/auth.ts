export interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  isRoot: boolean;
  createdByRoot?: boolean; // Track if user was created by root
  password?: string; // Para a versão de demonstração
}

export const isAuthenticated = (): boolean => {
  const user = localStorage.getItem('current_user');
  return !!user;
};

export const getUserData = (): User | null => {
  const userStr = localStorage.getItem("current_user");
  if (!userStr) return null;
  return JSON.parse(userStr);
};

export const login = (username: string, password: string): boolean => {
  // Em um app real, iríamos validar com o backend
  // Esta é uma versão simplificada para demo
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    localStorage.setItem('auth_token', 'demo_token_' + Date.now());
    localStorage.setItem('current_user', JSON.stringify(user));
    return true;
  }
  
  return false;
};

export const logout = (): void => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');
};

export const registerUser = (username: string, isAdmin: boolean): User => {
  const currentUser = getUserData();
  const isRootCreating = currentUser?.username === "root";
  
  const newUser: User = {
    id: Date.now().toString(),
    username,
    password: "password", // Senha padrão
    isAdmin,
    isRoot: false, // Usuários criados pelo sistema nunca são root
    createdByRoot: isRootCreating // Mark if created by root
  };
  
  const updatedUsers = [...getUsers(), newUser];
  localStorage.setItem("users", JSON.stringify(updatedUsers));
  
  return newUser;
};

export const getAllUsers = (): User[] => {
  const usersStr = localStorage.getItem("users");
  return usersStr ? JSON.parse(usersStr) : [];
};

export const removeUser = (id: string): void => {
  const usersStr = localStorage.getItem("users");
  if (!usersStr) return;
  
  const users: User[] = JSON.parse(usersStr);
  const updatedUsers = users.filter(user => user.id !== id);
  
  localStorage.setItem("users", JSON.stringify(updatedUsers));
};

export const isAdmin = (): boolean => {
  const user = getUserData();
  return user?.isAdmin || false;
};

export const isRoot = (): boolean => {
  const user = getUserData();
  return user?.isRoot === true;
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('current_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
};

// New function to check if the current user can manage users
export const canManageUsers = (): boolean => {
  const user = getUserData();
  // Only root can manage users
  return user?.username === "root";
};

// New function to check if the user is a leader who can add devotionals
export const isLeader = (): boolean => {
  const user = getUserData();
  // All admin users (including root) are considered leaders
  return user?.isAdmin || false;
};

export const getUsers = (): User[] => {
  const usersStr = localStorage.getItem('users');
  if (!usersStr) {
    // Inicializa com usuários padrão
    const defaultUsers = [
      { id: '1', username: 'admin', password: 'admin123', isAdmin: true, isRoot: true },
      { id: '2', username: 'user', password: 'user123', isAdmin: false, isRoot: false }
    ];
    localStorage.setItem('users', JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  
  return JSON.parse(usersStr);
};

export const createUser = (user: Omit<User, 'id'>): User => {
  const users = getUsers();
  const newUser = { 
    ...user, 
    id: Date.now().toString() 
  };
  
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  return newUser;
};

export const updateUser = (id: string, userData: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) return null;
  
  users[index] = { ...users[index], ...userData };
  localStorage.setItem('users', JSON.stringify(users));
  
  return users[index];
};
