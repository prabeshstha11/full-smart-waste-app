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
  id: string; // User ID
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

// Test post interface
export interface TestPost {
  id: string;
  posted_by: string; // email of the user who posted
  message: string;
  created_at: Date;
}

// Pickup request interface
export interface PickupRequest {
  id: string;
  user_id: string; // Customer who requested pickup
  selected_items: string[]; // Array of item IDs
  quantities: {[key: string]: number}; // Quantities for each item
  pickup_date: Date;
  pickup_time: Date;
  location: string;
  images: string[]; // Array of image URLs
  status: 'pending' | 'offered' | 'accepted' | 'assigned' | 'picked_up' | 'completed';
  dealer_id?: string; // Dealer who accepted
  rider_id?: string; // Rider assigned
  offered_price?: number; // Price offered by dealer
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

    // Create test_posts table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS test_posts (
        id VARCHAR(255) PRIMARY KEY,
        posted_by VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create pickup_requests table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS pickup_requests (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        selected_items JSONB NOT NULL,
        quantities JSONB NOT NULL,
        pickup_date TIMESTAMP NOT NULL,
        pickup_time TIMESTAMP NOT NULL,
        location TEXT NOT NULL,
        images JSONB DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'pending',
        dealer_id VARCHAR(255),
        rider_id VARCHAR(255),
        offered_price DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (dealer_id) REFERENCES users(id),
        FOREIGN KEY (rider_id) REFERENCES users(id)
      )
    `;

    // Add offered_price column if it doesn't exist
    try {
      await sql`ALTER TABLE pickup_requests ADD COLUMN offered_price DECIMAL(10,2)`;
      console.log('Added offered_price column to pickup_requests table');
    } catch (error) {
      // Column already exists, ignore error
      console.log('offered_price column already exists');
    }

    // Create notifications table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        related_id VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
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

// Create dummy users for development
export async function createDummyUsers() {
  try {
    if (!sql) {
      console.log('Database not configured, skipping dummy user creation');
      return;
    }

    const dummyUsers = [
      {
        id: 'dummy_user_001',
        email: 'user@sajilowaste.com',
        first_name: 'User',
        last_name: 'Test',
        role: 'customer'
      },
      {
        id: 'dummy_dealer_001',
        email: 'dealer@sajilowaste.com',
        first_name: 'Dealer',
        last_name: 'Test',
        role: 'dealer'
      },
      {
        id: 'dummy_rider_001',
        email: 'rider@sajilowaste.com',
        first_name: 'Rider',
        last_name: 'Test',
        role: 'rider'
      }
    ];

    for (const user of dummyUsers) {
      await sql`
        INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
        VALUES (${user.id}, ${user.email}, ${user.first_name}, ${user.last_name}, ${user.role}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (id) 
        DO UPDATE SET 
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          role = EXCLUDED.role,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    console.log('Dummy users created successfully');
  } catch (error) {
    console.error('Error creating dummy users:', error);
  }
}

// Get user role by email (for dummy accounts)
export async function getUserRoleByEmail(email: string): Promise<string | null> {
  try {
    if (!sql) {
      console.log('Database not configured, returning null role');
      return null;
    }

    const result = await sql`
      SELECT role FROM users WHERE email = ${email}
    `;
    
    return result[0]?.role || null;
  } catch (error) {
    console.error('Error getting user role by email:', error);
    return null;
  }
}

// Create a test post
export async function createTestPost(postData: {
  id: string;
  posted_by: string;
  message: string;
}): Promise<TestPost> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      INSERT INTO test_posts (id, posted_by, message)
      VALUES (${postData.id}, ${postData.posted_by}, ${postData.message})
      RETURNING *
    `;
    
    console.log('Test post created successfully:', result[0]);
    return result[0] as TestPost;
  } catch (error) {
    console.error('Error creating test post:', error);
    throw error;
  }
}

// Get all test posts
export async function getAllTestPosts(): Promise<TestPost[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT * FROM test_posts 
      ORDER BY created_at DESC
    `;
    
    return result as TestPost[];
  } catch (error) {
    console.error('Error getting all test posts:', error);
    throw error;
  }
}

// Create pickup request
export async function createPickupRequest(requestData: {
  id: string;
  user_id: string;
  selected_items: string[];
  quantities: {[key: string]: number};
  pickup_date: Date;
  pickup_time: Date;
  location: string;
  images?: string[];
}): Promise<PickupRequest> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      INSERT INTO pickup_requests (
        id, user_id, selected_items, quantities, pickup_date, pickup_time, 
        location, images, status, created_at, updated_at
      )
      VALUES (
        ${requestData.id}, ${requestData.user_id}, 
        ${JSON.stringify(requestData.selected_items)}, 
        ${JSON.stringify(requestData.quantities)},
        ${requestData.pickup_date}, ${requestData.pickup_time},
        ${requestData.location}, ${JSON.stringify(requestData.images || [])},
        'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING *
    `;
    
    console.log('Pickup request created successfully:', result[0]);
    return result[0] as PickupRequest;
  } catch (error) {
    console.error('Error creating pickup request:', error);
    throw error;
  }
}

// Get pickup requests by user
export async function getPickupRequestsByUser(userId: string): Promise<PickupRequest[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT * FROM pickup_requests 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    return result as PickupRequest[];
  } catch (error) {
    console.error('Error getting pickup requests by user:', error);
    throw error;
  }
}

// Get all pending pickup requests
export async function getPendingPickupRequests(): Promise<PickupRequest[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT * FROM pickup_requests 
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `;
    
    return result as PickupRequest[];
  } catch (error) {
    console.error('Error getting pending pickup requests:', error);
    throw error;
  }
}

