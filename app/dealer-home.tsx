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
import { getAvailableItems, acceptItem, getAvailableRiders, assignRider } from '../utils/database';
import { Item, User } from '../utils/database';

export default function DealerHome() {
  const [activeTab, setActiveTab] = useState('home');
  const [pendingItems, setPendingItems] = useState<Item[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, ridersData] = await Promise.all([
        getAvailableItems(),
        getAvailableRiders()
      ]);
      setPendingItems(itemsData);
      setRiders(ridersData);
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

  const handleProfilePress = () => {
    router.push('/dealer-profile');
  };

  const handleAcceptItem = async (itemId: string) => {
    try {
      // For now, using a dummy dealer ID. In a real app, this would come from authentication
      const dealerId = 'dummy_dealer_001';
      await acceptItem(itemId, dealerId);
      Alert.alert('Success', 'Item accepted successfully');
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error accepting item:', error);
      Alert.alert('Error', 'Failed to accept item');
    }
  };

  const handleAssignRider = async (itemId: string, riderId: string) => {
    try {
      await assignRider(itemId, riderId);
      Alert.alert('Success', 'Rider assigned successfully');
      loadData(); // Refresh the list
    } catch (error) {
      console.error('Error assigning rider:', error);
      Alert.alert('Error', 'Failed to assign rider');
    }
  };

  const renderHomeContent = () => (
    <ScrollView 
      style={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending Pickup Requests</Text>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading pending requests...</Text>
          </View>
        ) : pendingItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No pending requests</Text>
            <Text style={styles.emptySubtext}>All requests have been processed</Text>
          </View>
        ) : (
          pendingItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Pending</Text>
                </View>
              </View>
              
              <Text style={styles.itemDescription}>{item.description}</Text>
              
              <View style={styles.itemDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>₹{item.price}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {item.location_lat.toFixed(4)}, {item.location_lng.toFixed(4)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {(item as any).customer_name || 'Customer'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => handleAcceptItem(item.id)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
                
                {riders.length > 0 && (
                  <TouchableOpacity 
                    style={styles.assignButton}
                    onPress={() => {
                      Alert.alert(
                        'Assign Rider',
                        'Select a rider to assign:',
                        riders.map(rider => ({
                          text: `${rider.first_name} ${rider.last_name}`,
                          onPress: () => handleAssignRider(item.id, rider.id)
                        }))
                      );
                    }}
                  >
                    <Text style={styles.assignButtonText}>Assign Rider</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );

  const renderHistoryContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No transaction history</Text>
          <Text style={styles.emptySubtext}>Your completed transactions will appear here</Text>
        </View>
      </View>
    </View>
  );

  const renderActivityContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.emptyContainer}>
          <Ionicons name="pulse-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No recent activity</Text>
          <Text style={styles.emptySubtext}>Your recent activities will appear here</Text>
        </View>
      </View>
    </View>
  );

  const renderRidersContent = () => (
    <View style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Riders</Text>
        {riders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No riders available</Text>
            <Text style={styles.emptySubtext}>Riders will appear here when they register</Text>
          </View>
        ) : (
          riders.map((rider) => (
            <View key={rider.id} style={styles.riderCard}>
              <View style={styles.riderInfo}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderInitial}>
                    {rider.first_name?.charAt(0) || rider.email?.charAt(0) || 'R'}
                  </Text>
                </View>
                <View style={styles.riderDetails}>
                  <Text style={styles.riderName}>
                    {rider.first_name && rider.last_name 
                      ? `${rider.first_name} ${rider.last_name}`
                      : 'Rider'
                    }
                  </Text>
                  <Text style={styles.riderEmail}>{rider.email}</Text>
                </View>
              </View>
              <View style={styles.riderStatus}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.statusText}>Available</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>Sajilo Waste</Text>
          <Text style={styles.dealerText}>(Dealer)</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon} onPress={handleProfilePress}>
            <Ionicons name="person-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {activeTab === 'home' && renderHomeContent()}
      {activeTab === 'history' && renderHistoryContent()}
      {activeTab === 'activity' && renderActivityContent()}
      {activeTab === 'riders' && renderRidersContent()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} 
          onPress={() => setActiveTab('home')}
        >
          <Ionicons 
            name="home-outline" 
            size={24} 
            color={activeTab === 'home' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'history' && styles.navItemActive]} 
          onPress={() => setActiveTab('history')}
        >
          <Ionicons 
            name="time-outline" 
            size={24} 
            color={activeTab === 'history' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'history' && styles.navTextActive]}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'activity' && styles.navItemActive]} 
          onPress={() => setActiveTab('activity')}
        >
          <Ionicons 
            name="pulse-outline" 
            size={24} 
            color={activeTab === 'activity' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'activity' && styles.navTextActive]}>Activity</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'riders' && styles.navItemActive]} 
          onPress={() => setActiveTab('riders')}
        >
          <Ionicons 
            name="people-outline" 
            size={24} 
            color={activeTab === 'riders' ? '#4CAF50' : '#666'} 
          />
          <Text style={[styles.navText, activeTab === 'riders' && styles.navTextActive]}>Riders</Text>
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
  dealerText: {
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
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FFA726',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  itemDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  assignButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  riderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  riderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  riderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riderInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  riderEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  riderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
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