import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';

const slides = [
  { 
    title: 'The Smartest Waste Management Platform', 
    subtitle: 'Discover the best prices to recycle your waste with Sajilo Waste.',
    image: require('../assets/images/onboarding1.png')
  },
  { 
    title: 'Never Waste Your Waste, RECYCLE IT.', 
    subtitle: 'Sajilo Waste will find you the best dealers who will buy your waste.',
    image: require('../assets/images/onboarding2.png')
  },
  { 
    title: 'Smart waste, smart returns.', 
    subtitle: 'Our dealer will offer the best price, and our rider will pick it up for you.',
    image: require('../assets/images/onboarding3.png')
  },
];

interface SplashAndOnboardingProps {
  onComplete: () => void;
}

const SplashAndOnboarding = ({ onComplete }: SplashAndOnboardingProps) => {
  const [showSplash, setShowSplash] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      const threshold = 50;

      if (translationX > threshold && slideIndex > 0) {
        // Swipe right - go to previous slide
        setSlideIndex(slideIndex - 1);
      } else if (translationX < -threshold && slideIndex < slides.length - 1) {
        // Swipe left - go to next slide
        setSlideIndex(slideIndex + 1);
      }
    }
  };

  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Image 
          source={require('../assets/images/splash-icon.png')} 
          style={styles.splashIcon}
          resizeMode="contain"
        />
        {/* <Text style={styles.splashText}>My App</Text> */}
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={onGestureEvent}>
        <View style={styles.onboardingContainer}>
          {/* Skip Button */}
          {slideIndex < 2 && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={onComplete}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
          
          {/* Image */}
          <Image 
            source={slides[slideIndex].image} 
            style={styles.slideImage}
            resizeMode="contain"
          />
          
          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.slideTitle}>{slides[slideIndex].title}</Text>
            <Text style={styles.slideSubtitle}>{slides[slideIndex].subtitle}</Text>
          </View>
          
          {/* Dots */}
          <View style={styles.dotsContainer}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, slideIndex === i && styles.activeDot]}
              />
            ))}
          </View>
          
          {/* Full Width Button */}
          <TouchableOpacity
            style={styles.fullWidthButton}
            onPress={() => {
              if (slideIndex < slides.length - 1) {
                setSlideIndex(slideIndex + 1);
              } else {
                // Complete onboarding and show get-started page
                onComplete();
              }
            }}
          >
            <Text style={styles.buttonText}>
              {slideIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4caf50',
  },
  splashIcon: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  splashText: {
    fontSize: 40,
    color: '#fff',
    fontWeight: 'bold',
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '600',
  },
  slideImage: {
    width: width * 0.8,
    height: height * 0.4,
    alignSelf: 'center',
    marginTop: 100,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
    lineHeight: 32,
  },
  slideSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#4caf50',
  },
  fullWidthButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SplashAndOnboarding; 