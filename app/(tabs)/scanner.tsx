import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { SymbolView } from "expo-symbols";

export default function TabScannerScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <StatusBar barStyle="light-content" />

      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 10,
          gap: 16,
        }}
      >
        {/* AI ile Yemek Tarifi Üret Butonu */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            width: "95%",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(30, 41, 59, 0.85)",
            borderRadius: 20,
            paddingVertical: 22,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: "rgba(255, 107, 53, 0.25)",
            shadowColor: "#FF6B35",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {/* İkon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(255, 107, 53, 0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <SymbolView
              name={{
                ios: "wand.and.stars",
                android: "auto_awesome",
                web: "auto_awesome",
              }}
              tintColor="#FF6B35"
              size={28}
            />
          </View>

          {/* Metin */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#F1F5F9",
                fontSize: 17,
                fontWeight: "800",
                letterSpacing: -0.3,
                marginBottom: 4,
              }}
            >
              AI ile Yemek Tarifi Üret
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 17,
              }}
            >
              Buzdolabındaki malzemelerle yemek tarifi oluştur
            </Text>
          </View>

          {/* Sağ Ok */}
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            tintColor="#475569"
            size={18}
          />
        </TouchableOpacity>

        {/* Macro Hesaplama Butonu */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            width: "95%",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(30, 41, 59, 0.85)",
            borderRadius: 20,
            paddingVertical: 22,
            paddingHorizontal: 20,
            borderWidth: 1,
            borderColor: "rgba(16, 185, 129, 0.25)",
            shadowColor: "#10B981",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {/* İkon */}
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <SymbolView
              name={{
                ios: "heart.text.clipboard",
                android: "cardiology",
                web: "cardiology",
              }}
              tintColor="#10B981"
              size={28}
            />
          </View>

          {/* Metin */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#F1F5F9",
                fontSize: 17,
                fontWeight: "800",
                letterSpacing: -0.3,
                marginBottom: 4,
              }}
            >
              Macro Hesaplama
            </Text>
            <Text
              style={{
                color: "#94A3B8",
                fontSize: 12,
                fontWeight: "500",
                lineHeight: 17,
                paddingRight:10,
              }}>
              Yemeğin besin değerlerini ve kalorilerini hesapla
            </Text>
          </View>

          {/* Sağ Ok */}
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            tintColor="#475569"
            size={18}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
