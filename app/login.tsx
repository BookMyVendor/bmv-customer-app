import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendOtp } from '../services/authService';

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
const NARROW_WIDTH = 360;
const SHORT_HEIGHT = 700;

function maskMobile(num: string) {
  if (num.length !== 10) return '+91 •••••• •••';
  return `+91 ${num.slice(0, 2)}•••• •${num.slice(-3)}`;
}

function GradientHeadline({ titleWidth, fontSize }: { titleWidth: number; fontSize: number }) {
  const maskText = (
    <Text style={[styles.gradientTitleMask, { fontSize, lineHeight: fontSize + 10 }]}>
      Perfectly Planned
    </Text>
  );

  if (Platform.OS === 'web') {
    return (
      <Text style={[styles.gradientTitleWeb, { fontSize }]}>
        Perfectly <Text style={{ color: C.purple }}>Planned</Text>
      </Text>
    );
  }

  return (
    <MaskedView style={[styles.gradientTitleWrapper, { height: fontSize + 14 }]} maskElement={maskText}>
      <LinearGradient
        colors={[C.blue, C.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: fontSize + 14, width: titleWidth }}
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { verifyOtp, resendOtp, updateProfileName, needsProfileSetup } = useAuth();

  const isNarrow = windowWidth < NARROW_WIDTH;
  const isShort = windowHeight < SHORT_HEIGHT;
  const screenPad = isNarrow ? 12 : 20;
  const cardPad = isNarrow ? 14 : 22;
  const logoSize = isNarrow ? 96 : isShort ? 108 : 132;
  const titleFontSize = isNarrow ? 24 : 30;
  const headerMinHeight = isShort ? windowHeight * 0.34 : windowHeight * 0.38;
  const otpGap = isNarrow ? 5 : 8;
  const otpFontSize = isNarrow ? 18 : 22;

  const starPositions = useMemo(
    () => [
      { top: 56, left: windowWidth * 0.1, size: 3 },
      { top: 82, left: windowWidth * 0.2, size: 2 },
      { top: 44, right: windowWidth * 0.16, size: 2 },
      { top: 110, right: windowWidth * 0.24, size: 3 },
      { top: 150, left: windowWidth * 0.06, size: 2 },
      { top: 168, right: windowWidth * 0.1, size: 4 },
      { top: 200, left: windowWidth * 0.32, size: 2 },
    ],
    [windowWidth]
  );

  const headerPadTop = Math.max(insets.top, 12) + (isNarrow ? 4 : 8);

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

  useEffect(() => {
    if (needsProfileSetup) {
      setShowNameModal(true);
    }
  }, [needsProfileSetup]);

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
      if (response.needsProfileSetup) {
        setShowNameModal(true);
      } else {
        router.dismissAll();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('[LOGIN] Verify failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify OTP';
      Alert.alert('Verification Failed', errorMessage);
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
      const message =
        e instanceof Error ? e.message : 'Failed to save name. Please try again.';
      Alert.alert(
        'Error',
        message.toLowerCase().includes('authenticated')
          ? 'Session expired. Please verify OTP again.'
          : message
      );
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <LinearGradient
        colors={['#050A30', '#0c1240', '#1a0b38', '#12082e']}
        locations={[0, 0.35, 0.72, 1]}
        style={[
          styles.headerBackground,
          { paddingTop: headerPadTop, minHeight: headerMinHeight, paddingBottom: isNarrow ? 16 : 28 },
        ]}
      >
        <View
          style={[
            styles.palmSilhouette,
            {
              left: -windowWidth * 0.12,
              top: windowHeight * 0.06,
              width: windowWidth * 0.42,
              height: windowHeight * 0.26,
            },
          ]}
        />
        <View
          style={[
            styles.glowOrbOuter,
            { top: windowHeight * 0.08, width: isNarrow ? 100 : 140, height: isNarrow ? 100 : 140 },
          ]}
        >
          <LinearGradient
            colors={['rgba(156,39,176,0.55)', 'rgba(33,150,243,0.15)', 'transparent']}
            style={styles.glowOrbGradient}
          />
        </View>
        {starPositions.map((s, i) => (
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

        <View style={[styles.topSection, { paddingHorizontal: isNarrow ? 16 : 24 }]}>
          <View
            style={[
              styles.logoCircle,
              {
                width: logoSize,
                height: logoSize,
                borderRadius: logoSize / 2,
                marginBottom: isNarrow ? 12 : 18,
              },
            ]}
          >
            <Image
              source={require('../assets/images/bmv_internal_logo.png')}
              style={{ width: logoSize * 0.76, height: logoSize * 0.76 }}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.headerTitle, isNarrow && styles.headerTitleNarrow]}>Your Event,</Text>
          <GradientHeadline titleWidth={windowWidth - (isNarrow ? 32 : 40)} fontSize={titleFontSize} />

          <View style={styles.headerStarSeparator}>
            <View style={styles.headerStarLine} />
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.55)" />
            <View style={styles.headerStarLine} />
          </View>

          <Text style={styles.headerSubtitle}>Plan. Personalize. Celebrate.</Text>
        </View>
      </LinearGradient>

      <View style={[styles.cardContainer, { paddingHorizontal: screenPad, marginTop: isNarrow ? -40 : -56 }]}>
        <View style={[styles.card, { paddingHorizontal: cardPad }]}>
          <View style={styles.stepRow}>
            <View style={[styles.stepPill, step === 1 && styles.stepPillActive, isNarrow && styles.stepPillCompact]}>
              <View style={[styles.stepBadge, step === 1 && styles.stepBadgeActive, isNarrow && styles.stepBadgeCompact]}>
                <Text style={[styles.stepBadgeText, step === 1 && styles.stepBadgeTextActive]}>1</Text>
              </View>
              <Text
                style={[styles.stepPillLabel, step === 1 && styles.stepPillLabelActive, isNarrow && styles.stepPillLabelCompact]}
                numberOfLines={1}
              >
                Mobile
              </Text>
            </View>
            <View style={[styles.stepConnector, isNarrow && styles.stepConnectorCompact]}>
              <View style={[styles.stepConnectorLine, step === 2 && styles.stepConnectorLineDone]} />
            </View>
            <View style={[styles.stepPill, step === 2 && styles.stepPillActive, isNarrow && styles.stepPillCompact]}>
              <View style={[styles.stepBadge, step === 2 && styles.stepBadgeActive, isNarrow && styles.stepBadgeCompact]}>
                <Text style={[styles.stepBadgeText, step === 2 && styles.stepBadgeTextActive]}>2</Text>
              </View>
              <Text
                style={[styles.stepPillLabel, step === 2 && styles.stepPillLabelActive, isNarrow && styles.stepPillLabelCompact]}
                numberOfLines={1}
              >
                {isNarrow ? 'OTP' : 'Verify OTP'}
              </Text>
            </View>
          </View>

          {step === 1 ? (
            <>
              {/* <View style={styles.cardHeader}>
                
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.welcomeText, isNarrow && styles.welcomeTextCompact]}>Welcome Back!</Text>
                 
                </View>
              </View> */}

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                <View style={[styles.inputGroup, isFocused && styles.inputGroupFocused, isNarrow && styles.inputGroupCompact]}>
                  <TouchableOpacity style={[styles.countryPicker, isNarrow && styles.countryPickerCompact]} activeOpacity={0.7}>
                    <Text style={[styles.countryCode, isNarrow && styles.countryCodeCompact]}>+91</Text>
                    {!isNarrow ? (
                      <Ionicons name="chevron-down" size={16} color={C.mutedBlueGrey} />
                    ) : null}
                  </TouchableOpacity>
                  <View style={styles.divider} />
                  {!isNarrow ? (
                    <View style={styles.phoneIconWrap}>
                      <Ionicons name="call-outline" size={20} color={C.purple} />
                    </View>
                  ) : null}
                  <TextInput
                    style={[styles.input, isNarrow && styles.inputCompact]}
                    placeholder={isNarrow ? '10-digit mobile' : 'Enter 10-digit mobile number'}
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
                        <Text style={[styles.buttonText, isNarrow && styles.buttonTextCompact]}>Get OTP</Text>
                        <View style={styles.arrowIconContainer}>
                          <Ionicons name="arrow-forward" size={16} color={C.blue} />
                        </View>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={[styles.securityContainer, isNarrow && styles.securityContainerCompact]}>
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, isNarrow && styles.badgeIconCircleCompact, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="shield-checkmark" size={isNarrow ? 16 : 18} color={C.blue} />
                    </View>
                    <Text style={[styles.badgeTitle, isNarrow && styles.badgeTitleCompact]}>Secure</Text>
                    {!isNarrow ? <Text style={styles.badgeSub}>Your data is safe</Text> : null}
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, isNarrow && styles.badgeIconCircleCompact, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="lock-closed" size={isNarrow ? 16 : 18} color={C.green} />
                    </View>
                    <Text style={[styles.badgeTitle, isNarrow && styles.badgeTitleCompact]}>Encrypted</Text>
                    {!isNarrow ? <Text style={styles.badgeSub}>End-to-end secure</Text> : null}
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, isNarrow && styles.badgeIconCircleCompact, { backgroundColor: '#F3E5F5' }]}>
                      <Ionicons name="shield-half" size={isNarrow ? 16 : 18} color={C.purple} />
                    </View>
                    <Text style={[styles.badgeTitle, isNarrow && styles.badgeTitleCompact]}>Private</Text>
                    {!isNarrow ? <Text style={styles.badgeSub}>100% confidential</Text> : null}
                  </View>
                </View>

                {!isNarrow ? (
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
                ) : null}
              </View>
            </>
          ) : (
            <>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.welcomeText, isNarrow && styles.welcomeTextCompact]}>Verify OTP</Text>
                  <Text style={[styles.subtitle, isNarrow && styles.subtitleCompact]} numberOfLines={1}>
                    Code sent to {maskMobile(mobileNumber)}
                  </Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>ENTER {OTP_LEN}-DIGIT CODE</Text>
                <View style={[styles.otpRow, { gap: otpGap }]}>
                  {Array.from({ length: OTP_LEN }, (_, index) => (
                    <TextInput
                      key={index}
                      ref={(r) => {
                        otpInputRefs.current[index] = r;
                      }}
                      style={[
                        styles.otpCell,
                        { flex: 1, maxWidth: 52, fontSize: otpFontSize, aspectRatio: 1 },
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
                        <Text style={[styles.buttonText, isNarrow && styles.buttonTextCompact]}>
                          {isNarrow ? 'Verify' : 'Verify & Proceed'}
                        </Text>
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

                <View style={[styles.securityContainer, isNarrow && styles.securityContainerCompact, { marginTop: 8 }]}>
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, isNarrow && styles.badgeIconCircleCompact, { backgroundColor: '#E3F2FD' }]}>
                      <Ionicons name="shield-checkmark" size={isNarrow ? 16 : 18} color={C.blue} />
                    </View>
                    <Text style={[styles.badgeTitle, isNarrow && styles.badgeTitleCompact]}>Secure</Text>
                    {!isNarrow ? <Text style={styles.badgeSub}>Your data is safe</Text> : null}
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, isNarrow && styles.badgeIconCircleCompact, { backgroundColor: '#E8F5E9' }]}>
                      <Ionicons name="lock-closed" size={isNarrow ? 16 : 18} color={C.green} />
                    </View>
                    <Text style={[styles.badgeTitle, isNarrow && styles.badgeTitleCompact]}>Encrypted</Text>
                    {!isNarrow ? <Text style={styles.badgeSub}>End-to-end secure</Text> : null}
                  </View>
                  <View style={styles.verticalDivider} />
                  <View style={styles.badgeColumn}>
                    <View style={[styles.badgeIconCircle, isNarrow && styles.badgeIconCircleCompact, { backgroundColor: '#F3E5F5' }]}>
                      <Ionicons name="shield-half" size={isNarrow ? 16 : 18} color={C.purple} />
                    </View>
                    <Text style={[styles.badgeTitle, isNarrow && styles.badgeTitleCompact]}>Private</Text>
                    {!isNarrow ? <Text style={styles.badgeSub}>100% confidential</Text> : null}
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </View>
      </ScrollView>

      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF1F8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  headerBackground: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  palmSilhouette: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    transform: [{ rotate: '-18deg' }],
  },
  glowOrbOuter: {
    position: 'absolute',
    right: -20,
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
    backgroundColor: C.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTitle: {
    fontSize: 26,
    color: C.white,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headerTitleNarrow: {
    fontSize: 22,
  },
  gradientTitleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  gradientTitleMask: {
    fontWeight: '800',
    textAlign: 'center',
    color: '#000',
    letterSpacing: -0.5,
  },
  gradientTitleWeb: {
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
    flexGrow: 1,
  },
  card: {
    backgroundColor: C.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 16,
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
    minWidth: 0,
  },
  stepPillCompact: {
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 4,
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
    flexShrink: 0,
  },
  stepBadgeCompact: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    flexShrink: 1,
  },
  stepPillLabelCompact: {
    fontSize: 11,
  },
  stepPillLabelActive: {
    color: C.navy,
  },
  stepConnector: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepConnectorCompact: {
    width: 14,
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

  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: C.navy,
    letterSpacing: -0.3,
  },
  welcomeTextCompact: {
    fontSize: 19,
  },
  subtitle: {
    fontSize: 14,
    color: C.mutedBlueGrey,
    marginTop: 4,
    fontWeight: '400',
  },
  subtitleCompact: {
    fontSize: 13,
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
    minWidth: 0,
  },
  inputGroupCompact: {
    marginBottom: 18,
    paddingRight: 8,
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
    flexShrink: 0,
  },
  countryPickerCompact: {
    paddingHorizontal: 10,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: C.navy,
  },
  countryCodeCompact: {
    fontSize: 15,
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
    minWidth: 0,
    paddingVertical: 15,
    paddingHorizontal: 8,
    fontSize: 16,
    color: C.navy,
  },
  inputCompact: {
    paddingVertical: 13,
    fontSize: 15,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
    width: '100%',
  },
  otpCell: {
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    borderRadius: 12,
    fontWeight: '700',
    color: C.navy,
    textAlign: 'center',
    backgroundColor: '#F8F9FD',
    minWidth: 0,
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
  buttonTextCompact: {
    fontSize: 15,
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
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECEFF8',
  },
  securityContainerCompact: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 12,
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
  badgeIconCircleCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.navy,
    marginBottom: 2,
    textAlign: 'center',
  },
  badgeTitleCompact: {
    fontSize: 10,
    marginBottom: 0,
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
    marginBottom: 0,
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
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 28,
    padding: 24,
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
