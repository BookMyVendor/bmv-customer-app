import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Customer } from '@/types/customer.types';
import { VerifyOtpResponse } from '@/types/auth.types';

interface LocationOption {
  Name: string;
  District: string;
  State: string;
}

interface ProfileEditModalProps {
  visible: boolean;
  customer: Customer | null;
  authUser: VerifyOtpResponse['user'] | null;
  onSave: (data: Partial<Customer>) => void;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ visible, customer, authUser, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    area: '',
    registration_source: 'mobile',
  });
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        pincode: customer.pincode || '',
        area: '',
        registration_source: customer.registration_source || 'mobile',
      });
    }
  }, [customer]);

  useEffect(() => {
    const fetchPincodeData = async () => {
      if (formData.pincode.length === 6) {
        setIsLoadingPincode(true);
        try {
          const response = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
          const data = await response.json();
          if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice) {
            const options = data[0].PostOffice.map((po: any) => ({
              Name: po.Name,
              District: po.District,
              State: po.State,
            }));
            setLocationOptions(options);
            if (options.length === 1) {
              setFormData({
                ...formData,
                city: options[0].District,
                state: options[0].State,
                area: options[0].Name,
              });
            }
          } else {
            setLocationOptions([]);
          }
        } catch (error) {
          console.error('Error fetching pincode data:', error);
          setLocationOptions([]);
        } finally {
          setIsLoadingPincode(false);
        }
      } else {
        setLocationOptions([]);
      }
    };
    fetchPincodeData();
  }, [formData.pincode]);

  const handleSave = () => {
    onSave(formData);
  };

  const handleLocationSelect = (option: LocationOption) => {
    setFormData({
      ...formData,
      city: option.District,
      state: option.State,
      area: option.Name,
    });
    setLocationOptions([]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Edit Profile</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Enter your full name"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={customer?.phone || authUser?.phone || ''}
                  editable={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Member Since</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={formatDate(customer?.created_at || authUser?.created_at || '')}
                  editable={false}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={formData.pincode}
                  onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                  placeholder="Enter pincode"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                {isLoadingPincode && <ActivityIndicator style={{ marginTop: 8 }} color="#003366" />}
                {locationOptions.length > 1 && (
                  <View style={styles.chipsContainer}>
                    <Text style={styles.chipsLabel}>Select your area:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {locationOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.chip,
                            formData.area === option.Name && styles.chipSelected,
                          ]}
                          onPress={() => handleLocationSelect(option)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              formData.area === option.Name && styles.chipTextSelected,
                            ]}
                          >
                            {option.Name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  placeholder="Enter your address"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Area</Text>
                <TextInput
                  style={styles.input}
                  value={formData.area}
                  onChangeText={(text) => setFormData({ ...formData, area: text })}
                  placeholder="Area (auto-filled from pincode)"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>City/Town</Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  placeholder="Enter city/town"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                  placeholder="Enter state"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Registration Source</Text>
                <TextInput
                  style={[styles.input, styles.readOnlyInput]}
                  value={formData.registration_source ? formData.registration_source.charAt(0).toUpperCase() + formData.registration_source.slice(1) : 'Mobile'}
                  editable={false}
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
  },
  scrollContent: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#fff',
  },
  readOnlyInput: {
    backgroundColor: '#F5F5F5',
    color: '#666',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#003366',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  chipsContainer: {
    marginTop: 8,
  },
  chipsLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
  dropdownContainer: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  dropdownOptionSelected: {
    backgroundColor: '#F0F5FF',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownOptionTextSelected: {
    color: '#003366',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#003366',
    fontWeight: '700',
  },
});
