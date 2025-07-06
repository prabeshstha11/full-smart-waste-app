import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ChooseRole() {
  const handleRoleSelect = (role: string) => {
    // Navigate to role-specific home page
    router.push(`/${role.toLowerCase()}-home`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you want to use Sajilo Waste</Text>
      </View>

      <View style={styles.rolesContainer}>
        <TouchableOpacity 
          style={styles.roleCard} 
          onPress={() => handleRoleSelect('Customer')}
        >
          <View style={styles.roleIcon}>
            <Ionicons name="person-outline" size={40} color="#4CAF50" />
          </View>
          <Text style={styles.roleTitle}>Customer</Text>
          <Text style={styles.roleDescription}>
            Sell your waste and earn money
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.roleCard} 
          onPress={() => handleRoleSelect('Dealer')}
        >
          <View style={styles.roleIcon}>
            <Ionicons name="business-outline" size={40} color="#4CAF50" />
          </View>
          <Text style={styles.roleTitle}>Dealer</Text>
          <Text style={styles.roleDescription}>
            Buy waste from customers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.roleCard} 
          onPress={() => handleRoleSelect('Rider')}
        >
          <View style={styles.roleIcon}>
            <Ionicons name="bicycle-outline" size={40} color="#4CAF50" />
          </View>
          <Text style={styles.roleTitle}>Rider</Text>
          <Text style={styles.roleDescription}>
            Pick up and deliver waste
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roleIcon: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 