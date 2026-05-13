import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateGuestList, listGuests, addGuest, updateGuest, deleteGuest } from '@/services/guestService';
import { listWeddingBudgetPlans } from '@/services/weddingBudgetService';
import { Guest } from '@/types/guest.types';

const CATEGORIES = ['Family', 'Friends', 'Colleague', 'Others'];
const RSVP_OPTIONS = ['Pending', 'Yes', 'No'];

const INITIAL_GUESTS: Guest[] = [
  { id: '1', name: 'Sarah Mitchell', initials: 'SM', category: 'FRIEND', status: 'ATTENDING', contact: '+1 (555) 012-3456', plusOne: '', dietary: [] },
  { id: '2', name: 'James Bennett', initials: 'JB', category: 'FAMILY', status: 'PENDING', contact: '+1 (555) 012-3456', plusOne: '1', dietary: ['Vegan', 'Nut Allergy'] },
  { id: '3', name: 'Laura Rivera', initials: 'LR', category: 'COLLEAGUE', status: 'DECLINED', contact: '+1 (555) 987-6543', plusOne: '', dietary: [] },
  { id: '4', name: 'David Harrison', initials: 'DH', category: 'PARTNER', status: 'ATTENDING', contact: '+1 (555) 111-2233', plusOne: '', dietary: ['Gluten-free'] },
];

const statusColor = (status: string | null) => {
  switch (status?.toUpperCase()) {
    case 'YES':
    case 'ATTENDING': return { color: '#10B981', label: 'Attending' };
    case 'PENDING': return { color: '#F6A64D', label: 'Pending' };
    case 'NO':
    case 'DECLINED': return { color: '#EF4444', label: 'Declined' };
    default: return { color: '#666', label: status || 'Pending' };
  }
};

// Stat Card Component
const StatCard = ({ label, value, subValue, progress, color }: any) => (
  <View style={styles.statCard}>
    <Text style={styles.statLabel}>{label}</Text>
    <View style={styles.statValueRow}>
      <Text style={styles.statValue}>{value}</Text>
      {subValue && <Text style={styles.statSubValue}>{subValue}</Text>}
    </View>
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  </View>
);

// Guest Card Component
const GuestCardItem = ({ guest, onDelete, onEdit }: any) => {
  const sc = statusColor(guest.rsvp_status);
  const initials = guest.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const renderRightActions = () => (
    <View style={styles.swipeActions}>
      <TouchableOpacity style={styles.editSwipe} onPress={() => onEdit(guest)}>
        <Ionicons name="pencil-outline" size={20} color="#fff" />
        <Text style={styles.swipeText}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteSwipe} onPress={() => onDelete(guest.id)}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.swipeText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} rightThreshold={40}>
      <View style={styles.guestCard}>
        <View style={styles.guestCardInner}>
          <View style={[styles.initialsCircle, { backgroundColor: '#F0F2F5' }]}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
          <View style={styles.guestMain}>
            <Text style={styles.guestName}>{guest.name}</Text>
            <View style={styles.guestSubRow}>
              <Text style={styles.guestCategory}>{guest.category || 'General'}</Text>
              <Text style={styles.dot}> • </Text>
              <Text style={[styles.guestStatus, { color: sc.color }]}>{sc.label}</Text>
            </View>
          </View>

        </View>
      </View>
    </Swipeable>
  );
};

