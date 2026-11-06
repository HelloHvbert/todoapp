import { NativeTabs } from 'expo-router/native-tabs';
import { useColors } from '@/constants/theme';

export default function TabsLayout() {
  const c = useColors();
  return (
    <NativeTabs
      backgroundColor={c.card}
      indicatorColor={c.accentSoft}
      iconColor={{ default: c.muted, selected: c.accent }}
      labelStyle={{ default: { color: c.muted }, selected: { color: c.accent } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dziś</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} md="today" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="calendar">
        <NativeTabs.Trigger.Label>Kalendarz</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="general">
        <NativeTabs.Trigger.Label>Ogólne</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'tray', selected: 'tray.fill' }} md="inbox" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shopping">
        <NativeTabs.Trigger.Label>Zakupy</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'cart', selected: 'cart.fill' }} md="shopping_cart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
