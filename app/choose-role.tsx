import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserService } from '../utils/userService';

const roles = [
  {
    id: 'customer',
    title: 'Customer',
    description: 'I want to sell my waste',
    icon: '🏠',
  },
  {
    id: 'dealer',
    title: 'Dealer',
    description: 'I want to buy waste',
    icon: '🏪',
  },
  {
    id: 'rider',
    title: 'Rider',
    description: 'I want to collect waste',
    icon: '🚚',
  },
];

export default function ChooseRole() {
  const [selectedRole, setSelectedRole] = useState('');
  const router = useRouter();
  const { user } = useUser();

  const handleContinue = async () => {
    if (selectedRole && user) {
      try {
        console.log('Saving role to Clerk and database:', selectedRole);
        
        // Save role to Clerk metadata
        await user.update({
          unsafeMetadata: { role: selectedRole },
        });
        
        // Save role to database
        await UserService.syncUserToDatabase({
          id: user.id,
          emailAddresses: user.emailAddresses,
          firstName: user.firstName,
          lastName: user.lastName,
          unsafeMetadata: { role: selectedRole },
          role: selectedRole,
        });
        
        console.log('Role saved successfully');
        router.push('/welcome');
      } catch (error) {
        console.error('Error saving role:', error);
        Alert.alert('Error', 'Failed to save role. Please try again.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>What would you like to do with Sajilo Waste?</Text>
      </View>

      <View style={styles.rolesContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              styles.roleCard,
              selectedRole === role.id && styles.selectedRoleCard,
            ]}
            onPress={() => setSelectedRole(role.id)}
          >
            <Text style={styles.roleIcon}>{role.icon}</Text>
            <Text style={styles.roleTitle}>{role.title}</Text>
            <Text style={styles.roleDescription}>{role.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.continueButton,
          !selectedRole && styles.disabledButton,
        ]}
        onPress={handleContinue}
        disabled={!selectedRole}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    gap: 16,
  },
  roleCard: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  selectedRoleCard: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 