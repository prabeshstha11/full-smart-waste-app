import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { ItemService } from '../../utils/itemService';
import { UserService } from '../../utils/userService';

export default function History() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string>('customer');
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadHistory();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      const userData = await UserService.getUserFromDatabase(user?.id || '');
      setUserRole(userData?.role || 'customer');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadHistory = async () => {
    try {
      if (user?.id) {
        let items;
        switch (userRole) {
          case 'dealer':
            items = await ItemService.getDealerHistory(user.id);
            break;
          case 'rider':
            items = await ItemService.getRiderHistory(user.id);
            break;
          default:
            items = await ItemService.getUserHistory(user.id);
        }
        setHistoryItems(items);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'cancelled':
        return '#f44336';
      case 'picked_up':
        return '#2196f3';
      case 'accepted':
        return '#ff9800';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'cancelled':
        return 'close-circle';
      case 'picked_up':
        return 'bicycle';
      case 'accepted':
        return 'hand-left';
      default:
        return 'time';
    }
  };

  const renderHistoryItem = (item: any) => (
    <View key={item.id} style={styles.historyCard}>
      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} />
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemPrice}>Rs {item.price}</Text>
        
        <View style={styles.itemMeta}>
          <View style={styles.statusContainer}>
            <Ionicons 
              name={getStatusIcon(item.status) as any} 
              size={16} 
              color={getStatusColor(item.status)} 
            />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(item.status) }
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {userRole === 'dealer' && item.rider_name && (
          <Text style={styles.riderInfo}>
            Assigned to: {item.rider_name}
          </Text>
        )}

        {userRole === 'rider' && item.customer_name && (
          <Text style={styles.customerInfo}>
            Customer: {item.customer_name}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptySubtitle}>
        {userRole === 'dealer' && "You haven't processed any orders yet"}
        {userRole === 'rider' && "You haven't completed any deliveries yet"}
        {userRole === 'customer' && "You haven't posted any orders yet"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userRole === 'dealer' && 'Order History'}
          {userRole === 'rider' && 'Delivery History'}
          {userRole === 'customer' && 'Order History'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {userRole === 'dealer' && 'Track all processed orders'}
          {userRole === 'rider' && 'View completed deliveries'}
          {userRole === 'customer' && 'View your order history'}
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {historyItems.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.historyList}>
            {historyItems.map(renderHistoryItem)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4caf50',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e8f5e8',
  },
  content: {
    flex: 1,
  },
  historyList: {
    padding: 20,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  itemContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 12,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  riderInfo: {
    fontSize: 12,
    color: '#2196f3',
    fontStyle: 'italic',
  },
  customerInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 