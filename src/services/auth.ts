// FIREBASE_AUTH_PLACEHOLDER
// Firebase + Firestore integration will be added later.
// When implemented:
// - Sign in with email/password via Firebase Auth
// - Check user role in Firestore users collection
// - role: "employee" → redirect to /employee
// - role: "dpo" → redirect to /dpo
// For now: simulate with hardcoded test accounts or skip auth check.

export type UserRole = "employee" | "dpo";

export interface SignedInUser {
  email: string;
  name: string;
  role: UserRole;
}

export const signIn = async (email: string, _password: string): Promise<SignedInUser> => {
  // Placeholder: route by email convention. Anything containing "dpo" → DPO.
  const role: UserRole = email.toLowerCase().includes("dpo") ? "dpo" : "employee";
  const name = email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return { email, name, role };
};
