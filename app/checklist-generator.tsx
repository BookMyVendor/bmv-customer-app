import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Pressable, ActivityIndicator, Alert, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '@/context/AuthContext';
import { getCategoryTree } from '@/services/categoryService';
import { createChecklist, listChecklists, updateChecklistItems } from '@/services/checklistService';
import { Checklist, ChecklistItem, ChecklistItemInput } from '@/types/checklist.types';
import { CHECKLIST_TEMPLATES } from '@/constants/checklistTemplates';

// Helper to get icon for category
const getCategoryIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('venue')) return { icon: 'hotel', family: 'FontAwesome5' };
  if (lower.includes('attire')) return { icon: 'tshirt', family: 'FontAwesome5' };
  if (lower.includes('photo')) return { icon: 'camera', family: 'FontAwesome5' };
  if (lower.includes('decor')) return { icon: 'balloon', family: 'MaterialCommunityIcons' };
  if (lower.includes('food') || lower.includes('catering')) return { icon: 'utensils', family: 'FontAwesome5' };
  return { icon: 'clipboard-list', family: 'FontAwesome5' };
};

const getCategoryColor = (index: number) => {
  const colors = ['#7C3AED', '#2563EB', '#10B981', '#F97316', '#F59E0B', '#EF4444', '#06B6D4'];
  return colors[index % colors.length];
};

