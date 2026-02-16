import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CircularProgress({
    size = 100,
    strokeWidth = 8,
    progress = 0, // 0 to 1
    streakNumber,
    maxProgress = 7
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const progressOffset = circumference - (progress / maxProgress) * circumference;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Background circle */}
                <Circle
                    stroke="#334155"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />

                {/* Progress circle */}
                <Circle
                    stroke="#22c55e"
                    fill="none"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                    strokeLinejoin="round"
                />
            </Svg>

            {/* Center content */}
            <View style={styles.centerContent}>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakNumber}>{streakNumber}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    centerContent: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakEmoji: {
        fontSize: 50,
        position: 'absolute',
    },
    streakNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffffff',
        position: 'absolute',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        top: 0, // Add this line - pushes it down 8 pixels
    },
});