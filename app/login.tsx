import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { sendOtp } from '../services/authService';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { mobile } = useLocalSearchParams<{ mobile?: string }>();
  const [mobileNumber, setMobileNumber] = useState(mobile || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (mobile) setMobileNumber(mobile);
  }, [mobile]);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSendOTP = async () => {
    if (mobileNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = `+91${mobileNumber}`;
      console.log('[LOGIN SCREEN] Attempting to send OTP to:', phoneNumber);
      await sendOtp(phoneNumber);
      console.log('[LOGIN SCREEN] OTP sent successfully, navigating to OTP screen');
      router.push({ pathname: '/otp', params: { mobile: mobileNumber } });
    } catch (error) {
      console.error('[LOGIN SCREEN] Send OTP failed, using dummy login fallback');
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      Alert.alert('API Error', `${errorMessage}. Using dummy login instead.`);
      router.push({ pathname: '/otp', params: { mobile: mobileNumber } });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Deep Blue Gradient Background */}
      <LinearGradient
        colors={['#001F3F', '#003366', '#004D99']}
        style={styles.headerBackground}
      >
        {/* Floating elements */}
        <View style={[styles.sparkle, { top: 80, right: 60 }]}>
           <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.4)" />
        </View>
        <View style={[styles.dot, { top: 120, left: 40, width: 8, height: 8 }]} />
        <View style={[styles.dot, { top: 220, right: 30, width: 6, height: 6 }]} />
        <View style={[styles.dot, { top: 300, left: 100, width: 4, height: 4, opacity: 0.3 }]} />

        <View style={styles.topSection}>
          <Image
            source={require('../assets/images/bmv_internal_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Your Event,</Text>
          <Text style={styles.headerTitleBold}>Perfectly Planned</Text>
          <Text style={styles.headerSubtitle}>Plan. Personalize. Celebrate.</Text>
        </View>
      </LinearGradient>

      {/* Card Section */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.handIconContainer}>
               <Text style={styles.handEmoji}>👋</Text>
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Enter your mobile number to get started</Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
            <View style={[styles.inputGroup, isFocused && styles.inputGroupFocused]}>
              <TouchableOpacity style={styles.countryPicker}>
                <Text style={styles.flag}>🇮🇳</Text>
                <Text style={styles.countryCode}>+91</Text>
                <Ionicons name="chevron-down" size={14} color="#6B7280" />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                maxLength={10}
                value={mobileNumber}
                onChangeText={setMobileNumber}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, mobileNumber.length !== 10 && styles.buttonDisabled]} 
              onPress={handleSendOTP}
              disabled={isLoading || mobileNumber.length !== 10}
            >
              <LinearGradient
                colors={['#1E40AF', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Get OTP</Text>
                    <View style={styles.arrowIconContainer}>
                      <Ionicons name="arrow-forward" size={18} color="#1E40AF" />
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Security Badges */}
            <View style={styles.securityContainer}>
              <View style={styles.securityBadge}>
                <View style={styles.badgeIconBg}>
                  <Ionicons name="shield-checkmark" size={12} color="#2563EB" />
                </View>
                <Text style={styles.badgeText}>Secure</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.securityBadge}>
                <View style={styles.badgeIconBg}>
                  <Ionicons name="lock-closed" size={12} color="#2563EB" />
                </View>
                <Text style={styles.badgeText}>Encrypted</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.securityBadge}>
                <View style={styles.badgeIconBg}>
                  <Ionicons name="shield-half" size={12} color="#2563EB" />
                </View>
                <Text style={styles.badgeText}>Private</Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
              
              <TouchableOpacity style={styles.helpButton}>
                <Ionicons name="headset-outline" size={18} color="#1E3A8A" />
                <Text style={styles.helpText}>Need help with your account?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerBackground: {
    height: height * 0.45,
    width: '100%',
    paddingTop: 60,
    alignItems: 'center',
    position: 'relative',
  },
  sparkle: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
    opacity: 0.2,
  },
  topSection: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 60,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '400',
    textAlign: 'center',
  },
  headerTitleBold: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    marginTop: -80,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    minHeight: 450,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  handIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  handEmoji: {
    fontSize: 28,
  },
  cardHeaderText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  formSection: {
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  inputGroupFocused: {
    borderColor: '#3B82F6',
    borderWidth: 1.5,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 16,
    color: '#111827',
  },
  button: {
    height: 60,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arrowIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EBF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  verticalDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
  },
  footerSection: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  termsLink: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
});