// Update pickup request status
export async function updatePickupRequestStatus(
  requestId: string, 
  status: string, 
  dealerId?: string, 
  riderId?: string
): Promise<PickupRequest> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      UPDATE pickup_requests 
      SET status = ${status}, 
          dealer_id = ${dealerId || null},
          rider_id = ${riderId || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId}
      RETURNING *
    `;
    
    console.log('Pickup request status updated successfully:', result[0]);
    return result[0] as PickupRequest;
  } catch (error) {
    console.error('Error updating pickup request status:', error);
    throw error;
  }
}

// Make offer on pickup request by dealer
export async function makeOfferOnPickupRequest(
  requestId: string, 
  dealerId: string, 
  offeredPrice: number
): Promise<PickupRequest> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      UPDATE pickup_requests 
      SET status = 'offered', 
          dealer_id = ${dealerId},
          offered_price = ${offeredPrice},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId} AND status = 'pending'
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Pickup request not found or already has an offer');
    }
    
    console.log('Offer made successfully:', result[0]);
    return result[0] as PickupRequest;
  } catch (error) {
    console.error('Error making offer:', error);
    throw error;
  }
}

// Accept offer by user
export async function acceptOfferByUser(
  requestId: string
): Promise<PickupRequest> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      UPDATE pickup_requests 
      SET status = 'accepted', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId} AND status = 'offered'
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Offer not found or already accepted');
    }
    
    console.log('Offer accepted successfully:', result[0]);
    return result[0] as PickupRequest;
  } catch (error) {
    console.error('Error accepting offer:', error);
    throw error;
  }
}

// Get pickup requests with offers for user
export async function getPickupRequestsWithOffers(userId: string): Promise<(PickupRequest & { dealer_name: string; dealer_email: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, u.first_name as dealer_name, u.email as dealer_email
      FROM pickup_requests pr
      JOIN users u ON pr.dealer_id = u.id
      WHERE pr.user_id = ${userId} AND pr.status = 'offered'
      ORDER BY pr.updated_at DESC
    `;
    
    return result as (PickupRequest & { dealer_name: string; dealer_email: string })[];
  } catch (error) {
    console.error('Error getting pickup requests with offers:', error);
    throw error;
  }
}

// Get accepted pickup requests for riders
export async function getAcceptedPickupRequests(): Promise<(PickupRequest & { customer_name: string; customer_email: string; dealer_name: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, 
             c.first_name as customer_name, c.email as customer_email,
             d.first_name as dealer_name
      FROM pickup_requests pr
      JOIN users c ON pr.user_id = c.id
      JOIN users d ON pr.dealer_id = d.id
      WHERE pr.status = 'accepted'
      ORDER BY pr.updated_at DESC
    `;
    
    return result as (PickupRequest & { customer_name: string; customer_email: string; dealer_name: string })[];
  } catch (error) {
    console.error('Error getting accepted pickup requests:', error);
    throw error;
  }
}

// Get dealer's requested pickup requests
export async function getDealerRequestedPickupRequests(dealerId: string): Promise<(PickupRequest & { customer_name: string; customer_email: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, c.first_name as customer_name, c.email as customer_email
      FROM pickup_requests pr
      JOIN users c ON pr.user_id = c.id
      WHERE pr.dealer_id = ${dealerId} AND pr.status = 'offered'
      ORDER BY pr.updated_at DESC
    `;
    
    return result as (PickupRequest & { customer_name: string; customer_email: string })[];
  } catch (error) {
    console.error('Error getting dealer requested pickup requests:', error);
    throw error;
  }
}

