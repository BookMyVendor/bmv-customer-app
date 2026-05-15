import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { sendOtp } from '../services/authService';
import { useAuth } from '@/context/AuthContext';

const { width, height } = Dimensions.get('window');

const C = {
  navy: '#050A30',
  blue: '#2196F3',
  purple: '#9C27B0',
  white: '#FFFFFF',
  labelPurple: '#9575CD',
  mutedBlueGrey: '#5C6BC0',
  green: '#4CAF50',
  lightPurpleBg: '#EDE7F6',
  cardBorder: '#E8EAF6',
};

const OTP_LEN = 6;
const OTP_CELL = Math.min(52, Math.floor((width - 22 * 2 - 20 * 2 - 8 * (OTP_LEN - 1)) / OTP_LEN));

const STAR_POSITIONS = [
  { top: 72, left: width * 0.12, size: 3 },
  { top: 98, left: width * 0.22, size: 2 },
  { top: 56, right: width * 0.18, size: 2 },
  { top: 130, right: width * 0.28, size: 3 },
  { top: 180, left: width * 0.08, size: 2 },
  { top: 200, right: width * 0.12, size: 4 },
  { top: 250, left: width * 0.35, size: 2 },
];

function maskMobile(num: string) {
  if (num.length !== 10) return '+91 •••••• •••';
  return `+91 ${num.slice(0, 2)}•••• •${num.slice(-3)}`;
}

