import { concierge } from '@/services/aiService';
import type { ConciergeResponse, SearchParams, Tool } from '@/types/ai.types';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WELCOME =
  'Hi! I can help with planning, point you to tools, or help you find vendors. Ask me about budgets, checklists, or what you need.';

const CHIPS: { id: string; label: string; prompt?: string }[] = [
  { id: 'wedding', label: 'Wedding planning', prompt: 'I am planning a wedding — help me with next steps, tools, and vendors.' },
  { id: 'birthday', label: 'Birthday party', prompt: 'I am planning a birthday party — what should I focus on and which tools help?' },
  { id: 'corporate', label: 'Corporate event', prompt: 'I am organizing a corporate event — guide me on planning and finding vendors.' },
  { id: 'browse', label: 'Browse vendors', prompt: undefined },
];

type ChatRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** Follow-up from concierge (e.g. open tool / explore) */
  actionHint?: string;
  onActionPress?: () => void;
}

function toolRoute(tool: Tool): string | null {
  switch (tool) {
    case 'CHECKLIST':
      return '/checklist-generator';
    case 'BUDGET':
      return '/ai-budget-planner';
    case 'GUESTS':
      return '/guest-list-manager';
    case 'SEATING':
      return '/(tabs)/ai-tools';
    default:
      return null;
  }
}

function exploreParamsFromSearch(filters: SearchParams | null | undefined): Record<string, string> {
  const params: Record<string, string> = {};
  if (!filters) return params;
  const city = filters.city;
  if (typeof city === 'string' && city.trim()) {
    params.city = city.trim();
  } else if (Array.isArray(city) && city[0]) {
    params.city = String(city[0]);
  }
  const vendorName = filters.vendorName;
  if (typeof vendorName === 'string' && vendorName.trim()) {
    params.query = vendorName.trim();
  }
  const et = filters.eventType;
  if (typeof et === 'string' && et.trim()) {
    params.categoryName = et.trim();
    params.categoryType = 'event';
  } else if (Array.isArray(et) && et[0]) {
    params.categoryName = String(et[0]);
    params.categoryType = 'event';
  }
  const st = filters.serviceType;
  if (!params.categoryName) {
    if (typeof st === 'string' && st.trim()) {
      params.categoryName = st.trim();
      params.categoryType = 'service';
    } else if (Array.isArray(st) && st[0]) {
      params.categoryName = String(st[0]);
      params.categoryType = 'service';
    }
  }
  return params;
}

