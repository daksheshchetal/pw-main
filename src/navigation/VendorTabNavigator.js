import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

// Vendor Screens
import VendorDashboardScreen from '../screens/vendor/VendorDashboardScreen';
import MenuManagementScreen from '../screens/vendor/MenuManagementScreen';
import OrdersScreen from '../screens/vendor/OrdersScreen';
import EarningsScreen from '../screens/vendor/EarningsScreen';
import VendorProfileScreen from '../screens/vendor/VendorProfileScreen';
import TransactionHistoryScreen from '../screens/vendor/TransactionHistoryScreen';
import AIAdvisorScreen from '../screens/vendor/AIAdvisorScreen';
import StallSetupScreen from '../screens/vendor/StallSetupScreen';
import FinanceHubScreen from '../screens/vendor/FinanceHubScreen';
import StatisticsScreen from '../screens/vendor/StatisticsScreen';
import StoryManagerScreen from '../screens/vendor/StoryManagerScreen';
import ReviewsScreen from '../screens/vendor/ReviewsScreen';
import VendorSettingsScreen from '../screens/vendor/VendorSettingsScreen';
import NotificationsScreen from '../screens/vendor/NotificationsScreen';
import HelpVendorScreen from '../screens/vendor/HelpVendorScreen';
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Dashboard Stack Navigator
 *       <Stack.Screen name="AIAdvisor" component={AIAdvisorScreen} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} />
      <Stack.Screen name="StallSetup" component={StallSetupScreen} />
 * Contains Dashboard and business management screens
 */
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={VendorDashboardScreen}
      options={{
    tabBarLabel: 'Dashboard',
    tabBarIcon: ({ focused }) => (
      <Text style={{ fontSize: focused ? 28 : 24 }}>📊</Text>
    ),
  }} />
    </Stack.Navigator>
  );
}

/**
 * Menu Stack Navigator
 * Contains Menu management screens
 */
function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MenuMain" component={MenuManagementScreen} />
      <Stack.Screen name="StoryManager" component={StoryManagerScreen} />
    </Stack.Navigator>
  );
}

/**
 * Orders Stack Navigator
 * Contains Order management screens
 */
function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersMain" component={OrdersScreen} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} />
    </Stack.Navigator>
  );
}

/**
 * Earnings Stack Navigator
 * Contains Financial screens
 */
function EarningsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EarningsMain" component={EarningsScreen} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} />
      <Stack.Screen name="FinanceHub" component={FinanceHubScreen} />
    </Stack.Navigator>
  );
}

/**
 * Vendor Profile Stack Navigator
 * Contains Profile and settings screens
 */
function VendorProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={VendorProfileScreen} />
      <Stack.Screen name="Settings" component={VendorSettingsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Help" component={HelpVendorScreen} />
    </Stack.Navigator>
  );
}

/**
 * Vendor Tab Navigator
 * Main bottom tab navigation for vendors
 */
export default function VendorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24 }}>📊</Text>
          ),
        }}
      />
      
      <Tab.Screen
        name="Menu"
        component={MenuStack}
        options={{
          tabBarLabel: 'Menu',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24 }}>📋</Text>
          ),
        }}
      />
      
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24 }}>🛍️</Text>
          ),
          tabBarBadge: undefined, // TODO: Add pending orders count badge
        }}
      />
      
      <Tab.Screen
        name="Earnings"
        component={EarningsStack}
        options={{
          tabBarLabel: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24 }}>💰</Text>
          ),
        }}
      />
      
      <Tab.Screen
        name="Profile"
        component={VendorProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ fontSize: focused ? 28 : 24 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}