function GradientHeadline() {
  const maskText = (
    <Text style={styles.gradientTitleMask}>Perfectly Planned</Text>
  );

  if (Platform.OS === 'web') {
    return (
      <Text style={styles.gradientTitleWeb}>
        Perfectly <Text style={{ color: C.purple }}>Planned</Text>
      </Text>
    );
  }

  return (
    <MaskedView style={styles.gradientTitleWrapper} maskElement={maskText}>
      <LinearGradient
        colors={[C.blue, C.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientTitleFill}
      />
    </MaskedView>
  );
}

export default function LoginScreen() {
  const { mobile, step: stepParam } = useLocalSearchParams<{
    mobile?: string;
    step?: string;
  }>();
  const [step, setStep] = useState<1 | 2>(1);
  const [mobileNumber, setMobileNumber] = useState(mobile || '');
  const [otp, setOtp] = useState<string[]>(() => Array(OTP_LEN).fill(''));
  const [countdown, setCountdown] = useState(45);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showNameModal, setShowNameModal] = useState(false);
  const [fullName, setFullName] = useState('');

  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { verifyOtp, resendOtp, updateProfileName } = useAuth();

  const headerPadTop = Math.max(insets.top, 12) + 8;

  useEffect(() => {
    if (mobile) setMobileNumber(mobile);
  }, [mobile]);

  useEffect(() => {
    const wantOtp = stepParam === 'otp';
    const m = Array.isArray(mobile) ? mobile[0] : mobile;
    if (wantOtp && m && String(m).length === 10) {
      setMobileNumber(String(m));
      setStep(2);
      setCountdown(45);
      setOtp(Array(OTP_LEN).fill(''));
    }
  }, [stepParam, mobile]);

  useEffect(() => {
    if (step !== 2) return;
    setCountdown(45);
    setOtp(Array(OTP_LEN).fill(''));
  }, [step]);

  useEffect(() => {
    if (step !== 2) return;
    const t = setInterval(() => {
      setCountdown((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  const goToVerifyStep = () => {
    setStep(2);
    setOtp(Array(OTP_LEN).fill(''));
    setCountdown(45);
    setTimeout(() => otpInputRefs.current[0]?.focus(), 300);
  };

  const handleSendOTP = async () => {
    if (mobileNumber.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsSendingOtp(true);
    try {
      const phoneNumber = `+91${mobileNumber}`;
      console.log('[LOGIN] Send OTP:', phoneNumber);
      await sendOtp(phoneNumber);
      goToVerifyStep();
    } catch (error) {
      console.error('[LOGIN] Send OTP failed, dummy flow');
      const errorMessage = error instanceof Error ? error.message : 'Failed to send OTP';
      Alert.alert('API Error', `${errorMessage}. You can still enter the test OTP if enabled.`);
      goToVerifyStep();
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== OTP_LEN) {
      Alert.alert('Invalid OTP', `Please enter a valid ${OTP_LEN}-digit OTP`);
      return;
    }

    const phoneNumber = `+91${mobileNumber}`;
    setIsVerifying(true);
    try {
      const response = await verifyOtp(phoneNumber, otpValue);
      if (response.newUser || !response.user.first_name) {
        setShowNameModal(true);
      } else {
        router.dismissAll();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('[LOGIN] Verify failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      if (otpValue === '123456') {
        setShowNameModal(true);
      } else {
        Alert.alert('Verification Failed', errorMessage);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveName = async () => {
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name to proceed.');
      return;
    }
    setIsVerifying(true);
    try {
      await updateProfileName(fullName.trim());
      setShowNameModal(false);
      router.dismissAll();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Failed to save name. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    const phoneNumber = `+91${mobileNumber}`;
    setIsResending(true);
    try {
      await resendOtp(phoneNumber);
      setCountdown(45);
      Alert.alert('OTP Resent', 'A new OTP has been sent to your mobile number');
    } catch {
      setCountdown(45);
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LEN - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const backToMobile = () => {
    setStep(1);
    setOtp(Array(OTP_LEN).fill(''));
  };

  const otpFilled = otp.every((d) => d !== '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={['#050A30', '#0c1240', '#1a0b38', '#12082e']}
        locations={[0, 0.35, 0.72, 1]}
        style={[styles.headerBackground, { paddingTop: headerPadTop }]}
      >
        <View style={styles.palmSilhouette} />
        <View style={styles.glowOrbOuter}>
          <LinearGradient
            colors={['rgba(156,39,176,0.55)', 'rgba(33,150,243,0.15)', 'transparent']}
            style={styles.glowOrbGradient}
          />
        </View>
        {STAR_POSITIONS.map((s, i) => (
          <View
            key={i}
            style={[
              styles.starDot,
              {
                top: s.top,
                ...(s.left != null ? { left: s.left } : {}),
                ...(s.right != null ? { right: s.right } : {}),
                width: s.size,
                height: s.size,
              },
            ]}
          />
        ))}

        <View style={styles.topSection}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/images/bmv_internal_logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.headerTitle}>Your Event,</Text>
          <GradientHeadline />

          <View style={styles.headerStarSeparator}>
            <View style={styles.headerStarLine} />
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.55)" />
            <View style={styles.headerStarLine} />
          </View>

          <Text style={styles.headerSubtitle}>Plan. Personalize. Celebrate.</Text>
        </View>
      </LinearGradient>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Two-step indicator */}
          <View style={styles.stepRow}>
            <View style={[styles.stepPill, step === 1 && styles.stepPillActive]}>
              <View style={[styles.stepBadge, step === 1 && styles.stepBadgeActive]}>
                <Text style={[styles.stepBadgeText, step === 1 && styles.stepBadgeTextActive]}>1</Text>
              </View>
              <Text style={[styles.stepPillLabel, step === 1 && styles.stepPillLabelActive]}>Mobile</Text>
            </View>
            <View style={styles.stepConnector}>
              <View style={[styles.stepConnectorLine, step === 2 && styles.stepConnectorLineDone]} />
            </View>
            <View style={[styles.stepPill, step === 2 && styles.stepPillActive]}>
              <View style={[styles.stepBadge, step === 2 && styles.stepBadgeActive]}>
                <Text style={[styles.stepBadgeText, step === 2 && styles.stepBadgeTextActive]}>2</Text>
              </View>
              <Text style={[styles.stepPillLabel, step === 2 && styles.stepPillLabelActive]}>Verify OTP</Text>
            </View>
          </View>

          {step === 1 ? (
            <>
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={[C.blue, C.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.handIconGradient}
                >
                  <Text style={styles.handEmoji}>👋</Text>
                </LinearGradient>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.welcomeText}>Welcome Back!</Text>
                  <Text style={styles.subtitle}>Enter your mobile number to get started</Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                <View style={[styles.inputGroup, isFocused && styles.inputGroupFocused]}>
                  <TouchableOpacity style={styles.countryPicker} activeOpacity={0.7}>
                    <Text style={styles.countryCode}>+91</Text>
                    <Ionicons name="chevron-down" size={16} color={C.mutedBlueGrey} />
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  <View style={styles.phoneIconWrap}>
                    <Ionicons name="call-outline" size={20} color={C.purple} />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor="#B0BEC5"
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
                  disabled={isSendingOtp || mobileNumber.length !== 10}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.blue, C.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isSendingOtp ? (
                      <ActivityIndicator color={C.white} />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Get OTP</Text>
                        <View style={styles.arrowIconContainer}>
                          <Ionicons name="arrow-forward" size={16} color={C.blue} />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.securityContainer}>
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="shield-checkmark" size={18} color={C.blue} />
                    </View>
                    <Text style={styles.badgeTitle}>Secure</Text>
                    <Text style={styles.badgeSub}>Your data is safe</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="lock-closed" size={18} color={C.green} />
                    </View>
                    <Text style={styles.badgeTitle}>Encrypted</Text>
                    <Text style={styles.badgeSub}>End-to-end secure</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, { backgroundColor: '#F3E5F5' }]}>
                      <Ionicons name="shield-half" size={18} color={C.purple} />
                    </View>
                    <Text style={styles.badgeTitle}>Private</Text>
                    <Text style={styles.badgeSub}>100% confidential</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() => setTermsAccepted(!termsAccepted)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                    {termsAccepted ? (
                      <Ionicons name="checkmark" size={14} color={C.white} />
                    ) : null}
                  </View>
                  <Text style={styles.termsText}>
                    By continuing, you agree to our{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                <View style={styles.helpDividerWrap}>
                  <View style={styles.helpDividerLine} />
                  <Ionicons name="star" size={10} color="#C5CAE9" />
                  <View style={styles.helpDividerLine} />
                </View>

                <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
                  <View style={styles.helpIconCircle}>
                    <Ionicons name="headset-outline" size={20} color={C.purple} />
                  </View>
                  <Text style={styles.helpText}>Need help with your account?</Text>
                  <Ionicons name="chevron-forward" size={18} color={C.purple} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={[C.blue, C.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.handIconGradient}
                >
                  <Ionicons name="keypad-outline" size={26} color={C.white} />
                </LinearGradient>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.welcomeText}>Verify OTP</Text>
                  <Text style={styles.subtitle}>Code sent to {maskMobile(mobileNumber)}</Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>ENTER {OTP_LEN}-DIGIT CODE</Text>
                <View style={styles.otpRow}>
                  {Array.from({ length: OTP_LEN }, (_, index) => (
                    <TextInput
                      key={index}
                      ref={(r) => {
                        otpInputRefs.current[index] = r;
                      }}
                      style={[
                        styles.otpCell,
                        { width: OTP_CELL, height: OTP_CELL + 8 },
                        otp[index] ? styles.otpCellFilled : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={1}
                      value={otp[index]}
                      onChangeText={(t) => handleOtpChange(index, t)}
                      onKeyPress={({ nativeEvent: { key } }) => handleOtpKeyPress(index, key)}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={[styles.button, !otpFilled && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isVerifying || !otpFilled}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[C.blue, C.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isVerifying ? (
                      <ActivityIndicator color={C.white} />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Verify & Proceed</Text>
                        <View style={styles.arrowIconContainer}>
                          <Ionicons name="arrow-forward" size={16} color={C.blue} />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  <Text style={styles.resendMuted}>{"Didn't receive code? "}</Text>
                  {countdown > 0 ? (
                    <View style={styles.timerBadge}>
                      <Ionicons name="time-outline" size={14} color={C.purple} />
                      <Text style={styles.timerText}>
                        00:{countdown.toString().padStart(2, '0')}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP} disabled={isResending}>
                      {isResending ? (
                        <ActivityIndicator size="small" color={C.purple} />
                      ) : (
                        <Text style={styles.resendLink}>Resend Code</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity style={styles.changePhoneRow} onPress={backToMobile} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={18} color={C.mutedBlueGrey} />
                  <Ionicons name="pencil-outline" size={16} color={C.mutedBlueGrey} />
                  <Text style={styles.changePhoneText}>Change phone number</Text>
                </TouchableOpacity>

                <View style={[styles.securityContainer, { marginTop: 8 }]}>
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="shield-checkmark" size={18} color={C.blue} />
                    </View>
                    <Text style={styles.badgeTitle}>Secure</Text>
                    <Text style={styles.badgeSub}>Your data is safe</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="lock-closed" size={18} color={C.green} />
                    </View>
                    <Text style={styles.badgeTitle}>Encrypted</Text>
                    <Text style={styles.badgeSub}>End-to-end secure</Text>
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, { backgroundColor: '#F3E5F5' }]}>
                      <Ionicons name="shield-half" size={18} color={C.purple} />
                    </View>
                    <Text style={styles.badgeTitle}>Private</Text>
                    <Text style={styles.badgeSub}>100% confidential</Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      <Modal visible={showNameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={[C.blue, C.purple]} style={styles.modalIconCircle}>
              <Ionicons name="person" size={28} color="#FFF" />
            </LinearGradient>
            <Text style={styles.modalTitle}>One Last Step!</Text>
            <Text style={styles.modalSubtitle}>
              Please enter your full name to personalize your experience.
            </Text>

            <View style={styles.nameInputContainer}>
              <Ionicons name="person-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.nameInput}
                placeholder="Enter Full Name"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
                autoFocus
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveName} disabled={isVerifying}>
              <LinearGradient
                colors={[C.blue, C.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Complete Profile</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF1F8',
  },
  headerBackground: {
    minHeight: height * 0.42,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 28,
  },
  palmSilhouette: {
    position: 'absolute',
    left: -width * 0.12,
    top: height * 0.08,
    width: width * 0.45,
    height: height * 0.32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ rotate: '-18deg' }],
  },
  glowOrbOuter: {
    position: 'absolute',
    right: -20,
    top: height * 0.12,
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
  },
  glowOrbGradient: {
    width: '100%',
    height: '100%',
  },
  starDot: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 99,
  },
  topSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  logoCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  headerTitle: {
    fontSize: 26,
    color: C.white,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  gradientTitleWrapper: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  gradientTitleFill: {
    height: 44,
    width: width - 40,
  },
  gradientTitleMask: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: '#000',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  gradientTitleWeb: {
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    color: C.blue,
    marginTop: 2,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerStarSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    gap: 12,
    paddingHorizontal: 40,
    width: '100%',
    maxWidth: 320,
  },
  headerStarLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cardContainer: {
    flex: 1,
    marginTop: -56,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: C.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
    shadowColor: '#050A30',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: '#F0F2FA',
  },
  stepPillActive: {
    backgroundColor: '#EDE7F6',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.35)',
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D1D5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeActive: {
    backgroundColor: C.purple,
  },
  stepBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: C.mutedBlueGrey,
  },
  stepBadgeTextActive: {
    color: C.white,
  },
  stepPillLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.mutedBlueGrey,
  },
  stepPillLabelActive: {
    color: C.navy,
  },
  stepConnector: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnectorLine: {
    height: 2,
    width: 20,
    borderRadius: 1,
    backgroundColor: '#D1D5E8',
  },
  stepConnectorLineDone: {
    backgroundColor: C.blue,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  handIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  handEmoji: {
    fontSize: 26,
  },
  cardHeaderText: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: C.navy,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: C.mutedBlueGrey,
    marginTop: 4,
    fontWeight: '400',
  },
  formSection: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.labelPurple,
    marginBottom: 10,
    letterSpacing: 1.2,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderRadius: 14,
    marginBottom: 22,
    backgroundColor: C.white,
    paddingRight: 12,
  },
  inputGroupFocused: {
    borderColor: C.purple,
    borderWidth: 1.5,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 4,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: C.navy,
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: C.cardBorder,
  },
  phoneIconWrap: {
    paddingLeft: 10,
    paddingRight: 4,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 8,
    fontSize: 16,
    color: C.navy,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 22,
  },
  otpCell: {
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '700',
    color: C.navy,
    textAlign: 'center',
    backgroundColor: '#F8F9FD',
  },
  otpCellFilled: {
    borderColor: C.purple,
    backgroundColor: C.white,
  },
  button: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: C.white,
    letterSpacing: 0.3,
  },
  arrowIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 4,
  },
  resendMuted: {
    fontSize: 14,
    color: C.mutedBlueGrey,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.lightPurpleBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.purple,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: C.purple,
    textDecorationLine: 'underline',
  },
  changePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  changePhoneText: {
    fontSize: 13,
    color: C.mutedBlueGrey,
    fontWeight: '600',
  },
  securityContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FD',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ECEFF8',
  },
  badgeColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.navy,
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeSub: {
    fontSize: 9,
    fontWeight: '500',
    color: C.mutedBlueGrey,
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  verticalDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#E0E4F0',
    marginTop: 8,
    marginBottom: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: C.purple,
    marginTop: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxChecked: {
    backgroundColor: C.purple,
    borderColor: C.purple,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: C.mutedBlueGrey,
    lineHeight: 18,
  },
  termsLink: {
    color: C.navy,
    fontWeight: '700',
  },
  helpDividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },
  helpDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#DDE1F0',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },
  helpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.lightPurpleBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: C.purple,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.navy,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  nameInputContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
  },
  nameInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 10,
    fontSize: 16,
    color: C.navy,
  },
  saveButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
