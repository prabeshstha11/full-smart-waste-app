import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createTestPost, getAcceptedNotificationCount, getAllTestPosts, TestPost } from '../utils/database';

export default function CustomerHome() {
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState<TestPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [currentUser] = useState('user@sajilowaste.com');
  const [location, setLocation] = useState<string>('Location not available');
  const [locationLoading, setLocationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [notificationCount, setNotificationCount] = useState(0);

  const loadPosts = async () => {
    try {
      setPostsLoading(true);
      const allPosts = await getAllTestPosts();
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const userId = 'dummy_user_001'; // In a real app, this would come from authentication
      const count = await getAcceptedNotificationCount(userId);
      setNotificationCount(count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  useEffect(() => {
    loadPosts();
    getCurrentLocation();
    loadNotificationCount();
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to show your current location.');
        setLocation('Location access denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        setLocation(`${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim());
      } else {
        setLocation('Current Location');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocation('Location unavailable');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleProfilePress = () => {
    router.push('/customer-profile');
  };

  const handleNotificationPress = () => {
    router.push('/user-notifications');
  };

  const handlePost = async () => {
    if (!message.trim()) return;
    
    try {
      setLoading(true);
      const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await createTestPost({
        id: postId,
        posted_by: currentUser,
        message: message.trim()
      });
      
      setMessage('');
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleNow = () => {
    router.push('/pickup-schedule');
  };

  const renderHomeContent = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Location Section */}
      <View style={styles.locationSection}>
        <TouchableOpacity style={styles.locationContainer} onPress={getCurrentLocation}>
          <Ionicons name="location-outline" size={20} color="#4CAF50" />
          <Text style={styles.locationText}>
            {locationLoading ? 'Getting location...' : location}
          </Text>
          <Ionicons name="refresh-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Main Message */}
      <View style={styles.mainMessageSection}>
        <Text style={styles.mainMessage}>Waste Management Starts with you!</Text>
      </View>

      {/* How it Works */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.stepTitle}>Segregate Waste</Text>
            <Text style={styles.stepDescription}>Separate your waste into categories</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.stepTitle}>Schedule Pickup</Text>
            <Text style={styles.stepDescription}>Book a pickup time that suits you</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="car-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.stepTitle}>Pickup</Text>
            <Text style={styles.stepDescription}>Our rider collects your waste</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepIcon}>
              <Ionicons name="cash-outline" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.stepTitle}>Earn</Text>
            <Text style={styles.stepDescription}>Get paid for your recyclables</Text>
          </View>
        </View>
      </View>

      {/* Schedule Now Button */}
      <View style={styles.scheduleSection}>
        <TouchableOpacity style={styles.scheduleButton} onPress={handleScheduleNow}>
          <Text style={styles.scheduleButtonText}>Schedule Now</Text>
        </TouchableOpacity>
      </View>

      {/* Test Post Section (Hidden by default, can be shown later) */}
      {false && (
        <>
          <View style={styles.testSection}>
            <Text style={styles.sectionTitle}>Test Post</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your test message..."
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity 
                style={[styles.postButton, loading && styles.postButtonDisabled]}
                onPress={handlePost}
                disabled={loading || !message.trim()}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.postButtonText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.postsSection}>
            <Text style={styles.sectionTitle}>All Test Posts</Text>
            {postsLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" />
            ) : (
              <ScrollView style={styles.postsList} showsVerticalScrollIndicator={false}>
                {posts.map((post) => (
                  <View key={post.id} style={styles.postItem}>
                    <Text style={styles.postMessage}>{post.message}</Text>
                    <Text style={styles.postInfo}>
                      Posted by: {post.posted_by}
                    </Text>
                    <Text style={styles.postDate}>
                      {new Date(post.created_at).toLocaleString()}
                    </Text>
                  </View>
                ))}
                {posts.length === 0 && (
                  <Text style={styles.noPosts}>No posts yet. Be the first to post!</Text>
                )}
              </ScrollView>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderHistoryContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>History</Text>
      <Text style={styles.tabDescription}>Your pickup history will appear here</Text>
    </View>
  );

  const renderActivityContent = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Activity</Text>
      <Text style={styles.tabDescription}>Your recent activities will appear here</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>Sajilo Waste</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleNotificationPress}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
              </View>
            )}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 20,
    padding: 4,
    position: 'relative',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  locationSection: {
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  locationText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  mainMessageSection: {
    marginBottom: 30,
  },
  mainMessage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
  },
  howItWorksSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    flex: 2,
  },
  scheduleSection: {
    marginBottom: 20,
  },
  scheduleButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  tabDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Test post styles (hidden by default)
  testSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  postsSection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postsList: {
    flex: 1,
  },
  postItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 12,
  },
  postMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  postInfo: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noPosts: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 