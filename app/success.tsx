import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Success() {
  const router = useRouter();

  const handleGoToSignIn = () => {
    router.push('/signin');
  };

  const handleGoToRegister = () => {
    router.push('/register');
  };

  const handleChooseRole = () => {
    router.push('/choose-role');
  };

  const handleGoToDashboard = () => {
    router.push('/hello-user');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={100} color="#4caf50" />
        <Text style={styles.title}>Success!</Text>
        <Text style={styles.subtitle}>Your account has been created successfully</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.successCard}>
          <Text style={styles.cardTitle}>Welcome to Sajilo Waste</Text>
          <Text style={styles.cardText}>
            Your smart waste management platform. You can now sign in to access your account and start using our services.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What's Next?</Text>
          <Text style={styles.infoText}>• Sign in to your account</Text>
          <Text style={styles.infoText}>• Choose your role (Customer, Dealer, or Rider)</Text>
          <Text style={styles.infoText}>• Start using the platform</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleChooseRole}>
            <Ionicons name="person" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Choose Your Role</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoToSignIn}>
            <Ionicons name="log-in" size={20} color="#4caf50" />
            <Text style={styles.secondaryButtonText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tertiaryButton} onPress={handleGoToRegister}>
            <Ionicons name="person-add" size={20} color="#666" />
            <Text style={styles.tertiaryButtonText}>Create Another Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4caf50',
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#4caf50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tertiaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#666',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  tertiaryButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 