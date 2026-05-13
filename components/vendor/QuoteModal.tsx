import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryTree } from '@/services/categoryService';
import { CategoryTreeNode } from '@/types/category.types';
import { submitCustomerLead } from '@/services/leadService';

interface QuoteModalProps {
  visible: boolean;
  onClose: () => void;
  businessId: string;
  vendorId: string;
  vendorName: string;
  user: any;
  accessToken: string | null;
}

export default function QuoteModal({
  visible,
  onClose,
  businessId,
  vendorId,
  vendorName,
  user,
  accessToken,
}: QuoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : '',
    phone: user?.phone || '',
    email: user?.email || '',
    eventType: '',
    eventDate: '',
    guestCount: '',
    requirements: '',
  });

  useEffect(() => {
    if (visible) {
      fetchCategories();
      setFormData(prev => ({
        ...prev,
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : prev.name,
        phone: user?.phone || prev.phone,
        email: user?.email || prev.email,
      }));
    }
  }, [visible, user]);

  const fetchCategories = async () => {
    try {
      const response = await getCategoryTree();
      if (response.success) {
        const eventCats = response.categories.filter(c => c.category_type === 'event');
        setCategories(eventCats);
      }
    } catch (error) {
      console.error('Failed to fetch event categories:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Required Fields', 'Please fill in your Name and Mobile Number.');
      return;
    }

    try {
      setLoading(true);
      const response = await submitCustomerLead({
        business_id: businessId,
        vendor_id: vendorId,
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: formData.email,
        event_type: formData.eventType,
        event_date: formData.eventDate,
        guest_count: parseInt(formData.guestCount) || 0,
        requirements: formData.requirements,
        lead_type: 'quote_request',
      }, accessToken || undefined);

      if (response.success) {
        Alert.alert('Success', 'Your quote request has been sent successfully!');
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  // Simple Calendar Logic
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const monthName = currentMonth.toLocaleString('default', { month: 'long' });

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, key: `empty-${i}` });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, key: `day-${i}` });
    }

    return (
      <Modal
        visible={showCalendar}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <TouchableOpacity 
          style={styles.calendarOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCalendar(false)}
        >
          <View style={styles.calendarPopUp} onStartShouldSetResponder={() => true}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                <Ionicons name="chevron-back" size={24} color="#003366" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>{monthName} {year}</Text>
              <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                <Ionicons name="chevron-forward" size={24} color="#003366" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <Text key={d} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            <FlatList
              data={days}
              numColumns={7}
              keyExtractor={(item) => item.key}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.dayCell, 
                    item.day && formData.eventDate === `${item.day < 10 ? '0' + item.day : item.day}/${month + 1 < 10 ? '0' + (month + 1) : month + 1}/${year}` && styles.selectedDay
                  ]}
                  disabled={!item.day}
                  onPress={() => {
                    if (item.day) {
                      const d = item.day < 10 ? `0${item.day}` : item.day;
                      const m = month + 1 < 10 ? `0${month + 1}` : month + 1;
                      setFormData({ ...formData, eventDate: `${d}/${m}/${year}` });
                      setShowCalendar(false);
                    }
                  }}
                >
                  <Text style={[
                    styles.dayText,
                    item.day && formData.eventDate === `${item.day < 10 ? '0' + item.day : item.day}/${month + 1 < 10 ? '0' + (month + 1) : month + 1}/${year}` && styles.selectedDayText
                  ]}>
                    {item.day}
                  </Text>
                </TouchableOpacity>
              )}
            />
            
            <TouchableOpacity 
              style={styles.calendarCloseBtn} 
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.calendarCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Get a Quote</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <Text style={styles.vendorNotice}>Requesting quote for: <Text style={styles.vendorNameHighlight}>{vendorName}</Text></Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  placeholder="Enter mobile number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Type</Text>
                <TouchableOpacity 
                  style={styles.dropdownTrigger}
                  onPress={() => setShowEventDropdown(!showEventDropdown)}
                >
                  <Text style={[styles.dropdownValue, !formData.eventType && styles.placeholder]}>
                    {formData.eventType || 'Select event type'}
                  </Text>
                  <Ionicons name={showEventDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
                </TouchableOpacity>

                {showEventDropdown && (
                  <View style={styles.dropdownContent}>
                    {categories.map((cat) => (
                      <TouchableOpacity 
                        key={cat.id} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData({ ...formData, eventType: cat.name });
                          setShowEventDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Event Date</Text>
                <TouchableOpacity 
                  style={styles.dropdownTrigger}
                  onPress={() => setShowCalendar(true)}
                >
                  <Text style={[styles.dropdownValue, !formData.eventDate && styles.placeholder]}>
                    {formData.eventDate || 'Select event date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Number of Guests</Text>
                <TextInput
                  style={styles.input}
                  value={formData.guestCount}
                  onChangeText={(text) => setFormData({ ...formData, guestCount: text })}
                  placeholder="Approx. guest count"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Additional Requirements</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.requirements}
                  onChangeText={(text) => setFormData({ ...formData, requirements: text })}
                  placeholder="Any specific requests or questions?"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Send Request</Text>
                    <Ionicons name="paper-plane" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {renderCalendar()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#003366',
  },
  closeButton: {
    padding: 4,
  },
  formScroll: {
    padding: 20,
    maxHeight: 500,
  },
  vendorNotice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    backgroundColor: '#F8F9FB',
    padding: 12,
    borderRadius: 8,
  },
  vendorNameHighlight: {
    fontWeight: '700',
    color: '#003366',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  dropdownValue: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  placeholder: {
    color: '#999',
  },
  dropdownContent: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
  },
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarPopUp: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#003366',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#999',
    fontWeight: '700',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22.5,
  },
  dayText: {
    fontSize: 15,
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#003366',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '800',
  },
  calendarCloseBtn: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  calendarCloseText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  submitButton: {
    backgroundColor: '#003366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
});
