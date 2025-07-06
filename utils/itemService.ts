import {
    acceptItem,
    assignRider,
    createItem,
    createTransaction,
    getAvailableItems,
    getAvailableRiders,
    getItemsAssignedToRider,
    getItemsByUser,
    getTransactionsByUser,
    Item,
    Transaction,
    updateItemStatus
} from './database';

// Service to handle item operations
export class ItemService {
  // Create new item
  static async createNewItem(itemData: {
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
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const item = await createItem({
        id: itemId,
        ...itemData
      });
      
      console.log('Item created successfully:', item);
      return item;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  // Get available items for dealers
  static async getAvailableItemsForDealers(): Promise<Item[]> {
    try {
      const items = await getAvailableItems();
      console.log('Available items retrieved:', items);
      return items;
    } catch (error) {
      console.error('Error getting available items:', error);
      throw error;
    }
  }

  // Get user's items
  static async getUserItems(userId: string): Promise<Item[]> {
    try {
      const items = await getItemsByUser(userId);
      console.log('User items retrieved:', items);
      return items;
    } catch (error) {
      console.error('Error getting user items:', error);
      throw error;
    }
  }

  // Get user's history (completed/cancelled items)
  static async getUserHistory(userId: string): Promise<Item[]> {
    try {
      const items = await getItemsByUser(userId);
      const historyItems = items.filter(item => 
        item.status === 'completed' || item.status === 'cancelled'
      );
      console.log('User history retrieved:', historyItems);
      return historyItems;
    } catch (error) {
      console.error('Error getting user history:', error);
      throw error;
    }
  }

  // Get dealer's history (processed orders)
  static async getDealerHistory(dealerId: string): Promise<Item[]> {
    try {
      const items = await getItemsByUser(dealerId);
      const historyItems = items.filter(item => 
        item.status === 'completed' || item.status === 'cancelled' || item.status === 'picked_up'
      );
      console.log('Dealer history retrieved:', historyItems);
      return historyItems;
    } catch (error) {
      console.error('Error getting dealer history:', error);
      throw error;
    }
  }

  // Get rider's history (completed deliveries)
  static async getRiderHistory(riderId: string): Promise<Item[]> {
    try {
      const items = await getItemsByUser(riderId);
      const historyItems = items.filter(item => 
        item.status === 'completed' || item.status === 'cancelled'
      );
      console.log('Rider history retrieved:', historyItems);
      return historyItems;
    } catch (error) {
      console.error('Error getting rider history:', error);
      throw error;
    }
  }

  // Get items assigned to rider
  static async getAssignedItems(riderId: string): Promise<Item[]> {
    try {
      const items = await getItemsAssignedToRider(riderId);
      console.log('Assigned items retrieved:', items);
      return items;
    } catch (error) {
      console.error('Error getting assigned items:', error);
      throw error;
    }
  }

  // Accept item by dealer
  static async acceptItemByDealer(itemId: string, dealerId: string): Promise<{ item: Item; transaction: Transaction }> {
    try {
      // Accept the item
      const item = await acceptItem(itemId, dealerId);
      
      // Create transaction
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const transaction = await createTransaction({
        id: transactionId,
        item_id: itemId,
        customer_id: item.user_id,
        dealer_id: dealerId
      });
      
      console.log('Item accepted and transaction created:', { item, transaction });
      
      // TODO: Send notification to customer
      this.notifyCustomer(item.user_id, `Your item "${item.title}" has been accepted by a dealer!`);
      
      return { item, transaction };
    } catch (error) {
      console.error('Error accepting item:', error);
      throw error;
    }
  }

  // Assign rider to accepted item
  static async assignRiderToItem(itemId: string, riderId: string): Promise<Item> {
    try {
      const item = await assignRider(itemId, riderId);
      
      console.log('Rider assigned to item:', item);
      
      // TODO: Send notification to rider
      this.notifyRider(riderId, `You have been assigned to pick up item: ${item.title}`);
      
      // TODO: Send notification to customer
      this.notifyCustomer(item.user_id, `A rider has been assigned to pick up your item: ${item.title}`);
      
      return item;
    } catch (error) {
      console.error('Error assigning rider:', error);
      throw error;
    }
  }

  // Get available riders
  static async getAvailableRidersList(): Promise<any[]> {
    try {
      const riders = await getAvailableRiders();
      console.log('Available riders retrieved:', riders);
      return riders;
    } catch (error) {
      console.error('Error getting available riders:', error);
      throw error;
    }
  }

  // Get user transactions
  static async getUserTransactions(userId: string): Promise<Transaction[]> {
    try {
      const transactions = await getTransactionsByUser(userId);
      console.log('User transactions retrieved:', transactions);
      return transactions;
    } catch (error) {
      console.error('Error getting user transactions:', error);
      throw error;
    }
  }

  // Pick up item by rider
  static async pickupItem(itemId: string): Promise<Item> {
    try {
      const item = await updateItemStatus(itemId, 'picked_up');
      
      console.log('Item picked up successfully:', item);
      
      // TODO: Send notification to customer
      this.notifyCustomer(item.user_id, `Your item "${item.title}" has been picked up by the rider!`);
      
      // TODO: Send notification to dealer
      if (item.dealer_id) {
        this.notifyDealer(item.dealer_id, `Item "${item.title}" has been picked up by the rider.`);
      }
      
      return item;
    } catch (error) {
      console.error('Error picking up item:', error);
      throw error;
    }
  }

  // Complete item delivery
  static async completeItem(itemId: string): Promise<Item> {
    try {
      const item = await updateItemStatus(itemId, 'completed');
      
      console.log('Item completed successfully:', item);
      
      // TODO: Send notification to customer
      this.notifyCustomer(item.user_id, `Your item "${item.title}" has been delivered successfully!`);
      
      // TODO: Send notification to dealer
      if (item.dealer_id) {
        this.notifyDealer(item.dealer_id, `Item "${item.title}" has been delivered successfully.`);
      }
      
      return item;
    } catch (error) {
      console.error('Error completing item:', error);
      throw error;
    }
  }

  // Notification system (placeholder - can be integrated with push notifications later)
  static notifyCustomer(userId: string, message: string) {
    console.log(`📱 Notification to customer ${userId}: ${message}`);
    // TODO: Integrate with push notification service
  }

  static notifyRider(riderId: string, message: string) {
    console.log(`📱 Notification to rider ${riderId}: ${message}`);
    // TODO: Integrate with push notification service
  }

  static notifyDealer(dealerId: string, message: string) {
    console.log(`📱 Notification to dealer ${dealerId}: ${message}`);
    // TODO: Integrate with push notification service
  }
} 