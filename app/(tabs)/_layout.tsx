import { Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { UserService } from '../../utils/userService';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string>('customer');

  useEffect(() => {
    const loadUserRole = async () => {
      if (user?.id) {
        try {
          const userData = await UserService.getUserFromDatabase(user.id);
          setUserRole(userData?.role || 'customer');
        } catch (error) {
          console.error('Error loading user role:', error);
        }
      }
    };
    loadUserRole();
  }, [user]);

  // Different tab configurations based on user role
  const getTabConfig = () => {
    switch (userRole) {
      case 'dealer':
        return {
          home: { title: 'Orders', icon: 'list' },
          history: { title: 'History', icon: 'time' },
          account: { title: 'Account', icon: 'person' }
        };
      case 'rider':
        return {
          home: { title: 'Deliveries', icon: 'bicycle' },
          history: { title: 'History', icon: 'time' },
          account: { title: 'Account', icon: 'person' }
        };
      default: // customer/user
        return {
          home: { title: 'Home', icon: 'home' },
          history: { title: 'History', icon: 'time' },
          account: { title: 'Account', icon: 'person' }
        };
    }
  };

  const tabConfig = getTabConfig();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4caf50',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
        },
        headerStyle: {
          backgroundColor: '#4caf50',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: tabConfig.home.title,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabConfig.home.icon as any} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: tabConfig.history.title,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabConfig.history.icon as any} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: tabConfig.account.title,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabConfig.account.icon as any} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