// Create notification
export async function createNotification(notificationData: {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
}): Promise<any> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      INSERT INTO notifications (id, user_id, title, message, type, related_id, created_at)
      VALUES (${notificationData.id}, ${notificationData.user_id}, ${notificationData.title}, ${notificationData.message}, ${notificationData.type}, ${notificationData.related_id || null}, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    console.log('Notification created successfully:', result[0]);
    return result[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Get pending pickup requests with user information
export async function getPendingPickupRequestsWithUser(): Promise<(PickupRequest & { customer_name: string; customer_email: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, u.first_name as customer_name, u.email as customer_email
      FROM pickup_requests pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.status = 'pending'
      ORDER BY pr.created_at ASC
    `;
    
    return result as (PickupRequest & { customer_name: string; customer_email: string })[];
  } catch (error) {
    console.error('Error getting pending pickup requests with user:', error);
    throw error;
  }
}

// Get user notifications
export async function getUserNotifications(userId: string): Promise<any[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT * FROM notifications 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    
    return result as any[];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<any> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      UPDATE notifications 
      SET is_read = TRUE
      WHERE id = ${notificationId}
      RETURNING *
    `;
    
    return result[0];
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${userId} AND is_read = FALSE
    `;
    
    return parseInt(result[0].count);
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
}

// Assign rider to pickup request
export async function assignRiderToPickupRequest(
  requestId: string, 
  riderId: string
): Promise<PickupRequest> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      UPDATE pickup_requests 
      SET status = 'assigned', 
          rider_id = ${riderId},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId} AND status = 'accepted'
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Pickup request not found or not in accepted status');
    }
    
    console.log('Rider assigned successfully:', result[0]);
    return result[0] as PickupRequest;
  } catch (error) {
    console.error('Error assigning rider:', error);
    throw error;
  }
}

// Get assigned pickup requests for a specific rider
export async function getAssignedPickupRequests(riderId: string): Promise<(PickupRequest & { customer_name: string; customer_email: string; dealer_name: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, 
             c.first_name as customer_name, c.email as customer_email,
             d.first_name as dealer_name
      FROM pickup_requests pr
      JOIN users c ON pr.user_id = c.id
      JOIN users d ON pr.dealer_id = d.id
      WHERE pr.rider_id = ${riderId} AND pr.status = 'assigned'
      ORDER BY pr.updated_at DESC
    `;
    
    return result as (PickupRequest & { customer_name: string; customer_email: string; dealer_name: string })[];
  } catch (error) {
    console.error('Error getting assigned pickup requests:', error);
    throw error;
  }
}

// Complete pickup request (mark as completed)
export async function completePickupRequest(requestId: string): Promise<PickupRequest> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      UPDATE pickup_requests 
      SET status = 'completed', 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${requestId} AND status = 'assigned'
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new Error('Pickup request not found or not in assigned status');
    }
    
    console.log('Pickup request completed successfully:', result[0]);
    return result[0] as PickupRequest;
  } catch (error) {
    console.error('Error completing pickup request:', error);
    throw error;
  }
}

// Get completed pickup requests for a dealer
export async function getCompletedPickupRequests(dealerId: string): Promise<(PickupRequest & { customer_name: string; customer_email: string; rider_name: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, 
             c.first_name as customer_name, c.email as customer_email,
             r.first_name as rider_name
      FROM pickup_requests pr
      JOIN users c ON pr.user_id = c.id
      LEFT JOIN users r ON pr.rider_id = r.id
      WHERE pr.dealer_id = ${dealerId} AND pr.status = 'completed'
      ORDER BY pr.updated_at DESC
    `;
    
    return result as (PickupRequest & { customer_name: string; customer_email: string; rider_name: string })[];
  } catch (error) {
    console.error('Error getting completed pickup requests:', error);
    throw error;
  }
}

// Get completed pickup requests for a user
export async function getCompletedPickupRequestsForUser(userId: string): Promise<(PickupRequest & { dealer_name: string; rider_name: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, 
             d.first_name as dealer_name,
             r.first_name as rider_name
      FROM pickup_requests pr
      LEFT JOIN users d ON pr.dealer_id = d.id
      LEFT JOIN users r ON pr.rider_id = r.id
      WHERE pr.user_id = ${userId} AND pr.status = 'completed'
      ORDER BY pr.updated_at DESC
    `;
    
    return result as (PickupRequest & { dealer_name: string; rider_name: string })[];
  } catch (error) {
    console.error('Error getting completed pickup requests for user:', error);
    throw error;
  }
}

// Get accepted notification count for user
export async function getAcceptedNotificationCount(userId: string): Promise<number> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ${userId} AND type = 'dealer_offer' AND is_read = FALSE
    `;
    
    return parseInt(result[0].count);
  } catch (error) {
    console.error('Error getting accepted notification count:', error);
    throw error;
  }
}

// Get accepted pickup requests for a dealer
export async function getAcceptedPickupRequestsForDealer(dealerId: string): Promise<(PickupRequest & { customer_name: string; customer_email: string })[]> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      SELECT pr.*, c.first_name as customer_name, c.email as customer_email
      FROM pickup_requests pr
      JOIN users c ON pr.user_id = c.id
      WHERE pr.dealer_id = ${dealerId} AND pr.status = 'accepted'
      ORDER BY pr.updated_at DESC
    `;
    
    return result as (PickupRequest & { customer_name: string; customer_email: string })[];
  } catch (error) {
    console.error('Error getting accepted pickup requests for dealer:', error);
    throw error;
  }
}

// Mark all notifications as read for a user
export async function markAllNotificationsAsRead(userId: string): Promise<any> {
  try {
    if (!sql) {
      throw new Error('Database not configured');
    }

    const result = await sql`
      UPDATE notifications 
      SET is_read = TRUE
      WHERE user_id = ${userId} AND is_read = FALSE
      RETURNING *
    `;
    
    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
} 