export default function GuestListManagerScreen() {
  const { user, accessToken } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestListId, setGuestListId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  // Event state
  const [currentEventName, setCurrentEventName] = useState<string>('My Event');
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [showEventSelector, setShowEventSelector] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Friends');
  const [rsvpStatus, setRsvpStatus] = useState('Pending');
  const [dietary, setDietary] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRSVP, setSelectedRSVP] = useState('All');

  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (accessToken) {
      initGuestList();
    }
  }, [accessToken]);

  const initGuestList = async (eventName?: string) => {
    try {
      setLoading(true);
      const targetName = eventName || currentEventName;

      // Also fetch budget plans to get event names
      const bRes = await listWeddingBudgetPlans(accessToken || '');
      if (bRes.success && bRes.plans.length > 0) {
        const names = Array.from(new Set(bRes.plans.map(p => p.name)));
        setAvailableEvents(names);
        // If we don't have a specific name, and 'My Event' isn't in the list, use the first plan name
        if (!eventName && !names.includes('My Event') && names.length > 0) {
          // Keep current if it works, otherwise use first
        }
      }

      const res = await getOrCreateGuestList({ event_name: targetName }, accessToken || '');
      if (res.success) {
        setGuestListId(res.guest_list.id);
        setCurrentEventName(res.guest_list.event_name);
        fetchGuests(res.guest_list.id);
      }
    } catch (err) {
      console.error('Init Guest List failed:', err);
      setLoading(false);
    }
  };

  const fetchGuests = async (listId: string) => {
    try {
      setRefreshing(true);
      const res = await listGuests({ list_id: listId, id: listId }, accessToken || '');
      if (res.success) {
        setGuests(res.guests);
      }
    } catch (err) {
      console.error('Fetch guests failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAddOrUpdateGuest = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    setActionLoading(true);
    try {
      if (editingGuest) {
        await updateGuest({
          guest_id: editingGuest.id,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          category,
          rsvp_status: rsvpStatus,
          dietary_restrictions: dietary.trim() || undefined
        }, accessToken || '');
      } else {
        await addGuest({
          list_id: guestListId,
          id: guestListId, // Alias for compatibility
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          category,
          rsvp_status: rsvpStatus,
          dietary_restrictions: dietary.trim() || undefined
        }, accessToken || '');
      }
      fetchGuests(guestListId);
      setModalVisible(false);
      resetForm();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save guest');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    Alert.alert('Delete Guest', 'Are you sure you want to remove this guest?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteGuest({ guest_id: id }, accessToken || '');
            setGuests(prev => prev.filter(g => g.id !== id));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete guest');
          }
        }
      }
    ]);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setName(guest.name);
    setPhone(guest.phone || '');
    setEmail(guest.email || '');
    setCategory(guest.category || 'Friends');
    setRsvpStatus(guest.rsvp_status || 'Pending');
    setDietary(guest.dietary_restrictions || '');
    setModalVisible(true);
  };

  const importContact = async () => {
    try {
      setLoadingContacts(true);

      const { status, canAskAgain } = await Contacts.requestPermissionsAsync();

      if (status !== 'granted') {
        if (!canAskAgain) {
          // Permission permanently denied — offer to open Settings
          Alert.alert(
            'Contacts Permission Required',
            'Please enable Contacts access in Settings to import from your phone book.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
        } else {
          Alert.alert(
            'Permission Required',
            'Contacts permission is required to import contact details.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const validContacts = data
        .filter(c => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

      setContacts(validContacts);
      setContactSearch('');
      setShowContactsModal(true);

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to load contacts. Please try again.');
    } finally {
      setLoadingContacts(false);
    }
  };

  const resetForm = () => {
    setEditingGuest(null);
    setName('');
    setPhone('');
    setEmail('');
    setCategory('Friends');
    setRsvpStatus('Pending');
    setDietary('');
  };

  const filteredGuests = guests.filter(g => {
    const catMatch = selectedCategory === 'All' ||
      g.category?.toLowerCase() === selectedCategory.toLowerCase();
    const rsvpMatch = selectedRSVP === 'All' ||
      g.rsvp_status?.toLowerCase() === selectedRSVP.toLowerCase();
    return catMatch && rsvpMatch;
  });

  const stats = {
    total: guests.length,
    attending: guests.filter(g =>
      ['yes', 'attending'].includes(g.rsvp_status?.toLowerCase() || '')
    ).length,
    pending: guests.filter(g =>
      !g.rsvp_status || ['pending'].includes(g.rsvp_status.toLowerCase())
    ).length,
  };

  const selectContact = (contact: any) => {
    setName(contact.name || '');
    setPhone(contact.phoneNumbers?.[0]?.number || '');
    setEmail(contact.emails?.[0]?.email || '');
    setShowContactsModal(false);
    setContactSearch('');
  };

  const filteredContacts = contacts.filter(c => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.phoneNumbers?.[0]?.number?.includes(q)
    );
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color="#003366" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerTitles} onPress={() => setShowEventSelector(true)}>
              <Text style={styles.headerTitle}>{currentEventName}</Text>
              <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeText}>Change Event</Text>
                <Ionicons name="chevron-down" size={12} color="#003366" />
              </View>
            </TouchableOpacity>

          </View>
        </SafeAreaView>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { if (guestListId) fetchGuests(guestListId); }} />
          }
        >
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard label="TOTAL" value={stats.total} progress={100} color="#003366" />
            <StatCard label="ATTENDING" value={stats.attending} progress={stats.total > 0 ? (stats.attending / stats.total) * 100 : 0} color="#10B981" />
            <StatCard label="PENDING" value={stats.pending} progress={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0} color="#F6A64D" />
          </View>

          {/* Search */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#BBB" />
              <TextInput placeholder="Search by name, role..." style={styles.searchInput} placeholderTextColor="#BBB" />
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>CATEGORIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['All', ...CATEGORIES].map(chip => (
                <TouchableOpacity
                  key={chip}
                  style={[styles.filterChip, selectedCategory === chip && styles.filterChipActive]}
                  onPress={() => setSelectedCategory(chip)}
                >
                  <Text style={[styles.chipText, selectedCategory === chip && styles.chipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.filterLabel}>RSVP STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {['All', ...RSVP_OPTIONS].map(chip => (
                <TouchableOpacity
                  key={chip}
                  style={[styles.filterChip, selectedRSVP === chip && styles.filterChipActive]}
                  onPress={() => setSelectedRSVP(chip)}
                >
                  <Text style={[styles.chipText, selectedRSVP === chip && styles.chipTextActive]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Guest List */}
          <View style={styles.listSection}>
            {loading ? (
              <ActivityIndicator color="#003366" style={{ marginTop: 40 }} />
            ) : filteredGuests.length > 0 ? (
              filteredGuests.map(guest => (
                <GuestCardItem
                  key={guest.id}
                  guest={guest}
                  onDelete={handleDeleteGuest}
                  onEdit={handleEditGuest}
                />
              ))
            ) : (
              <Text style={styles.emptyText}>No guests found matching filters</Text>
            )}
          </View>
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Add Guest Modal */}
        <Modal
          visible={isModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Guest</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {/* Full Name */}
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <TextInput
                  placeholder="e.g. John Miller"
                  style={styles.fieldInput}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#BBB"
                />

                {/* Contact Info */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                  <TouchableOpacity
                    onPress={importContact}
                    disabled={loadingContacts}
                    style={styles.importLinkBtn}
                  >
                    {loadingContacts ? (
                      <ActivityIndicator size={14} color="#003366" style={{ marginRight: 4 }} />
                    ) : (
                      <Ionicons name="people-outline" size={14} color="#003366" style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.importLink}>Import from Contacts</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  placeholder="e.g. +91 9876543210"
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#BBB"
                />

                <Text style={styles.fieldLabel}>EMAIL ADDRESS (OPTIONAL)</Text>
                <TextInput
                  placeholder="e.g. john@example.com"
                  style={styles.fieldInput}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  placeholderTextColor="#BBB"
                />

                {/* Category */}
                <Text style={styles.fieldLabel}>CATEGORY</Text>
                <View style={styles.dropdownContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {CATEGORIES.map(cat => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                        onPress={() => setCategory(cat)}
                      >
                        <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* RSVP Status */}
                <Text style={styles.fieldLabel}>RSVP STATUS</Text>
                <View style={styles.segmentedControl}>
                  {RSVP_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.segment, rsvpStatus === opt && styles.segmentActive]}
                      onPress={() => setRsvpStatus(opt)}
                    >
                      <Text style={[styles.segmentText, rsvpStatus === opt && styles.segmentTextActive]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Dietary Preferences */}
                <Text style={styles.fieldLabel}>DIETARY PREFERENCES</Text>
                <TextInput
                  placeholder="Vegan, Gluten-free, etc."
                  style={styles.fieldInput}
                  value={dietary}
                  onChangeText={setDietary}
                  placeholderTextColor="#BBB"
                />

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.draftButton} onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}>
                    <Text style={styles.draftButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addGuestButton, actionLoading && { opacity: 0.7 }]}
                    onPress={handleAddOrUpdateGuest}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.addGuestButtonText}>{editingGuest ? 'Update Guest' : 'Add Guest'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        {/* Event Selector Modal */}
        <Modal
          visible={showEventSelector}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEventSelector(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowEventSelector(false)}>
            <View style={styles.selectorContent}>
              <Text style={styles.selectorTitle}>Select Event Guest List</Text>
              {['My Event', 'Wedding', ...availableEvents.filter(e => e !== 'My Event' && e !== 'Wedding')].map(evt => (
                <TouchableOpacity
                  key={evt}
                  style={[styles.selectorItem, currentEventName === evt && styles.selectorItemActive]}
                  onPress={() => {
                    setShowEventSelector(false);
                    initGuestList(evt);
                  }}
                >
                  <Text style={[styles.selectorItemText, currentEventName === evt && styles.selectorItemTextActive]}>{evt}</Text>
                  {currentEventName === evt && <Ionicons name="checkmark-circle" size={20} color="#003366" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.selectorClose} onPress={() => setShowEventSelector(false)}>
                <Text style={styles.selectorCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* ─── Contacts Bottom Sheet ─── */}
        <Modal
          visible={showContactsModal}
          animationType="slide"
          transparent
          onRequestClose={() => { setShowContactsModal(false); setContactSearch(''); }}
        >
          <View style={styles.contactsModalWrap}>
            {/* dim backdrop — tap to dismiss */}
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={() => { setShowContactsModal(false); setContactSearch(''); }}
            />
            <View style={styles.contactsSheet}>
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.contactsHeader}>
              <View>
                <Text style={styles.contactsTitle}>Select Contact</Text>
                <Text style={styles.contactsSubtitle}>
                  {filteredContacts.length} of {contacts.length} contacts
                </Text>
              </View>
              <TouchableOpacity
                style={styles.contactsCloseBtn}
                onPress={() => { setShowContactsModal(false); setContactSearch(''); }}
              >
                <Ionicons name="close" size={18} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.contactSearchBar}>
              <Ionicons name="search-outline" size={18} color="#999" />
              <TextInput
                style={styles.contactSearchInput}
                placeholder="Search name or number…"
                placeholderTextColor="#BBB"
                value={contactSearch}
                onChangeText={setContactSearch}
                autoCorrect={false}
              />
              {contactSearch.length > 0 && (
                <TouchableOpacity onPress={() => setContactSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#BBB" />
                </TouchableOpacity>
              )}
            </View>

            {/* Contact list */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {filteredContacts.length === 0 ? (
                <Text style={styles.contactsEmpty}>No contacts found</Text>
              ) : (
                filteredContacts.map((contact, index) => {
                  const initials = (contact.name ?? '')
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const bgColors = ['#E8F2F9', '#F0F5E9', '#FFF3E0', '#F3E5F5', '#FCE4EC'];
                  const bg = bgColors[index % bgColors.length];
                  const txtColors = ['#003366', '#2E7D32', '#E65100', '#6A1B9A', '#880E4F'];
                  const tc = txtColors[index % txtColors.length];
                  return (
                    <TouchableOpacity
                      key={contact.id ?? index}
                      onPress={() => selectContact(contact)}
                      style={styles.contactRow}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.contactInitialsCircle, { backgroundColor: bg }]}>
                        <Text style={[styles.contactInitialsText, { color: tc }]}>{initials}</Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
                        <Text style={styles.contactPhone}>
                          {contact.phoneNumbers?.[0]?.number ?? 'No number'}
                        </Text>
                        {contact.emails?.[0]?.email ? (
                          <Text style={styles.contactEmail} numberOfLines={1}>
                            {contact.emails[0].email}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#CCC" />
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFC' },
  header: { backgroundColor: '#F9FAFC' },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 4 },
  headerTitles: { flex: 1, marginLeft: 8, justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  eventBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventBadgeText: { fontSize: 10, fontWeight: '600', color: '#003366' },
  headerIcon: { marginRight: 12 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F2F5', justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },

  // Stats
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#999', marginBottom: 8 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  statSubValue: { fontSize: 12, fontWeight: '600', color: '#003366', marginLeft: 4 },
  progressBarContainer: { height: 4, backgroundColor: '#F0F2F5', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },

  // Insight Card
  insightCard: {
    backgroundColor: '#E8F2F9',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  insightIconCircle: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  insightTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  insightText: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 16 },
  insightHighlight: { fontWeight: '700', color: '#003366' },
  insightActions: { flexDirection: 'row', gap: 12 },
  automateButton: { backgroundColor: '#003366', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  automateText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  dismissButton: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  dismissText: { color: '#003366', fontSize: 13, fontWeight: '700' },

  // Search
  searchSection: { paddingHorizontal: 16, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 24, paddingHorizontal: 16, height: 50,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333' },

  // Filter
  filterSection: { marginBottom: 20 },
  filterLabel: { fontSize: 10, fontWeight: '800', color: '#999', marginLeft: 16, marginBottom: 8, letterSpacing: 1 },
  chipRow: { paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  filterChip: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  filterChipActive: { backgroundColor: '#003366' },
  chipText: { color: '#666', fontWeight: '600', fontSize: 14 },
  chipTextActive: { color: '#fff' },

  // List
  listSection: { paddingHorizontal: 16 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  guestCard: {
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  guestCardInner: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  initialsCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  initialsText: { fontSize: 14, fontWeight: '700', color: '#666' },
  guestMain: { flex: 1 },
  guestName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', marginBottom: 2 },
  guestSubRow: { flexDirection: 'row', alignItems: 'center' },
  guestCategory: { fontSize: 10, fontWeight: '700', color: '#999' },
  dot: { fontSize: 10, color: '#999' },
  guestStatus: { fontSize: 10, fontWeight: '700' },
  guestRight: { flexDirection: 'row', alignItems: 'center' },

  // Swipe
  swipeActions: { flexDirection: 'row', marginLeft: 8, marginBottom: 12 },
  editSwipe: {
    backgroundColor: '#003366', justifyContent: 'center', alignItems: 'center',
    width: 70, borderRadius: 16, marginRight: 8,
  },
  deleteSwipe: {
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    width: 70, borderRadius: 16,
  },
  swipeText: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 },

  // FAB
  fab: {
    position: 'absolute', bottom: 30, right: 20,
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#003366',
    justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A' },
  closeButton: {
    width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#eee',
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
  },
  modalBody: { paddingHorizontal: 24 },

  // Fields
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#666', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  importLinkBtn: { flexDirection: 'row', alignItems: 'center' },
  importLink: { fontSize: 13, fontWeight: '700', color: '#003366' },

  // Contacts bottom sheet
  contactsModalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  contactsSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 16,
  },
  contactsHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  contactsTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  contactsSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  contactsCloseBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F5F5',
    justifyContent: 'center', alignItems: 'center',
  },
  contactSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F7FA', borderRadius: 12,
    paddingHorizontal: 12, height: 44, marginBottom: 12,
  },
  contactSearchInput: {
    flex: 1, marginLeft: 8, fontSize: 14, color: '#333',
  },
  contactsEmpty: {
    textAlign: 'center', color: '#999', marginTop: 32, fontSize: 15,
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  contactInitialsCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  contactInitialsText: { fontSize: 14, fontWeight: '800' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  contactPhone: { fontSize: 13, color: '#555', marginTop: 2 },
  contactEmail: { fontSize: 12, color: '#888', marginTop: 1 },
  fieldInput: {
    borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14, fontSize: 15, color: '#333',
  },
  dropdownContainer: { marginBottom: 0 },
  dropdown: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 14,
  },
  dropdownText: { fontSize: 15, fontWeight: '600', color: '#333' },

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row', borderWidth: 1, borderColor: '#eee', borderRadius: 12, overflow: 'hidden',
  },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  segmentActive: { backgroundColor: '#003366' },
  segmentText: { fontSize: 14, fontWeight: '700', color: '#666' },
  segmentTextActive: { color: '#fff' },

  // Counter
  counterRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#eee', borderRadius: 12, alignSelf: 'flex-start',
  },
  counterButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  counterButtonText: { fontSize: 20, fontWeight: '700', color: '#333' },
  counterValue: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', paddingHorizontal: 20 },

  categoryChip: {
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#eee',
  },
  categoryChipActive: { backgroundColor: '#003366', borderColor: '#003366' },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  categoryChipTextActive: { color: '#fff' },

  // Modal Actions
  modalActions: {
    flexDirection: 'row', gap: 12, marginTop: 32, paddingBottom: 10,
  },
  draftButton: {
    flex: 1, borderWidth: 1.5, borderColor: '#eee', paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  draftButtonText: { fontSize: 15, fontWeight: '700', color: '#666' },
  addGuestButton: {
    flex: 1, backgroundColor: '#003366', paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center',
  },
  addGuestButtonText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Selector Modal
  selectorContent: {
    backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  selectorTitle: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  selectorItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8,
    backgroundColor: '#F8FAFC'
  },
  selectorItemActive: { backgroundColor: '#E8F2F9' },
  selectorItemText: { fontSize: 15, fontWeight: '600', color: '#444' },
  selectorItemTextActive: { color: '#003366', fontWeight: '700' },
  selectorClose: { marginTop: 12, paddingVertical: 12, alignItems: 'center' },
  selectorCloseText: { color: '#666', fontWeight: '700', fontSize: 14 },
});
