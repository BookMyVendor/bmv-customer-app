import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { submitCustomerReview, uploadReviewImages } from '@/services/reviewService';
import { VerifyOtpResponse } from '@/types/auth.types';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  vendorId: string;
  accessToken: string | null;
  authUser: VerifyOtpResponse['user'] | null;
  onSuccess: () => void;
}

export default function ReviewModal({
  visible,
  onClose,
  businessId,
  vendorId,
  accessToken,
  authUser,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }

    if (!accessToken) {
      Alert.alert('Error', 'You must be logged in to submit a review');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await submitCustomerReview(
        {
          business_id: businessId,
          vendor_id: vendorId,
          rating,
          review_text: reviewText,
          customer_id: authUser?.id || '',
        },
        accessToken
      );

      if (response.success && images.length > 0) {
        const files = images.map((img) => {
          return {
            uri: img.uri,
            name: img.fileName || `review_${Date.now()}.jpg`,
            type: img.mimeType || 'image/jpeg',
          } as any;
        });
        await uploadReviewImages(response.reviewId, files, accessToken);
      }

      Alert.alert('Success', 'Your review has been submitted');
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Failed to submit review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText('');
    setImages([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Write a Review</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <View style={styles.ratingSection}>
              <Text style={styles.label}>Rate your experience</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setRating(s)}>
                    <Ionicons
                      name={s <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={s <= rating ? '#F5A623' : '#CCC'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Your Review</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Share your experience with this vendor..."
                multiline
                numberOfLines={6}
                value={reviewText}
                onChangeText={setReviewText}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.imageSection}>
              <Text style={styles.label}>Add Photos (Optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                <TouchableOpacity style={styles.addButton} onPress={pickImages}>
                  <Ionicons name="camera-outline" size={30} color="#003366" />
                  <Text style={styles.addText}>Add Photo</Text>
                </TouchableOpacity>
                {images.map((img, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.pickedImage} />
                    <TouchableOpacity
                      style={styles.removeBadge}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF4D4D" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  scrollBody: {
    padding: 20,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    backgroundColor: '#F9F9F9',
  },
  imageSection: {
    marginBottom: 24,
  },
  imagesScroll: {
    flexDirection: 'row',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#003366',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F0F5FF',
  },
  addText: {
    fontSize: 12,
    color: '#003366',
    fontWeight: '600',
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  pickedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  footer: {
    paddingHorizontal: 20,
  },
  submitButton: {
    backgroundColor: '#003366',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