export interface AIConciergeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AIConciergeModal({ visible, onClose }: AIConciergeModalProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  /** Transparent Modal ignores window resize — lift sheet by keyboard height (Android + iOS). */
  const [keyboardPad, setKeyboardPad] = useState(0);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) {
      setMessages([]);
      setInput('');
      setKeyboardPad(0);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = (e: { endCoordinates: { height: number } }) => {
      setKeyboardPad(e.endCoordinates.height);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    };
    const onHide = () => setKeyboardPad(0);
    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [visible]);

  const appendAssistant = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleConciergeResult = useCallback(
    (text: string, res: ConciergeResponse) => {
      let actionHint: string | undefined;
      let onActionPress: (() => void) | undefined;

      if (res.action === 'OPEN_TOOL' && res.tool) {
        const path = toolRoute(res.tool);
        if (path) {
          actionHint = res.tool === 'SEATING' ? 'Open AI Tools' : 'Open tool';
          onActionPress = () => {
            onClose();
            router.push(path as any);
          };
        }
      } else if (res.action === 'CALL_SEARCH') {
        actionHint = 'View vendors';
        const params = exploreParamsFromSearch(res.searchFilters ?? null);
        onActionPress = () => {
          onClose();
          router.push({ pathname: '/explore', params } as any);
        };
      }

      appendAssistant({
        id: `a-${Date.now()}`,
        role: 'assistant',
        text,
        actionHint,
        onActionPress,
      });
    },
    [appendAssistant, onClose, router]
  );

  const sendPrompt = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      const res = await concierge(trimmed);
      handleConciergeResult(res.message, res);
    } catch (e: any) {
      appendAssistant({
        id: `e-${Date.now()}`,
        role: 'assistant',
        text: e?.message || 'Something went wrong. Try again in a moment.',
      });
    } finally {
      setSending(false);
    }
  };

  const onChipPress = (chip: (typeof CHIPS)[number]) => {
    if (chip.id === 'browse') {
      onClose();
      router.push({ pathname: '/explore', params: { bareExplore: '1' } } as any);
      return;
    }
    if (chip.prompt) void sendPrompt(chip.prompt);
  };

  const onSend = () => {
    void sendPrompt(input);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
          {!isUser && (
            <View style={styles.bubbleIcon}>
              <Ionicons name="sparkles" size={14} color="#6366F1" />
            </View>
          )}
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{item.text}</Text>
          {item.actionHint && item.onActionPress && (
            <TouchableOpacity style={styles.inlineAction} onPress={item.onActionPress} activeOpacity={0.85}>
              <Text style={styles.inlineActionText}>{item.actionHint}</Text>
              <Ionicons name="arrow-forward" size={16} color="#6366F1" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  /** Android often reports insets.bottom=0 with 3-button nav; reserve space so content clears the nav bar. */
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 12);
  const sheetHeight = Math.min(
    Math.round(windowHeight * 0.86),
    Math.round(windowHeight - insets.top - 8)
  );

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityRole="button" />
        <View style={[styles.sheetLift, { marginBottom: keyboardPad }]}>
          <View style={[styles.sheet, { height: sheetHeight, paddingBottom: bottomInset + 10 }]}>
            <LinearGradient
              colors={['#F8FAFC', '#EEF2FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.sheetInner}>
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>

              <View style={styles.header}>
                <View style={styles.headerTitleBlock}>
                  <LinearGradient colors={['#6366F1', '#7C3AED']} style={styles.headerAvatar}>
                    <Ionicons name="chatbubbles" size={20} color="#fff" />
                  </LinearGradient>
                  <View>
                    <Text style={styles.headerTitle}>AI Concierge</Text>
                    <Text style={styles.headerSubtitle}>Planning · Tools · Vendors</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeText}>{WELCOME}</Text>
                <View style={styles.chipWrap}>
                  {CHIPS.map((chip) => (
                    <TouchableOpacity
                      key={chip.id}
                      style={styles.chip}
                      onPress={() => onChipPress(chip)}
                      activeOpacity={0.88}>
                      <Text style={styles.chipText}>{chip.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <FlatList
                ref={listRef}
                style={styles.messageList}
                data={messages}
                keyExtractor={(m) => m.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={
                  sending ? (
                    <View style={styles.typingRow}>
                      <ActivityIndicator size="small" color="#6366F1" />
                      <Text style={styles.typingText}>Thinking…</Text>
                    </View>
                  ) : null
                }
                keyboardShouldPersistTaps="handled"
              />

              <View style={styles.composer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ask anything about your event…"
                  placeholderTextColor="#94A3B8"
                  value={input}
                  onChangeText={setInput}
                  editable={!sending}
                  multiline
                  maxLength={2000}
                  onSubmitEditing={onSend}
                  blurOnSubmit={false}
                  onFocus={() =>
                    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }))
                  }
                />
                <TouchableOpacity
                  style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
                  onPress={onSend}
                  disabled={!input.trim() || sending}
                  activeOpacity={0.9}>
                  <LinearGradient
                    colors={input.trim() && !sending ? ['#6366F1', '#7C3AED'] : ['#CBD5E1', '#94A3B8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendGradient}>
                    <Ionicons name="arrow-up" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetLift: {
    width: '100%',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 32,
    zIndex: 2,
  },
  sheetInner: {
    flex: 1,
  },
  messageList: {
    flex: 1,
    flexGrow: 1,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(100,116,139,0.35)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTitleBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
    fontWeight: '500',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexGrow: 1,
  },
  bubbleRow: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  bubbleRowUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '88%',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    backgroundColor: '#0F172A',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  bubbleIcon: {
    marginBottom: 6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
    color: '#1E293B',
  },
  bubbleTextUser: {
    color: '#F8FAFC',
  },
  inlineAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  inlineActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6366F1',
    flex: 1,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingLeft: 4,
  },
  typingText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.9)',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendBtn: {
    marginBottom: 2,
  },
  sendBtnDisabled: {
    opacity: 0.7,
  },
  sendGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
