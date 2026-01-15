/**
 * PaginationDots Component
 * Visual indicator for onboarding slide position
 */

import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';

interface PaginationDotsProps {
    totalDots: number;
    activeIndex: number;
    dotSize?: number;
    spacing?: number;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({
    totalDots,
    activeIndex,
    dotSize = 10,
    spacing = 8,
}) => {
    const theme = useTheme();

    return (
        <View style={styles.container}>
            {Array.from({ length: totalDots }).map((_, index) => {
                const isActive = index === activeIndex;

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: isActive ? dotSize * 2.5 : dotSize,
                                height: dotSize,
                                marginHorizontal: spacing / 2,
                                backgroundColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.outlineVariant,
                                borderRadius: dotSize / 2,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dot: {
        borderRadius: 5,
    },
});

export default PaginationDots;
