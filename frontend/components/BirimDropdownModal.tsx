import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BIRIM_OPTIONS, BIRIM_LABELS, BirimOption } from '@/utils/ingredientUtils';

// ─────────── Birim Dropdown Modal ───────────
export default function BirimDropdownModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: BirimOption;
  onSelect: (v: BirimOption) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#1E293B',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 36,
            paddingTop: 8,
            borderTopWidth: 1,
            borderColor: 'rgba(71, 85, 105, 0.3)',
            maxHeight: '60%',
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: 'rgba(71, 85, 105, 0.5)',
              borderRadius: 2,
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              color: '#F1F5F9',
              fontSize: 16,
              fontWeight: '800',
              paddingHorizontal: 20,
              marginBottom: 12,
            }}
          >
            Birim Seçin
          </Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {BIRIM_OPTIONS.map((opt, idx) => (
              <TouchableOpacity
                key={opt}
                onPress={() => {
                  onSelect(opt);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: 'rgba(71, 85, 105, 0.2)',
                }}
              >
                <Text
                  style={{
                    color: opt === selected ? '#FF6B35' : '#F1F5F9',
                    fontSize: 15,
                    fontWeight: opt === selected ? '700' : '500',
                  }}
                >
                  {BIRIM_LABELS[opt]}
                </Text>
                {opt === selected && (
                  <Ionicons name="checkmark" size={18} color="#FF6B35" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
