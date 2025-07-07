import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {
    acceptOfferByUser,
    getPickupRequestsWithOffers,
    getUnreadNotificationCount,
    getUserNotifications,
    markAllNotificationsAsRead,
    markNotificationAsRead
} from '../utils/database';

const { width, height } = Dimensions.get('window');

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = 'dummy_user_001'; // In a real app, this would come from authentication
      
      const [notificationsData, offersData, unreadCountData] = await Promise.all([
        getUserNotifications(userId),
        getPickupRequestsWithOffers(userId),
        getUnreadNotificationCount(userId)
      ]);
      
      setNotifications(notificationsData);
      setOffers(offersData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAcceptOffer = async (requestId: string) => {
    try {
      await acceptOfferByUser(requestId);
      Alert.alert('Success', 'Offer accepted successfully!');
      loadData(); // Refresh the data
    } catch (error) {
      console.error('Error accepting offer:', error);
      Alert.alert('Error', 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (requestId: string) => {
    try {
      // In a real app, you'd have a reject function
      Alert.alert('Success', 'Offer rejected successfully!');
      loadData(); // Refresh the data
    } catch (error) {
      console.error('Error rejecting offer:', error);
      Alert.alert('Error', 'Failed to reject offer');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      loadData(); // Refresh to update unread count
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = 'dummy_user_001'; // In a real app, this would come from authentication
      await markAllNotificationsAsRead(userId);
      loadData(); // Refresh to update unread count
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const renderOfferCard = (offer: any) => (
    <View key={offer.id} style={styles.offerCard}>
      {/* Images Section */}
      <View style={styles.imagesSection}>
        <Text style={styles.imagesTitle}>Images:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {offer.images && offer.images.length > 0 ? (
            offer.images.map((imageUrl: string, index: number) => (
              <TouchableOpacity 
                key={`${offer.id}_image_${index}`} 
                style={styles.imageContainer}
                onPress={() => setSelectedImage(imageUrl)}
              >
                <Image source={{ uri: imageUrl }} style={styles.offerImage} />
              </TouchableOpacity>
            ))
          ) : (
            <View key={`${offer.id}_placeholder`} style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={32} color="#ccc" />
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.offerHeader}>
        <Text style={styles.dealerName}>{offer.dealer_name}</Text>
        <Text style={styles.dealerEmail}>{offer.dealer_email}</Text>
        <Text style={styles.offeredPrice}>Offered: Rs.{offer.offered_price}</Text>
      </View>
      
      <View style={styles.itemsSection}>
        <Text style={styles.itemsTitle}>Items:</Text>
        {Array.isArray(offer.selected_items) ? (
          offer.selected_items.map((itemName: string, index: number) => (
            <View key={`${offer.id}_item_${index}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemQuantity}>Qty: {offer.quantities[itemName] || 0}</Text>
            </View>
          ))
        ) : (
          Object.entries(offer.selected_items || {}).map(([itemName, itemData]: [string, any]) => (
            <View key={`${offer.id}_item_${itemName}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{itemName}</Text>
              <Text style={styles.itemQuantity}>Qty: {offer.quantities[itemName] || 0}</Text>
            </View>
          ))
        )}
      </View>
      
      <View style={styles.detailsSection}>
        <Text style={styles.detailText}>
          📅 Pickup Date: {new Date(offer.pickup_date).toLocaleDateString()}
        </Text>
        <Text style={styles.detailText}>
          🕒 Pickup Time: {new Date(offer.pickup_time).toLocaleTimeString()}
        </Text>
        <Text style={styles.detailText}>
          📍 Location: {offer.location}
        </Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOffer(offer.id)}
        >
          <Text style={styles.acceptButtonText}>Accept Offer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectOffer(offer.id)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotificationCard = (notification: any) => (
    <View key={notification.id} style={styles.notificationCard}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationTime}>
          {new Date(notification.created_at).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.notificationMessage}>{notification.message}</Text>
      {!notification.is_read && (
        <View style={styles.unreadIndicator}>
          <Text style={styles.unreadText}>New</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <>
            {/* Dealer Offers Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dealer Offers</Text>
              {offers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No dealer offers</Text>
                  <Text style={styles.emptySubtext}>Dealer offers will appear here</Text>
                </View>
              ) : (
                offers.map(renderOfferCard)
              )}
            </View>

            {/* Notifications Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Notifications</Text>
              {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="notifications-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No notifications</Text>
                  <Text style={styles.emptySubtext}>Notifications will appear here</Text>
                </View>
              ) : (
                notifications.map(renderNotificationCard)
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            onPress={() => setSelectedImage(null)}
          >
            <Image 
              source={{ uri: selectedImage || '' }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Modal>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
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
  offerCard: {
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
  offerHeader: {
    marginBottom: 12,
  },
  dealerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dealerEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  offeredPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 4,
  },
  imagesSection: {
    marginBottom: 16,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  itemsSection: {
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  unreadIndicator: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  modalImage: {
    width: width * 0.9,
    height: height * 0.7,
    borderRadius: 12,
  },
  markAllButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  markAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 