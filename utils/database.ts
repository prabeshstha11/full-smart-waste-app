import { neon } from '@neondatabase/serverless';
import Constants from 'expo-constants';

// Get database URL from environment variables
const DATABASE_URL = Constants.expoConfig?.extra?.DATABASE_URL || process.env.DATABASE_URL;

// Initialize database connection only if URL is available
let sql: any = null;

if (DATABASE_URL) {
  sql = neon(DATABASE_URL);
} else {
  console.warn('DATABASE_URL not configured. Database operations will be disabled.');
}

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

// Item interface
export interface Item {
  id: string;
  user_id: string; // Customer who posted
  title: string;
  description: string;
  price: number;
  location_lat: number;
  location_lng: number;
  category?: string;
  quantity?: string;
  image_url?: string;
  status: 'available' | 'accepted' | 'picked_up' | 'completed';
  dealer_id?: string; // Dealer who accepted
  rider_id?: string; // Rider assigned
  created_at: Date;
  updated_at: Date;
}

// Transaction interface
export interface Transaction {
  id: string;
  item_id: string;
  customer_id: string;
  dealer_id: string;
  rider_id?: string;
  status: 'pending' | 'accepted' | 'picked_up' | 'completed';
  created_at: Date;
  updated_at: Date;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    if (!sql) {
      console.log('Database not configured, skipping initialization');
      return;
    }

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

    // Create items table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS items (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        location_lat DECIMAL(10,8) NOT NULL,
        location_lng DECIMAL(11,8) NOT NULL,
        category VARCHAR(100),
        quantity VARCHAR(50),
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'available',
        dealer_id VARCHAR(255),
        rider_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (dealer_id) REFERENCES users(id),
        FOREIGN KEY (rider_id) REFERENCES users(id)
      )
    `;

    // Create transactions table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(255) PRIMARY KEY,
        item_id VARCHAR(255) NOT NULL,
        customer_id VARCHAR(255) NOT NULL,
        dealer_id VARCHAR(255) NOT NULL,
        rider_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id),
        FOREIGN KEY (customer_id) REFERENCES users(id),
        FOREIGN KEY (dealer_id) REFERENCES users(id),
        FOREIGN KEY (rider_id) REFERENCES users(id)
      )
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    // Don't throw error to prevent app from crashing
    console.warn('Continuing without database initialization');
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
    if (!sql) {
      throw new Error('Database not configured');
    }

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
    if (!sql) {
      throw new Error('Database not configured');
    }

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
    if (!sql) {
      throw new Error('Database not configured');
    }

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
    if (!sql) {
      throw new Error('Database not configured');
    }

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
    if (!sql) {
      throw new Error('Database not configured');
    }

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
    if (!sql) {
      throw new Error('Database not configured');
    }

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

// Create new item
export async function createItem(itemData: {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  location_lat: number;
  location_lng: number;
  category?: string;
  quantity?: string;
  image_url?: string;
}): Promise<Item> {
  try {
    const result = await sql`
      INSERT INTO items (id, user_id, title, description, price, location_lat, location_lng, category, quantity, image_url)
      VALUES (${itemData.id}, ${itemData.user_id}, ${itemData.title}, ${itemData.description}, ${itemData.price}, ${itemData.location_lat}, ${itemData.location_lng}, ${itemData.category || null}, ${itemData.quantity || null}, ${itemData.image_url || null})
      RETURNING *
    `;
    
    console.log('Item created successfully:', result[0]);
    return result[0] as Item;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
}

// Get all available items
export async function getAvailableItems(): Promise<Item[]> {
  try {
    const result = await sql`
      SELECT i.*, u.first_name as customer_name, u.email as customer_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'available'
      ORDER BY i.created_at DESC
    `;
    
    return result as Item[];
  } catch (error) {
    console.error('Error getting available items:', error);
    throw error;
  }
}

// Get items by user
export async function getItemsByUser(userId: string): Promise<Item[]> {
  try {
    const result = await sql`
      SELECT * FROM items WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    
    return result as Item[];
  } catch (error) {
    console.error('Error getting items by user:', error);
    throw error;
  }
}

// Get items assigned to rider
export async function getItemsAssignedToRider(riderId: string): Promise<Item[]> {
  try {
    const result = await sql`
      SELECT i.*, u.first_name as customer_name, u.email as customer_email
      FROM items i
      JOIN users u ON i.user_id = u.id
      WHERE i.rider_id = ${riderId} AND i.status IN ('accepted', 'picked_up')
      ORDER BY i.created_at DESC
    `;
    
    return result as Item[];
  } catch (error) {
    console.error('Error getting items assigned to rider:', error);
    throw error;
  }
}

// Accept item by dealer
export async function acceptItem(itemId: string, dealerId: string): Promise<Item> {
  try {
    const result = await sql`
      UPDATE items 
      SET status = 'accepted', dealer_id = ${dealerId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${itemId} AND status = 'available'
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Item not found or already accepted');
    }
    
    console.log('Item accepted successfully:', result[0]);
    return result[0] as Item;
  } catch (error) {
    console.error('Error accepting item:', error);
    throw error;
  }
}

// Assign rider to item
export async function assignRider(itemId: string, riderId: string): Promise<Item> {
  try {
    const result = await sql`
      UPDATE items 
      SET rider_id = ${riderId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${itemId} AND status = 'accepted'
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Item not found or not accepted');
    }
    
    console.log('Rider assigned successfully:', result[0]);
    return result[0] as Item;
  } catch (error) {
    console.error('Error assigning rider:', error);
    throw error;
  }
}

// Update item status
export async function updateItemStatus(itemId: string, status: string): Promise<Item> {
  try {
    const result = await sql`
      UPDATE items 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${itemId}
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Item not found');
    }
    
    console.log('Item status updated successfully:', result[0]);
    return result[0] as Item;
  } catch (error) {
    console.error('Error updating item status:', error);
    throw error;
  }
}

// Get available riders
export async function getAvailableRiders(): Promise<User[]> {
  try {
    const result = await sql`
      SELECT * FROM users WHERE role = 'rider' ORDER BY created_at DESC
    `;
    
    return result as User[];
  } catch (error) {
    console.error('Error getting available riders:', error);
    throw error;
  }
}

// Create transaction
export async function createTransaction(transactionData: {
  id: string;
  item_id: string;
  customer_id: string;
  dealer_id: string;
}): Promise<Transaction> {
  try {
    const result = await sql`
      INSERT INTO transactions (id, item_id, customer_id, dealer_id)
      VALUES (${transactionData.id}, ${transactionData.item_id}, ${transactionData.customer_id}, ${transactionData.dealer_id})
      RETURNING *
    `;
    
    console.log('Transaction created successfully:', result[0]);
    return result[0] as Transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// Get transactions by user
export async function getTransactionsByUser(userId: string): Promise<Transaction[]> {
  try {
    const result = await sql`
      SELECT t.*, i.title as item_title, i.price as item_price
      FROM transactions t
      JOIN items i ON t.item_id = i.id
      WHERE t.customer_id = ${userId} OR t.dealer_id = ${userId} OR t.rider_id = ${userId}
      ORDER BY t.created_at DESC
    `;
    
    return result as Transaction[];
  } catch (error) {
    console.error('Error getting transactions by user:', error);
    throw error;
  }
} 