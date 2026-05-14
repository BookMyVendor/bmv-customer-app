import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, RefreshControl, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { useAuth } from '@/context/AuthContext';
import { getOrCreateGuestList, listGuests, addGuest, updateGuest, deleteGuest } from '@/services/guestService';
import { Guest } from '@/types/guest.types';

const EVENT_NAME = 'My Event';

const CATEGORIES = ['Family', 'Friends', 'Colleague', 'Others'];
const RSVP_OPTIONS = ['Pending', 'Attending', 'Not Attending'];

/** API expects: pending | attending | not-attending */
function rsvpStatusForApi(uiLabel: string): string {
  const t = uiLabel.trim().toLowerCase();
  if (t === 'attending') return 'attending';
  if (t === 'not attending') return 'not-attending';
  return 'pending';
}

function rsvpStatusFromApi(api: string | null | undefined): string {
  const t = (api || '').toLowerCase().trim().replace(/_/g, '-');
  if (t === 'attending' || t === 'yes') return 'Attending';
  if (t === 'not-attending' || t === 'notattending' || t === 'no' || t === 'declined') return 'Not Attending';
  return 'Pending';
}


const statusColor = (status: string | null) => {
  const n = (status || '').toLowerCase().trim().replace(/_/g, '-');
  if (n === 'attending' || n === 'yes') {
    return { color: '#047857', label: 'Attending', bg: '#D1FAE5' };
  }
  if (n === 'pending' || n === '') {
    return { color: '#B45309', label: 'Pending', bg: '#FEF3C7' };
  }
  if (n === 'not-attending' || n === 'notattending' || n === 'no' || n === 'declined') {
    return { color: '#B91C1C', label: 'Not Attending', bg: '#FEE2E2' };
  }
  return { color: '#475569', label: status || 'Pending', bg: '#F1F5F9' };
};

const StatCard = ({ label, value, subValue, progress, color, outerStyle }: any) => (
  <View style={[styles.statCardOuter, outerStyle]}>
    <View style={[styles.statCardAccent, { backgroundColor: color }]} />
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {subValue ? <Text style={styles.statSubValue}>{subValue}</Text> : null}
      </View>
      <View style={styles.progressBarContainer}>
        <LinearGradient
          colors={[color, `${color}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, progress))}%` }]}
        />
      </View>
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
          <LinearGradient colors={['#EEF2FF', '#F5F3FF']} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          </LinearGradient>
          <View style={styles.guestMain}>
            <Text style={styles.guestName}>{guest.name}</Text>
            <View style={styles.guestMetaRow}>
              <View style={styles.categoryPill}>
                <Text style={styles.categoryPillText}>{guest.category || 'General'}</Text>
              </View>
              <View style={[styles.rsvpPill, { backgroundColor: sc.bg }]}>
                <Text style={[styles.rsvpPillText, { color: sc.color }]}>{sc.label}</Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </View>
      </View>
    </Swipeable>
  );
};

