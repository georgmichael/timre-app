import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Line } from 'react-native-svg';
import { ThemeColors } from '../constants/colors';

interface ElementConfig {
  type: 'planet' | 'clock';
  size: number;
  color: string;
  initialX: number;
  initialY: number;
  driftX: number;
  driftY: number;
  duration: number;
}

interface Props {
  theme: ThemeColors;
}

export default function AnimatedBackground({ theme }: Props) {
  const elements: ElementConfig[] = [
    { type: 'planet', size: 180, color: theme.accent,  initialX: -40, initialY: 60,  driftX: 50,  driftY: 70,  duration: 9000 },
    { type: 'clock',  size: 140, color: theme.purple,  initialX: 220, initialY: 20,  driftX: -40, driftY: 90,  duration: 11000 },
    { type: 'planet', size: 140, color: theme.success, initialX: 80,  initialY: 520, driftX: 60,  driftY: -50, duration: 13000 },
    { type: 'clock',  size: 110, color: theme.accent,  initialX: -20, initialY: 380, driftX: 70,  driftY: -70, duration: 10000 },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <StarField color={theme.textPrimary} />
      {elements.map((el, i) => (
        <FloatingElement key={i} {...el} />
      ))}
      <ShootingStars color={theme.textPrimary} />
    </View>
  );
}

function FloatingElement({
  type, size, color, initialX, initialY, driftX, driftY, duration,
}: ElementConfig) {
  const x = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animX = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: driftX, duration,          useNativeDriver: true }),
        Animated.timing(x, { toValue: 0,      duration,          useNativeDriver: true }),
      ])
    );
    const animY = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: driftY, duration: duration * 1.3, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0,      duration: duration * 1.3, useNativeDriver: true }),
      ])
    );
    animX.start();
    animY.start();
    return () => { animX.stop(); animY.stop(); };
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: initialX,
        top: initialY,
        opacity: 0.2,
        transform: [{ translateX: x }, { translateY: y }],
      }}
    >
      {type === 'planet' ? (
        <PlanetSvg size={size} color={color} />
      ) : (
        <ClockSvg size={size} color={color} />
      )}
    </Animated.View>
  );
}

// Deterministic pseudo-random star data (no Math.random so values are stable across renders)
const STARS = Array.from({ length: 40 }, (_, i) => ({
  left: `${((i * 9301 + 49297) % 10000) / 100}%` as `${number}%`,
  top:  `${((i * 7919 + 31337) % 10000) / 100}%` as `${number}%`,
  size: 1 + (i % 3),          // 1, 2, or 3 px radius
  delay: (i * 137) % 3000,    // stagger 0–3 s
  duration: 1500 + (i * 97) % 2000, // 1.5–3.5 s per half-cycle
}));

function StarField({ color }: { color: string }) {
  return (
    <>
      {STARS.map((s, i) => (
        <Star key={i} color={color} {...s} />
      ))}
    </>
  );
}

interface StarProps {
  color: string;
  left: `${number}%`;
  top: `${number}%`;
  size: number;
  delay: number;
  duration: number;
}

function Star({ color, left, top, size, delay, duration }: StarProps) {
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation;
    const timeout = setTimeout(() => {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.55, duration, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.15, duration, useNativeDriver: true }),
        ])
      );
      anim.start();
    }, delay);
    return () => {
      clearTimeout(timeout);
      anim?.stop();
    };
  }, []);

  const diameter = size * 2;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        width: diameter,
        height: diameter,
        borderRadius: size,
        backgroundColor: color,
        opacity,
      }}
    />
  );
}

// Shooting stars travel upper-left → lower-right at ~40°
const SHOOT_DX = 180;
const SHOOT_DY = 150;
const SHOOT_ANGLE = Math.atan2(SHOOT_DY, SHOOT_DX) * (180 / Math.PI); // ≈ 40°

const SHOOTING_STAR_DATA = [
  { left: '15%' as `${number}%`, top: '8%'  as `${number}%`, waitMs: 4000,  shootMs: 650 },
  { left: '55%' as `${number}%`, top: '4%'  as `${number}%`, waitMs: 9000,  shootMs: 550 },
  { left: '5%'  as `${number}%`, top: '30%' as `${number}%`, waitMs: 14500, shootMs: 700 },
];

