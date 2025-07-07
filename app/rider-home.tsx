import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { getAcceptedPickupRequests, updatePickupRequestStatus } from '../utils/database';
import { PickupRequest } from '../utils/database';

export default function RiderHome() {
  const [activeTab, setActiveTab] = useState('new');
  const [acceptedRequests, setAcceptedRequests] = useState<(PickupRequest & { customer_name: string; customer_email: string; dealer_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const requestsData = await getAcceptedPickupRequests();
      setAcceptedRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const handleAssignRider = async (requestId: string) => {
    try {
      // For now, using a dummy rider ID. In a real app, this would come from authentication
      const riderId = 'dummy_rider_001';
      await updatePickupRequestStatus(requestId, 'picked_up', undefined, riderId);
      Alert.alert('Success', 'Rider assigned successfully');
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error assigning rider:', error);
      Alert.alert('Error', 'Failed to assign rider');
    }
  };

  const renderNewContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Orders</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="bicycle-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No new orders</Text>
          <Text style={styles.emptySubtext}>New orders will appear here when customers accept dealer offers</Text>
        </View>
      </View>
    </View>
  );

  const renderMyOrdersContent = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Orders</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : acceptedRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No orders assigned</Text>
            <Text style={styles.emptySubtext}>Orders will appear here when you are assigned</Text>
          </View>
        ) : (
          acceptedRequests.map((request) => (
            <View key={request.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderTitle}>Pickup Order</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Accepted</Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Customer: {request.customer_name || 'Customer'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="business-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Dealer: {request.dealer_name || 'Dealer'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{request.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {new Date(request.pickup_date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {new Date(request.pickup_time).toLocaleTimeString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="list-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Items: {request.selected_items.join(', ')}
                  </Text>
                </View>
                {request.offered_price && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cash-outline" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      Price: ₹{request.offered_price}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.assignButton}
                onPress={() => handleAssignRider(request.id)}
              >
                <Text style={styles.assignButtonText}>Assign to Me</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>Sajilo Waste</Text>
          <Text style={styles.riderText}>(Rider)</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {activeTab === 'new' && renderNewContent()}
      {activeTab === 'myOrders' && renderMyOrdersContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'new' && styles.navItemActive]} 
          onPress={() => setActiveTab('new')}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={24} 
            color={activeTab === 'new' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'new' && styles.navTextActive]}>New</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'myOrders' && styles.navItemActive]} 
          onPress={() => setActiveTab('myOrders')}
        >
          <Ionicons 
            name="list-outline" 
            size={24} 
            color={activeTab === 'myOrders' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'myOrders' && styles.navTextActive]}>My Orders</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  riderText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  assignButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
}); 