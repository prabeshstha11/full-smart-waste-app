import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { createTestPost, getAllTestPosts, TestPost } from '@/utils/database';

export default function CustomerHome() {
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState<TestPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);
  const [currentUser] = useState('user@sajilowaste.com'); // Dummy user email

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

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLogout = async () => {
    router.push('/login');
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
      await loadPosts(); // Reload posts to show the new one
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Customer Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Hello User!</Text>
        <Text style={styles.description}>
          Welcome to Sajilo Waste
        </Text>
        <Text style={styles.userInfo}>
          Logged in as: {currentUser}
        </Text>

        {/* Test Post Section */}
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

        {/* Posts Display */}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  userInfo: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
}); 