import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const { user } = useUser();
  
  // Use default customer role instead of loading from database
  const userRole = 'customer';

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