function ShootingStars({ color }: { color: string }) {
  return (
    <>
      {SHOOTING_STAR_DATA.map((s, i) => (
        <ShootingStar key={i} color={color} {...s} />
      ))}
    </>
  );
}

interface ShootingStarProps {
  color: string;
  left: `${number}%`;
  top: `${number}%`;
  waitMs: number;
  shootMs: number;
}

function ShootingStar({ color, left, top, waitMs, shootMs }: ShootingStarProps) {
  const tx      = useRef(new Animated.Value(0)).current;
  const ty      = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        // Instantly snap back to origin while invisible (opacity is 0 from last shot)
        Animated.parallel([
          Animated.timing(tx,      { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(ty,      { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        // Pause between shots
        Animated.delay(waitMs),
        // The shot: streak across while fading in then out
        Animated.parallel([
          Animated.timing(tx, {
            toValue: SHOOT_DX, duration: shootMs,
            easing: Easing.linear, useNativeDriver: true,
          }),
          Animated.timing(ty, {
            toValue: SHOOT_DY, duration: shootMs,
            easing: Easing.linear, useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.75, duration: shootMs * 0.2,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0, duration: shootMs * 0.8,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        top,
        opacity,
        transform: [
          { translateX: tx },
          { translateY: ty },
          { rotate: `${SHOOT_ANGLE}deg` },
        ],
      }}
    >
      <View
        style={{
          width: 110,
          height: 2,
          borderRadius: 1,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
}

function PlanetSvg({ size, color }: { size: number; color: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const bodyR = size * 0.28;
  const ringRX = size * 0.44;
  const ringRY = size * 0.11;

  return (
    <Svg width={size} height={size}>
      {/* Ring behind planet body */}
      <Ellipse cx={cx} cy={cy} rx={ringRX} ry={ringRY} fill="none" stroke={color} strokeWidth={3} />
      {/* Planet body (covers back half of ring, leaving ring visible on sides) */}
      <Circle cx={cx} cy={cy} r={bodyR} fill={color} />
    </Svg>
  );
}

function ClockSvg({ size, color }: { size: number; color: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cx = size / 2;
  const cy = size / 2;
  const faceR = size * 0.44;

  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);

  const secs = now.getSeconds();
  const mins = now.getMinutes() + secs / 60;
  const hrs  = (now.getHours() % 12) + mins / 60;

  const minuteAngle = toRad((mins / 60) * 360);
  const hourAngle   = toRad((hrs  / 12) * 360);
  const minuteLen   = faceR * 0.72;
  const hourLen     = faceR * 0.52;

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle  = toRad((i / 12) * 360);
    const innerR = faceR * (i % 3 === 0 ? 0.78 : 0.84);
    const outerR = faceR * 0.95;
    return {
      x1: cx + Math.cos(angle) * innerR,
      y1: cy + Math.sin(angle) * innerR,
      x2: cx + Math.cos(angle) * outerR,
      y2: cy + Math.sin(angle) * outerR,
      thick: i % 3 === 0,
    };
  });

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cy} r={faceR} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={2.5} />
      {ticks.map((t, i) => (
        <Line
          key={i}
          x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={color} strokeWidth={t.thick ? 2.5 : 1.2} strokeLinecap="round"
        />
      ))}
      <Line
        x1={cx} y1={cy}
        x2={cx + Math.cos(hourAngle) * hourLen}
        y2={cy + Math.sin(hourAngle) * hourLen}
        stroke={color} strokeWidth={3.5} strokeLinecap="round"
      />
      <Line
        x1={cx} y1={cy}
        x2={cx + Math.cos(minuteAngle) * minuteLen}
        y2={cy + Math.sin(minuteAngle) * minuteLen}
        stroke={color} strokeWidth={2.5} strokeLinecap="round"
      />
      <Circle cx={cx} cy={cy} r={3.5} fill={color} />
    </Svg>
  );
}
