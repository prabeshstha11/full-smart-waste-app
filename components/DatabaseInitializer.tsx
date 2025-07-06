import { createDummyUsers, initializeDatabase } from '@/utils/database';
import { useEffect } from 'react';

export default function DatabaseInitializer() {
  useEffect(() => {
    const setupDatabase = async () => {
      try {
        console.log('Initializing database...');
        await initializeDatabase();
        
        console.log('Creating dummy users...');
        await createDummyUsers();
        
        console.log('Database setup completed successfully');
      } catch (error) {
        console.error('Error setting up database:', error);
      }
    };

    setupDatabase();
  }, []);

  return null; // This component doesn't render anything
} 