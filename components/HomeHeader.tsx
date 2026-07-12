import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeHeader() {
    const [greeting, setGreeting] = useState('Merhaba');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) setGreeting('Günaydın');
        else if (hour >= 12 && hour < 18) setGreeting('Merhaba');
        else if (hour >= 18 && hour < 24) setGreeting('İyi Akşamlar');
        else setGreeting('İyi Geceler');
    }, []);

    return (
        // pt-12 yerine sadece normal dikey padding (py-4) bıraktık, üst boşluğu Expo kendisi yönetecek
        <View className="bg-[#0F172A] py-4 px-5 border-b border-slate-400/50 pt-12">
            {/* Üst Satır: Logo ve Bildirim Çanı */}
            <View className="flex-row items-center">
                <View className="flex-row items-center w-9 h-9">
                    <Image style={{width:40,height:40}} resizeMode='contain' source={require('../assets/images/logo.png')} />
                </View>
                <View className='ml-3'>
                    <Text className="text-2xl font-bold text-white tracking-tight">
                        {greeting}, <Text className="text-[#FF6B35]">Ömer!</Text>
                    </Text>
                </View>

                <TouchableOpacity className="relative p-2 bg-slate-800/40 rounded-full ml-auto">
                    <Ionicons name="notifications-outline" size={22} color="#F8FAFC" />
                    <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#FF6B35] rounded-full border border-[#0F172A]" />
                </TouchableOpacity>
            </View>

            {/* Alt Satır: Dinamik Karşılama */}

        </View>
    );
}