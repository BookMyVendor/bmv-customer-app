import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

/** OTP is handled on the login screen (step 2). Keep this route for old links. */
export default function OtpRedirectScreen() {
  const router = useRouter();
  const { mobile } = useLocalSearchParams<{ mobile?: string }>();

  useEffect(() => {
    const m = Array.isArray(mobile) ? mobile[0] : mobile;
    if (m) {
      router.replace({ pathname: '/login', params: { mobile: m, step: 'otp' } });
    } else {
      router.replace('/login');
    }
  }, [mobile, router]);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#9C27B0" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF1F8',
  },
});