export default function ChecklistGeneratorScreen() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [localItems, setLocalItems] = useState<ChecklistItemInput[]>([]);
  
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showStepPicker, setShowStepPicker] = useState(false);
  const [showStepDetails, setShowStepDetails] = useState(false);
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [taskText, setTaskText] = useState('');
  const [selectedStep, setSelectedStep] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const loadData = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      
      // 1. Fetch Event Types
      const catRes = await getCategoryTree({ category_type: 'event' });
      if (catRes.success) {
        setEventTypes(catRes.categories || []);
      }

      // 2. Fetch Existing Checklists
      const checkRes = await listChecklists(accessToken);
      if (checkRes.success && checkRes.checklists.length > 0) {
        const existing = checkRes.checklists[0];
        setChecklist(existing);
        setSelectedEventType(existing.name);
        setLocalItems((existing.items || []).map((item: ChecklistItem) => ({
          task: item.task,
          category: item.category ?? undefined,
          priority: item.priority ?? undefined,
          due_date: item.due_date ?? undefined,
          is_completed: item.is_completed
        })));
      }
    } catch (err) {
      console.error('Failed to load checklist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventTypeSelect = (event: any) => {
    setSelectedEventType(event.name);
    setShowEventPicker(false);
    const template = CHECKLIST_TEMPLATES[event.name];
    if (template) {
      setLocalItems(template.items);
    } else {
      setLocalItems([]);
    }
  };

  const handleSavePlan = async () => {
    if (!selectedEventType) {
      Alert.alert('Error', 'Please select an event type first');
      return;
    }
    
    setActionLoading(true);
    try {
      if (checklist?.id) {
        // Update existing
        const res = await updateChecklistItems({
          checklist_id: checklist.id,
          items: localItems
        }, accessToken || '');
        if (res.success) {
          Alert.alert('Success', 'Plan updated successfully!');
        }
      } else {
        // Create new
        const res = await createChecklist({
          name: selectedEventType,
          items: localItems
        }, accessToken || '');
        if (res.success) {
          setChecklist(res.checklist);
          Alert.alert('Success', 'Plan saved successfully!');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTask = () => {
    if (!taskText.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }
    if (!selectedStep.trim()) {
      Alert.alert('Error', 'Please enter a step name');
      return;
    }

    const newItem: ChecklistItemInput = {
      task: taskText.trim(),
      category: selectedStep.trim(),
      priority: priority,
      is_completed: false
    };

    setLocalItems(prev => [...prev, newItem]);
    setTaskText('');
    Alert.alert('Added', 'Task added to local list. Don\'t forget to Save Plan!');
  };

  const handleToggleTask = (task: any) => {
    setLocalItems(prev => prev.map(i => 
      (i.task === task.task && i.category === task.category)
        ? { ...i, is_completed: !i.is_completed }
        : i
    ));
  };

  const handleDeleteTask = (task: any) => {
    setLocalItems(prev => prev.filter(i => !(i.task === task.task && i.category === task.category)));
  };

  const handleDeleteCategory = (categoryTitle: string) => {
    Alert.alert('Delete Category', `Are you sure you want to delete "${categoryTitle}" and all its tasks?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setLocalItems(prev => prev.filter(i => i.category !== categoryTitle));
        setShowStepDetails(false);
      }}
    ]);
  };

  const handleExportPDF = async () => {
    try {
      setActionLoading(true);
      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 40px;">
            <h1 style="color: #003366;">${selectedEventType} Checklist</h1>
            <hr/>
            ${categories.map(cat => `
              <div style="margin-bottom: 20px;">
                <h2 style="color: ${cat.color};">${cat.title}</h2>
                <ul style="list-style-type: none; padding: 0;">
                  ${localItems.filter(i => i.category === cat.title).map(item => `
                    <li style="padding: 8px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
                      <span style="margin-right: 10px;">${item.is_completed ? '☑' : '☐'}</span>
                      <span style="${item.is_completed ? 'text-decoration: line-through; color: #999;' : ''}">${item.task}</span>
                      <span style="margin-left: auto; font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #eee;">${item.priority || 'medium'}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            `).join('')}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (err) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setActionLoading(false);
    }
  };

  const openCategoryDetails = (category: any) => {
    setActiveCategory(category);
    setShowStepDetails(true);
  };

  const categories = useMemo(() => {
    if (localItems.length === 0) return [];
    
    const groups: Record<string, any[]> = {};
    localItems.forEach(item => {
      const cat = item.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    return Object.keys(groups).map((title, idx) => {
      const items = groups[title];
      const completed = items.filter(i => i.is_completed).length;
      const total = items.length;
      return {
        id: title,
        title,
        completedTasks: completed,
        totalTasks: total,
        percentage: Math.round((completed / total) * 100),
        ...getCategoryIcon(title),
        color: getCategoryColor(idx),
        bgColor: `${getCategoryColor(idx)}10`
      };
    });
  }, [localItems]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <SafeAreaView style={styles.header} edges={['top']}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#003366" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event Checklist Plan</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleExportPDF}>
              <Ionicons name="download-outline" size={22} color="#003366" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSavePlan} disabled={actionLoading}>
              <Ionicons name="save-outline" size={20} color="#003366" />
              <Text style={styles.saveText}>{checklist?.id ? 'Update' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Plan Configuration */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.cardTitle}>Choose Event & Setup</Text>
          </View>
          
          <View style={styles.configRow}>
            <View style={styles.configField}>
              <Text style={styles.fieldLabel}>Event Type</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowEventPicker(true)}>
                <View style={styles.dropdownInner}>
                  <MaterialCommunityIcons name="calendar-star" size={20} color="#F59E0B" />
                  <Text style={styles.dropdownText}>{selectedEventType || 'Select Event'}</Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.configField}>
              <Text style={styles.fieldLabel}>Initial Setup</Text>
              <TouchableOpacity 
                style={[styles.initButton, (!selectedEventType || checklist) && styles.initButtonDisabled]}
                disabled={!!checklist || !selectedEventType || actionLoading}
                onPress={handleSavePlan}
              >
                {actionLoading && !taskText ? (
                  <ActivityIndicator color="#003366" size="small" />
                ) : (
                  <>
                    <Ionicons name={checklist ? "checkmark-circle" : "rocket-outline"} size={18} color="#003366" />
                    <Text style={styles.initButtonText}>{checklist ? 'Ready' : 'Initialize'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Event Picker Modal */}
        <Modal visible={showEventPicker} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowEventPicker(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Event Type</Text>
              <TouchableOpacity onPress={() => setShowEventPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {eventTypes.map((event) => (
                <TouchableOpacity 
                  key={event.id} 
                  style={styles.eventItem}
                  onPress={() => handleEventTypeSelect(event)}
                >
                  <Text style={styles.eventItemText}>{event.name}</Text>
                  {selectedEventType === event.name && (
                    <Ionicons name="checkmark" size={20} color="#003366" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

        {/* Step Picker Modal */}
        <Modal visible={showStepPicker} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowStepPicker(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Step</Text>
              <TouchableOpacity onPress={() => setShowStepPicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.eventItem}
                  onPress={() => {
                    setSelectedStep(cat.title);
                    setShowStepPicker(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.categoryIconBg, { backgroundColor: cat.bgColor, width: 32, height: 32, borderRadius: 8, marginRight: 0 }]}>
                       {cat.family === 'MaterialCommunityIcons' ? (
                         <MaterialCommunityIcons name={cat.icon as any} size={16} color={cat.color} />
                       ) : (
                         <FontAwesome5 name={cat.icon} size={14} color={cat.color} />
                       )}
                    </View>
                    <Text style={styles.eventItemText}>{cat.title}</Text>
                  </View>
                  {selectedStep === cat.title && (
                    <Ionicons name="checkmark" size={20} color="#003366" />
                  )}
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={[styles.eventItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setShowStepPicker(false);
                  // Using a simple timeout to avoid modal overlap issues
                  setTimeout(() => {
                    Alert.alert(
                      "New Step",
                      "Please enter the name of the new step in the 'Assign to Step' field manually if needed, or select from existing.",
                      [{ text: "OK" }]
                    );
                  }, 500);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.categoryIconBg, { backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 8, marginRight: 0 }]}>
                     <Ionicons name="add" size={16} color="#64748B" />
                  </View>
                  <Text style={[styles.eventItemText, { color: '#64748B', fontStyle: 'italic' }]}>Add New Step...</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </Modal>

        {/* Step Details Modal */}
        <Modal visible={showStepDetails} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowStepDetails(false)} />
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { borderLeftWidth: 6, borderLeftColor: activeCategory?.color }]}>
              <View>
                <Text style={styles.modalTitle}>{activeCategory?.title}</Text>
                <Text style={styles.modalSubtitle}>{activeCategory?.completedTasks} of {activeCategory?.totalTasks} tasks done</Text>
              </View>
              <TouchableOpacity onPress={() => setShowStepDetails(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSubHeader}>
              <Text style={styles.modalSubtitle}>{activeCategory?.completedTasks} of {activeCategory?.totalTasks} tasks done</Text>
              <TouchableOpacity onPress={() => handleDeleteCategory(activeCategory?.title)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} contentContainerStyle={{ paddingBottom: 40 }}>
              {localItems.filter(i => i.category === activeCategory?.title).map((item, idx) => (
                <View key={idx} style={styles.taskItem}>
                  <TouchableOpacity 
                    style={styles.taskCheckArea}
                    onPress={() => handleToggleTask(item)}
                  >
                    <View style={[styles.checkbox, item.is_completed && { backgroundColor: activeCategory?.color, borderColor: activeCategory?.color }]}>
                      {item.is_completed && <Ionicons name="checkmark" size={14} color="#FFF" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskItemText, item.is_completed && styles.taskItemTextDone]}>
                        {item.task}
                      </Text>
                      <Text style={[styles.priorityLabel, { color: item.priority === 'high' ? '#EF4444' : item.priority === 'medium' ? '#F59E0B' : '#10B981' }]}>
                        {item.priority?.toUpperCase()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => handleDeleteTask(item)} style={styles.deleteTaskBtn}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {localItems.filter(i => i.category === activeCategory?.title).length === 0 && (
                <Text style={styles.emptyText}>No tasks in this category yet.</Text>
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Add Custom Task */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.cardTitle}>Add To-Do Item</Text>
          </View>
          
          <Text style={styles.fieldLabel}>Assign to Step</Text>
          <TouchableOpacity style={styles.dropdownFull} onPress={() => setShowStepPicker(true)}>
            <View style={styles.dropdownInner}>
              <Ionicons name="layers-outline" size={20} color="#7C3AED" />
              <Text style={styles.dropdownText}>{selectedStep || 'Select Step'}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Priority</Text>
          <View style={styles.priorityRow}>
            {['low', 'medium', 'high'].map((p) => (
              <TouchableOpacity 
                key={p} 
                style={[styles.priorityChip, priority === p && { backgroundColor: p === 'high' ? '#EF4444' : p === 'medium' ? '#F59E0B' : '#10B981', borderColor: 'transparent' }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityChipText, priority === p && { color: '#FFF' }]}>{p.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.textareaContainer}>
            <TextInput
              style={styles.textarea}
              placeholder="What needs to be done?"
              placeholderTextColor="#94A3B8"
              multiline
              value={taskText}
              onChangeText={setTaskText}
              maxLength={200}
            />
            <Text style={styles.charCount}>{taskText.length}/200</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.addTaskButton, (!taskText || !selectedStep || actionLoading) && { opacity: 0.7 }]} 
            onPress={handleAddTask}
            disabled={!taskText || !selectedStep || actionLoading}
          >
            {actionLoading && taskText ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={24} color="#FFF" />
                <Text style={styles.addTaskButtonText}>Add Task</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Categories Header */}
        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>Your Checklist Categories</Text>
          <TouchableOpacity style={styles.reorderBtn}>
            <Ionicons name="swap-vertical" size={16} color="#003366" />
            <Text style={styles.reorderText}>Reorder</Text>
          </TouchableOpacity>
        </View>

        {/* Category Cards */}
        {loading ? (
          <ActivityIndicator color="#003366" style={{ marginTop: 20 }} />
        ) : categories.length > 0 ? (
          categories.map((category) => (
            <TouchableOpacity 
              key={category.id} 
              style={styles.categoryCard}
              onPress={() => openCategoryDetails(category)}
            >
              <View style={[styles.categoryIconBg, { backgroundColor: category.bgColor }]}>
                {category.family === 'MaterialCommunityIcons' ? (
                  <MaterialCommunityIcons name={category.icon as any} size={24} color={category.color} />
                ) : (
                  <FontAwesome5 name={category.icon} size={18} color={category.color} />
                )}
              </View>
              
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryTitle}>{category.title}</Text>
                <Text style={styles.categorySubtitle}>{category.completedTasks} / {category.totalTasks} tasks complete</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${category.percentage}%`, backgroundColor: category.color }]} />
                </View>
              </View>
              
              <View style={styles.categoryRight}>
                <View style={[styles.percentageBadge, { backgroundColor: `${category.color}10` }]}>
                  <Text style={[styles.percentageText, { color: category.color }]}>{category.percentage}%</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>Initialize your checklist to see steps here</Text>
          </View>
        )}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFF',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#001F3F',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003366',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#003366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#001F3F',
  },
  configRow: {
    flexDirection: 'row',
    gap: 12,
  },
  configField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 4,
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  textareaContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    marginBottom: 16,
  },
  textarea: {
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
    flex: 1,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  addTaskButton: {
    backgroundColor: '#003366',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  addTaskButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  categoriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#001F3F',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reorderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003366',
  },
  categoryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
    marginLeft: 8,
  },
  initButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    gap: 8,
  },
  initButtonDisabled: {
    opacity: 0.5,
  },
  initButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
  },
  fieldInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    marginTop: 'auto',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#001F3F',
  },
  modalList: {
    padding: 10,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  eventItemText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskItemText: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  taskItemTextDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  priorityChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  taskCheckArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  deleteTaskBtn: {
    padding: 8,
  },
});


