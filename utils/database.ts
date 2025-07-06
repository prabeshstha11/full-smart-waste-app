import { neon } from '@neondatabase/serverless';
import Constants from 'expo-constants';

// Get database URL from environment variables
const DATABASE_URL = Constants.expoConfig?.extra?.DATABASE_URL || process.env.DATABASE_URL;

// Initialize database connection
const sql = neon(DATABASE_URL!);

// User interface
export interface User {
  id: string; // Clerk user ID
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Create or update user
export async function upsertUser(userData: {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}): Promise<User> {
  try {
    const result = await sql`
      INSERT INTO users (id, email, first_name, last_name, role, updated_at)
      VALUES (${userData.id}, ${userData.email}, ${userData.first_name || null}, ${userData.last_name || null}, ${userData.role || 'customer'}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, users.first_name),
        last_name = COALESCE(EXCLUDED.last_name, users.last_name),
        role = COALESCE(EXCLUDED.role, users.role),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    console.log('User upserted successfully:', result[0]);
    return result[0] as User;
  } catch (error) {
    console.error('Error upserting user:', error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    
    return result[0] as User || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    
    return result[0] as User || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

// Update user role
export async function updateUserRole(id: string, role: string): Promise<User> {
  try {
    const result = await sql`
      UPDATE users 
      SET role = ${role}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;
    
    console.log('User role updated successfully:', result[0]);
    return result[0] as User;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await sql`
      SELECT * FROM users ORDER BY created_at DESC
    `;
    
    return result as User[];
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

// Delete user
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM users WHERE id = ${id}
    `;
    
    console.log('User deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
} 