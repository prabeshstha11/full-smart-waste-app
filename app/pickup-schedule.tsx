import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createPickupRequest } from '../utils/database';
import { uploadToCloudinary } from '../utils/cloudinaryService';
import { pickAndUploadImage } from '../utils/cloudinaryUpload';

export default function PickupSchedule() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [pickupTime, setPickupTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000)); // Tomorrow 10 AM
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Getting location...');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [cloudinaryUrls, setCloudinaryUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [quantity, setQuantity] = useState<{[key: string]: number}>({});
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  const wasteCategories = [
    { id: 'paper', name: 'Paper', icon: 'document-outline' },
    { id: 'metal', name: 'Metal', icon: 'construct-outline' },
    { id: 'plastic', name: 'Plastic', icon: 'water-outline' },
    { id: 'glass', name: 'Glass', icon: 'wine-outline' },
    { id: 'can', name: 'Can', icon: 'beer-outline' },
    { id: 'cartoon', name: 'Cartoon', icon: 'cube-outline' },
  ];

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Get current location
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentLocation('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const addr = address[0];
        setCurrentLocation(`${addr.street || ''} ${addr.city || ''} ${addr.region || ''}`.trim());
      } else {
        setCurrentLocation(`${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      }
    } catch (error) {
      setCurrentLocation('Unable to get location');
    }
  };

  // Handle image picking
  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  // Handle quantity changes
  const handleQuantityChange = (itemId: string, increment: boolean) => {
    setQuantity(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + (increment ? 1 : -1))
    }));
  };

  // Handle date/time changes
  const handleDateChange = (newDate: Date) => {
    setPickupDate(newDate);
    setShowDateModal(false);
  };

  const handleTimeChange = (newTime: Date) => {
    setPickupTime(newTime);
    setShowTimeModal(false);
  };

  const openDatePicker = () => {
    setShowDateModal(true);
  };

  const openTimePicker = () => {
    setShowTimeModal(true);
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedItems.length === 0) {
        Alert.alert('Error', 'Please select at least one waste category');
        return;
      }
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 2) {
      // Check if any selected item has zero quantity
      const hasZeroQuantity = selectedItems.some(itemId => (quantity[itemId] || 0) === 0);
      if (hasZeroQuantity) {
        Alert.alert('Error', 'Quantity cannot be zero for selected items. Please set a quantity for all selected waste categories.');
        return;
      }
      if (selectedImages.length === 0) {
        Alert.alert('Error', 'Please upload at least one photo of the waste items');
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  // Update image picking logic to upload to Cloudinary and store URLs
  const handlePickAndUploadImages = async () => {
    const url = await pickAndUploadImage();
    if (url) setSelectedImages(prev => [...prev, url]);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select Waste Categories</Text>
            <Text style={styles.stepDescription}>
              Choose the types of waste you want to recycle
            </Text>
            
            <View style={styles.categoriesGrid}>
              {wasteCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    selectedItems.includes(category.id) && styles.categoryItemSelected
                  ]}
                  onPress={() => handleItemToggle(category.id)}
                >
                  <View style={[
                    styles.categoryIcon,
                    selectedItems.includes(category.id) && styles.categoryIconSelected
                  ]}>
                    <Ionicons 
                      name={category.icon as any} 
                      size={32} 
                      color={selectedItems.includes(category.id) ? '#fff' : '#4CAF50'} 
                    />
                  </View>
                  <Text style={[
                    styles.categoryName,
                    selectedItems.includes(category.id) && styles.categoryNameSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pickup Details</Text>
            <Text style={styles.stepDescription}>
              Configure your pickup preferences
            </Text>
            
            <View style={styles.pickupDetailsContainer}>
              {/* Date and Time Selection */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Pickup Date & Time</Text>
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity 
                    style={styles.dateTimeButton} 
                    onPress={openDatePicker}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
                    <Text style={styles.dateTimeText}>
                      {pickupDate.toLocaleDateString()}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dateTimeButton} 
                    onPress={openTimePicker}
                  >
                    <Ionicons name="time-outline" size={20} color="#4CAF50" />
                    <Text style={styles.dateTimeText}>
                      {pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Location Display */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Pickup Location</Text>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={20} color="#4CAF50" />
                  <Text style={styles.locationText}>{currentLocation}</Text>
                </View>
              </View>

              {/* Quantity Selection for Selected Items */}
              {selectedItems.length > 0 && (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Quantity</Text>
                  {selectedItems.map((itemId) => {
                    const category = wasteCategories.find(cat => cat.id === itemId);
                    const itemQuantity = quantity[itemId] || 0;
                    return (
                      <View key={itemId} style={styles.quantityItem}>
                        <View style={styles.quantityInfo}>
                          <Ionicons name={category?.icon as any} size={20} color="#4CAF50" />
                          <Text style={styles.quantityLabel}>{category?.name}</Text>
                        </View>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(itemId, false)}
                          >
                            <Ionicons name="remove" size={16} color="#666" />
                          </TouchableOpacity>
                          <Text style={[
                            styles.quantityValue,
                            itemQuantity === 0 && styles.quantityValueZero
                          ]}>
                            {itemQuantity}
                          </Text>
                          <TouchableOpacity 
                            style={styles.quantityButton}
                            onPress={() => handleQuantityChange(itemId, true)}
                          >
                            <Ionicons name="add" size={16} color="#666" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Image Upload */}
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Upload Product Photos</Text>
                <Text style={styles.requiredText}>* Required - Please upload photos of the waste items</Text>
                <TouchableOpacity style={styles.addImageButton} onPress={handlePickAndUploadImages}>
                  <Ionicons name="camera-outline" size={24} color="#4CAF50" />
                  <Text style={styles.addImageText}>Upload Photos</Text>
                </TouchableOpacity>
                
                {selectedImages.length > 0 && (
                  <View style={styles.imageGrid}>
                    {selectedImages.map((imageUri, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.selectedImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          <Ionicons name="close-circle" size={20} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Pickup Confirmation</Text>
            <Text style={styles.stepDescription}>
              Review and confirm your pickup request
            </Text>
            
            <View style={styles.confirmationContainer}>
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>Selected Items:</Text>
                <Text style={styles.confirmationValue}>
                  {selectedItems.length > 0 
                    ? selectedItems.map(id => {
                        const category = wasteCategories.find(cat => cat.id === id);
                        const itemQuantity = quantity[id] || 0;
                        return `${category?.name} (${itemQuantity})`;
                      }).join(', ')
                    : 'None selected'
                  }
                </Text>
              </View>
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>Pickup Date:</Text>
                <Text style={styles.confirmationValue}>
                  {pickupDate.toLocaleDateString()} at {pickupTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.confirmationItem}>
                <Text style={styles.confirmationLabel}>Location:</Text>
                <Text style={styles.confirmationValue}>{currentLocation}</Text>
              </View>
              {selectedImages.length > 0 && (
                <View style={styles.confirmationItem}>
                  <Text style={styles.confirmationLabel}>Images:</Text>
                  <Text style={styles.confirmationValue}>{selectedImages.length} photo(s) attached</Text>
                </View>
              )}
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };

  // Calendar-style date picker modal
  const renderDatePicker = () => {
    if (!showDateModal) return null;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get first day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      calendarDays.push(date);
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Pickup Date</Text>
          <Text style={styles.monthYearText}>
            {monthNames[currentMonth]} {currentYear}
          </Text>
          
          {/* Day headers */}
          <View style={styles.calendarHeader}>
            {dayNames.map((day, index) => (
              <Text key={index} style={styles.dayHeader}>{day}</Text>
            ))}
          </View>
          
          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentMonth;
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = date.toDateString() === pickupDate.toDateString();
              const isPast = date < today;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !isCurrentMonth && styles.calendarDayOtherMonth,
                    isToday && styles.calendarDayToday,
                    isSelected && styles.calendarDaySelected,
                    isPast && styles.calendarDayPast
                  ]}
                  onPress={() => !isPast && handleDateChange(date)}
                  disabled={isPast}
                >
                  <Text style={[
                    styles.calendarDayText,
                    !isCurrentMonth && styles.calendarDayTextOtherMonth,
                    isToday && styles.calendarDayTextToday,
                    isSelected && styles.calendarDayTextSelected,
                    isPast && styles.calendarDayTextPast
                  ]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <TouchableOpacity 
            style={styles.modalCancelButton}
            onPress={() => setShowDateModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Clock-style time picker modal
  const renderTimePicker = () => {
    if (!showTimeModal) return null;

    const hours = [];
    const minutes = [];
    
    // Generate hours (8 AM to 6 PM)
    for (let hour = 8; hour <= 18; hour++) {
      hours.push(hour);
    }
    
    // Generate minutes (0, 15, 30, 45)
    for (let minute = 0; minute < 60; minute += 15) {
      minutes.push(minute);
    }

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Pickup Time</Text>
          
          <View style={styles.timePickerContainer}>
            {/* Hours */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnTitle}>Hour</Text>
              <ScrollView style={styles.timeScrollView}>
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeOption,
                      pickupTime.getHours() === hour && styles.timeOptionSelected
                    ]}
                    onPress={() => {
                      const newTime = new Date(pickupTime);
                      newTime.setHours(hour);
                      handleTimeChange(newTime);
                    }}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      pickupTime.getHours() === hour && styles.timeOptionTextSelected
                    ]}>
                      {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Minutes */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeColumnTitle}>Minute</Text>
              <ScrollView style={styles.timeScrollView}>
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.timeOption,
                      pickupTime.getMinutes() === minute && styles.timeOptionSelected
                    ]}
                    onPress={() => {
                      const newTime = new Date(pickupTime);
                      newTime.setMinutes(minute);
                      handleTimeChange(newTime);
                    }}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      pickupTime.getMinutes() === minute && styles.timeOptionTextSelected
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.modalCancelButton}
            onPress={() => setShowTimeModal(false)}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleConfirm = async () => {
    try {
      // Validate required data
      if (selectedItems.length === 0) {
        Alert.alert('Error', 'Please select at least one waste category');
        return;
      }

      if (currentLocation === 'Getting location...' || currentLocation === 'Location permission denied' || currentLocation === 'Unable to get location') {
        Alert.alert('Error', 'Please wait for location to load or check location permissions');
        return;
      }

      if (selectedImages.length === 0) {
        Alert.alert('Error', 'Please upload photos of the waste items');
        return;
      }

      setUploading(true);
      
      try {
        // No upload step needed, images are already uploaded to Cloudinary
        const urls = selectedImages;
        const pickupRequest = {
          id: `pickup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          user_id: 'dummy_user_001', // Use valid dummy user ID
          selected_items: selectedItems,
          quantities: quantity,
          pickup_date: pickupDate,
          pickup_time: pickupTime,
          location: currentLocation,
          images: urls, // Store Cloudinary URLs in images field
        };

        console.log('Creating pickup request with Cloudinary URLs:', pickupRequest);
        await createPickupRequest(pickupRequest);
        Alert.alert('Success', 'Pickup request created successfully!');
        router.push('/customer-home');
      } catch (uploadError) {
        console.error('❌ Error:', uploadError);
        Alert.alert('Error', 'Failed to create pickup request. Please try again.');
      } finally {
        setUploading(false);
      }
    } catch (error) {
      console.error('Error creating pickup request:', error);
      Alert.alert('Error', 'Failed to create pickup request. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pick up schedule</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Roadmap */}
      <View style={styles.roadmap}>
        <View style={styles.roadmapItem}>
          <View style={[
            styles.roadmapCircle,
            currentStep >= 1 && styles.roadmapCircleActive
          ]}>
            <Text style={[
              styles.roadmapNumber,
              currentStep >= 1 && styles.roadmapNumberActive
            ]}>1</Text>
          </View>
          <Text style={[
            styles.roadmapText,
            currentStep >= 1 && styles.roadmapTextActive
          ]}>Recycle Details</Text>
        </View>
        
        <View style={[
          styles.roadmapLine,
          currentStep >= 2 && styles.roadmapLineActive
        ]} />
        
        <View style={styles.roadmapItem}>
          <View style={[
            styles.roadmapCircle,
            currentStep >= 2 && styles.roadmapCircleActive
          ]}>
            <Text style={[
              styles.roadmapNumber,
              currentStep >= 2 && styles.roadmapNumberActive
            ]}>2</Text>
          </View>
          <Text style={[
            styles.roadmapText,
            currentStep >= 2 && styles.roadmapTextActive
          ]}>Pickup Details</Text>
        </View>
        
        <View style={[
          styles.roadmapLine,
          currentStep >= 3 && styles.roadmapLineActive
        ]} />
        
        <View style={styles.roadmapItem}>
          <View style={[
            styles.roadmapCircle,
            currentStep >= 3 && styles.roadmapCircleActive
          ]}>
            <Text style={[
              styles.roadmapNumber,
              currentStep >= 3 && styles.roadmapNumberActive
            ]}>3</Text>
          </View>
          <Text style={[
            styles.roadmapText,
            currentStep >= 3 && styles.roadmapTextActive
          ]}>Pickup Confirmation</Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      {/* Next Button at Position 4 - Below Main Content */}
      {currentStep < 3 && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[
              styles.nextButton,
              ((currentStep === 1 && selectedItems.length === 0) ||
               (currentStep === 2 && (selectedImages.length === 0 || selectedItems.some(itemId => (quantity[itemId] || 0) === 0)))) && 
              styles.nextButtonDisabled
            ]} 
            onPress={handleNext}
            disabled={
              (currentStep === 1 && selectedItems.length === 0) ||
              (currentStep === 2 && (selectedImages.length === 0 || selectedItems.some(itemId => (quantity[itemId] || 0) === 0)))
            }
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}

      {currentStep === 3 && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={[styles.confirmButton, uploading && styles.confirmButtonDisabled]} 
            onPress={handleConfirm}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.confirmButtonText}>Uploading...</Text>
              </View>
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Date and Time Picker Modals */}
      {renderDatePicker()}
      {renderTimePicker()}

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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4CAF50',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerRight: {
    width: 32,
  },
  roadmap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  roadmapItem: {
    alignItems: 'center',
    flex: 1,
  },
  roadmapCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  roadmapCircleActive: {
    backgroundColor: '#4CAF50',
  },
  roadmapNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  roadmapNumberActive: {
    color: '#fff',
  },
  roadmapText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  roadmapTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  roadmapLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  roadmapLineActive: {
    backgroundColor: '#4CAF50',
  },
  topButtonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bottomButtonContainer: {
    padding: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  categoryItemSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconSelected: {
    backgroundColor: '#4CAF50',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#4CAF50',
  },
  pickupDetailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  quantityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quantityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    padding: 8,
  },
  quantityValue: {
    fontSize: 16,
    color: '#333',
  },
  quantityValueZero: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f0f8f0',
    borderRadius: 12,
  },
  addImageText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  requiredText: {
    fontSize: 14,
    color: '#ff4444',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  imageContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  dateList: {
    maxHeight: 300,
  },
  timeList: {
    maxHeight: 300,
  },
  dateOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  dateOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  dateOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  timeOptionSelected: {
    backgroundColor: '#4CAF50',
  },
  timeOptionText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  timeOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalCancelButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calendarDayOtherMonth: {
    backgroundColor: '#f8f8f8',
  },
  calendarDayToday: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  calendarDaySelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  calendarDayPast: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
  },
  calendarDayTextOtherMonth: {
    color: '#ccc',
  },
  calendarDayTextToday: {
    color: '#2196f3',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDayTextPast: {
    color: '#999',
  },
  timePickerContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 8,
  },
  timeColumnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeScrollView: {
    maxHeight: 200,
  },
  confirmationContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  confirmationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  confirmationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  confirmationValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling
  },
  navText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navTextActive: {
    color: '#4CAF50',
    fontWeight: '600',
  },
}); 