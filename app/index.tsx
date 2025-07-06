import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentOnboardingStep, setCurrentOnboardingStep] = useState(0);

  const onboardingData = [
    {
      image: require('../assets/images/onboarding1.png'),
      title: 'The Smartest Waste Management Platform',
      subtitle: 'Discover the best prices to recycle your waste with Sajilo Waste.',
      buttonText: 'Next'
    },
    {
      image: require('../assets/images/onboarding2.png'),
      title: 'Never Waste Your Waste, RECYCLE IT.',
      subtitle: 'Sajilo Waste will find you the best dealers who will buy your waste.',
      buttonText: 'Next'
    },
    {
      image: require('../assets/images/onboarding3.png'),
      title: 'Smart waste, smart returns.',
      subtitle: 'Our dealer will offer the best price, and our rider will pick it up for you.',
      buttonText: 'Get Started'
    }
  ];

  useEffect(() => {
    const initializeApp = async () => {
      // Show splash for 3 seconds
      setTimeout(async () => {
        try {
          // Clear any existing onboarding state to ensure onboarding shows
          await AsyncStorage.removeItem('hasSeenOnboarding');
          
          // Always show onboarding for now
          setShowOnboarding(true);
          console.log('Index: Showing onboarding');
        } catch (error) {
          console.error('Error initializing app:', error);
          setShowOnboarding(true);
        }
        
        setIsLoading(false);
      }, 3000); // 3 seconds
    };

    initializeApp();
  }, []);

  const handleOnboardingNext = async () => {
    if (currentOnboardingStep < onboardingData.length - 1) {
      setCurrentOnboardingStep(currentOnboardingStep + 1);
    } else {
      // Last step - complete onboarding and go to register
      try {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        console.log('Index: Onboarding completed, going to register');
        router.push('/register');
      } catch (error) {
        console.error('Error saving onboarding status:', error);
      }
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      console.log('Index: Onboarding skipped, going to register');
      router.push('/register');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  // Show splash screen
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require('../assets/images/splash-icon.png')} 
          style={styles.splashIcon}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Show onboarding
  if (showOnboarding) {
    const currentData = onboardingData[currentOnboardingStep];
    
    return (
      <View style={styles.onboardingContainer}>
        {/* Skip button for first two screens */}
        {currentOnboardingStep < 2 && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        <View style={styles.onboardingContent}>
          <View style={styles.imageContainer}>
            <Image 
              source={currentData.image} 
              style={styles.onboardingImage}
              resizeMode="contain"
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.onboardingTitle}>{currentData.title}</Text>
            <Text style={styles.onboardingSubtitle}>{currentData.subtitle}</Text>
          </View>
          
          {/* Progress bar above button */}
          <View style={styles.progressContainer}>
            {[0, 1, 2].map((index) => (
              <View
                key={index}
                style={[
                  styles.progressBar,
                  index === currentOnboardingStep ? styles.progressBarActive : styles.progressBarInactive
                ]}
              />
            ))}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleOnboardingNext}
            >
              <Text style={styles.buttonText}>{currentData.buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // This should not be reached, but just in case
  return (
    <View style={styles.splashContainer}>
      <Image 
        source={require('../assets/images/splash-icon.png')} 
        style={styles.splashIcon}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  splashIcon: {
    width: 120,
    height: 120,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  onboardingContent: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 80,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 0,
  },
  onboardingImage: {
    width: width * 0.8,
    height: width * 0.6,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  onboardingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  onboardingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    width: 30,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressBarActive: {
    backgroundColor: '#4CAF50',
  },
  progressBarInactive: {
    backgroundColor: '#E0E0E0',
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 