export default function GuestListManagerScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const statTileWidth = (windowWidth - 32 - 10) / 2;
  const { accessToken } = useAuth();
  const currentEventName = EVENT_NAME;
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestListId, setGuestListId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  const [filterDropdown, setFilterDropdown] = useState<null | 'category' | 'rsvp'>(null);

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
  const [guestSearch, setGuestSearch] = useState('');

  const [contacts, setContacts] = useState<any[]>([]);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    if (accessToken) {
      initGuestList();
    }
  }, [accessToken]);

  const initGuestList = async () => {
    try {
      setLoading(true);

      const res = await getOrCreateGuestList({ event_name: EVENT_NAME }, accessToken || '');
      if (res.success) {
        setGuestListId(res.guest_list.id);
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
          rsvp_status: rsvpStatusForApi(rsvpStatus),
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
          rsvp_status: rsvpStatusForApi(rsvpStatus),
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
    setRsvpStatus(rsvpStatusFromApi(guest.rsvp_status));
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
    const q = guestSearch.trim().toLowerCase();
    const searchMatch = !q || (g.name && g.name.toLowerCase().includes(q));
    const catMatch =
      selectedCategory === 'All' || g.category?.toLowerCase() === selectedCategory.toLowerCase();
    const r = (g.rsvp_status || '').toLowerCase().trim().replace(/_/g, '-');
    const rsvpMatch =
      selectedRSVP === 'All' ||
      (selectedRSVP === 'Attending' && (r === 'attending' || r === 'yes')) ||
      (selectedRSVP === 'Not Attending' &&
        (r === 'not-attending' || r === 'notattending' || r === 'no' || r === 'declined')) ||
      (selectedRSVP === 'Pending' && (!g.rsvp_status || r === '' || r === 'pending'));
    return searchMatch && catMatch && rsvpMatch;
  });

  const stats = {
    total: guests.length,
    attending: guests.filter(g => {
      const r = g.rsvp_status?.toLowerCase().trim().replace(/_/g, '-') || '';
      return r === 'attending' || r === 'yes';
    }).length,
    pending: guests.filter(g => {
      const r = g.rsvp_status?.toLowerCase().trim().replace(/_/g, '-') || '';
      return !g.rsvp_status || r === '' || r === 'pending';
    }).length,
    notAttending: guests.filter(g => {
      const r = g.rsvp_status?.toLowerCase().trim().replace(/_/g, '-') || '';
      return r === 'not-attending' || r === 'notattending' || r === 'no' || r === 'declined';
    }).length,
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
        <StatusBar style="dark" />

        <LinearGradient
          colors={['#FFFBFF', '#F5F3FF', '#EEF2FF', '#ECFEFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.heroRow}>
              <TouchableOpacity style={styles.heroBack} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-back" size={24} color="#334155" />
              </TouchableOpacity>
              <View style={styles.heroTitleBlock}>
                <Text style={styles.heroEyebrow}>Guest list</Text>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {currentEventName}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor="#6366F1"
              onRefresh={() => {
                if (guestListId) fetchGuests(guestListId);
              }}
            />
          }
        >
          <View style={styles.statsRow}>
            <StatCard
              label="Guests"
              value={stats.total}
              progress={100}
              color="#6366F1"
              outerStyle={{ width: statTileWidth }}
            />
            <StatCard
              label="Attending"
              value={stats.attending}
              progress={stats.total > 0 ? (stats.attending / stats.total) * 100 : 0}
              color="#10B981"
              outerStyle={{ width: statTileWidth }}
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              progress={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
              color="#F59E0B"
              outerStyle={{ width: statTileWidth }}
            />
            <StatCard
              label="Not attending"
              value={stats.notAttending}
              progress={stats.total > 0 ? (stats.notAttending / stats.total) * 100 : 0}
              color="#EF4444"
              outerStyle={{ width: statTileWidth }}
            />
          </View>

          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search guests…"
                style={styles.searchInput}
                placeholderTextColor="#94A3B8"
                value={guestSearch}
                onChangeText={setGuestSearch}
              />
            </View>
          </View>

          <View style={styles.filterDropdownRow}>
            <Pressable style={styles.filterDropdown} onPress={() => setFilterDropdown('category')}>
              <Text style={styles.filterDropdownLabel}>Category</Text>
              <View style={styles.filterDropdownValueRow}>
                <Text style={styles.filterDropdownValue} numberOfLines={1}>
                  {selectedCategory}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" style={styles.filterDropdownChevron} />
              </View>
            </Pressable>
            <Pressable style={styles.filterDropdown} onPress={() => setFilterDropdown('rsvp')}>
              <Text style={styles.filterDropdownLabel}>RSVP</Text>
              <View style={styles.filterDropdownValueRow}>
                <Text style={styles.filterDropdownValue} numberOfLines={1}>
                  {selectedRSVP}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" style={styles.filterDropdownChevron} />
              </View>
            </Pressable>
          </View>

          <View style={styles.listSection}>
            {loading ? (
              <ActivityIndicator color="#6366F1" style={{ marginTop: 48 }} size="large" />
            ) : filteredGuests.length > 0 ? (
              filteredGuests.map(guest => (
                <GuestCardItem key={guest.id} guest={guest} onDelete={handleDeleteGuest} onEdit={handleEditGuest} />
              ))
            ) : (
              <View style={styles.emptyWrap}>
                <LinearGradient colors={['#EEF2FF', '#FCE7F3']} style={styles.emptyIconBg}>
                  <Ionicons name="people-outline" size={40} color="#6366F1" />
                </LinearGradient>
                <Text style={styles.emptyTitle}>No one here yet</Text>
                <Text style={styles.emptyText}>Adjust filters or add your first guest with the + button.</Text>
              </View>
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.fabOuter, { bottom: 24 + insets.bottom, right: 20 }]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.92}
        >
          <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
            <Ionicons name="add" size={30} color="#fff" />
          </LinearGradient>
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
                <Text style={styles.modalTitle}>{editingGuest ? 'Edit guest' : 'Add guest'}</Text>
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
                      <ActivityIndicator size={14} color="#6366F1" style={{ marginRight: 4 }} />
                    ) : (
                      <Ionicons name="people-outline" size={14} color="#6366F1" style={{ marginRight: 4 }} />
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
                    style={[styles.addGuestButtonOuter, actionLoading && { opacity: 0.75 }]}
                    onPress={handleAddOrUpdateGuest}
                    disabled={actionLoading}
                  >
                    <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.addGuestButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                      {actionLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.addGuestButtonText}>{editingGuest ? 'Save changes' : 'Add guest'}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={filterDropdown !== null}
          transparent
          animationType="fade"
          onRequestClose={() => setFilterDropdown(null)}
        >
          <View style={styles.filterPickerOverlay}>
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setFilterDropdown(null)} />
            <View style={styles.filterPickerCard}>
              <Text style={styles.filterPickerTitle}>
                {filterDropdown === 'category' ? 'Category' : 'RSVP status'}
              </Text>
              {(filterDropdown === 'category' ? ['All', ...CATEGORIES] : ['All', ...RSVP_OPTIONS]).map(opt => {
                const selected = filterDropdown === 'category' ? selectedCategory === opt : selectedRSVP === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.filterPickerRow, selected && styles.filterPickerRowActive]}
                    onPress={() => {
                      if (filterDropdown === 'category') setSelectedCategory(opt);
                      else setSelectedRSVP(opt);
                      setFilterDropdown(null);
                    }}
                  >
                    <Text style={[styles.filterPickerRowText, selected && styles.filterPickerRowTextActive]}>{opt}</Text>
                    {selected ? <Ionicons name="checkmark-circle" size={22} color="#6366F1" /> : null}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.filterPickerClose} onPress={() => setFilterDropdown(null)}>
                <Text style={styles.filterPickerCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  heroGradient: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 18,
    gap: 12,
  },
  heroBack: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTitleBlock: { flex: 1, minWidth: 0 },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', marginTop: 4, letterSpacing: -0.3 },

  scrollContent: { paddingTop: 16 },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 18,
  },
  statCardOuter: {
    flexDirection: 'row',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8ECF2',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  statCardAccent: { width: 4 },
  statCard: { flex: 1, paddingVertical: 14, paddingHorizontal: 12 },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', marginBottom: 6, letterSpacing: 0.6 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  statSubValue: { fontSize: 11, fontWeight: '600', color: '#6366F1', marginLeft: 4 },
  progressBarContainer: { height: 5, backgroundColor: '#F1F5F9', borderRadius: 999, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 999, minWidth: 4 },

  searchSection: { paddingHorizontal: 16, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F172A', fontWeight: '500' },

  filterDropdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  filterDropdown: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filterDropdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  filterDropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 22,
  },
  filterDropdownValue: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  filterDropdownChevron: { marginTop: 1 },
  filterPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  filterPickerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  filterPickerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    textAlign: 'center',
  },
  filterPickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  filterPickerRowActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  filterPickerRowText: { fontSize: 15, fontWeight: '600', color: '#475569', flex: 1 },
  filterPickerRowTextActive: { color: '#4338CA', fontWeight: '800' },
  filterPickerClose: { marginTop: 8, paddingVertical: 12, alignItems: 'center' },
  filterPickerCloseText: { color: '#64748B', fontWeight: '700', fontSize: 14 },

  listSection: { paddingHorizontal: 16, paddingBottom: 8 },
  emptyWrap: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  emptyIconBg: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#334155' },
  emptyText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 20, maxWidth: 280 },

  guestCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  guestCardInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: { fontSize: 15, fontWeight: '800', color: '#4338CA' },
  guestMain: { flex: 1, minWidth: 0 },
  guestName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  guestMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryPillText: { fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'capitalize' },
  rsvpPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rsvpPillText: { fontSize: 11, fontWeight: '800' },

  swipeActions: { flexDirection: 'row', marginLeft: 8, marginBottom: 10 },
  editSwipe: {
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 18,
    marginRight: 8,
  },
  deleteSwipe: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 18,
  },
  swipeText: { color: '#fff', fontSize: 10, fontWeight: '700', marginTop: 4 },

  fabOuter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fab: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: { paddingHorizontal: 24 },

  // Fields
  fieldLabel: { fontSize: 11, fontWeight: '800', color: '#666', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  importLinkBtn: { flexDirection: 'row', alignItems: 'center' },
  importLink: { fontSize: 13, fontWeight: '700', color: '#6366F1' },

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
  segmentActive: { backgroundColor: '#6366F1' },
  segmentText: { fontSize: 12, fontWeight: '700', color: '#666', textAlign: 'center' },
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
  categoryChipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  categoryChipText: { fontSize: 13, fontWeight: '600', color: '#666' },
  categoryChipTextActive: { color: '#fff' },

  // Modal Actions
  modalActions: {
    flexDirection: 'row', gap: 12, marginTop: 32, paddingBottom: 10,
  },
  draftButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  draftButtonText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
  addGuestButtonOuter: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  addGuestButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  addGuestButtonText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
