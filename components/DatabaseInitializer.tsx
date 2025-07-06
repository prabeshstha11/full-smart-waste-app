import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initializeDatabase } from '../utils/database';

export default function DatabaseInitializer({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDatabase = async () => {
      try {
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Database initialized successfully');
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Database initialization failed');
        // Always set as initialized to not block the app
        setIsInitialized(true);
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!isInitialized) {
        console.warn('Database initialization timed out, continuing anyway');
        setIsInitialized(true);
      }
    }, 5000); // 5 second timeout

    initDatabase();

    return () => clearTimeout(timeoutId);
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (error) {
    console.warn('Database initialization error:', error);
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
}); 