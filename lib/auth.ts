export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

const USERS_KEY = "second-brain-users";
const SESSION_KEY = "second-brain-session";

function canUseStorage() {
  return typeof window !== "undefined";
}

function sanitizeUser(user: AuthUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function loadUsers(): AuthUser[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as AuthUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSessionUser(): SessionUser | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearSessionUser() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): { ok: true; user: SessionUser } | { ok: false; message: string } {
  const users = loadUsers();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return { ok: false, message: "这个邮箱已经注册过了。" };
  }

  const user: AuthUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    password: input.password,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  const sessionUser = sanitizeUser(user);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return { ok: true, user: sessionUser };
}

export function loginUser(input: {
  email: string;
  password: string;
}): { ok: true; user: SessionUser } | { ok: false; message: string } {
  const users = loadUsers();
  const normalizedEmail = input.email.trim().toLowerCase();
  const found = users.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === input.password,
  );

  if (!found) {
    return { ok: false, message: "邮箱或密码不正确。" };
  }

  const sessionUser = sanitizeUser(found);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
  return { ok: true, user: sessionUser };
}
