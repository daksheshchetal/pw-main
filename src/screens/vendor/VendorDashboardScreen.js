import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../services/firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, ORDER_STATUS } from '../../constants';

export default function VendorDashboardScreen({ navigation }) {
  const { currentUser, logOut } = useAuth();

  const [isOnline, setIsOnline] = useState(false);
  const [todayStats, setTodayStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayEarnings: 0,
    cashEarnings: 0,
    upiEarnings: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch vendor online status
  useEffect(() => {
    const vendorRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(vendorRef, (doc) => {
      if (doc.exists()) {
        setIsOnline(doc.data().isOnline || false);
      }
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  // Fetch today's orders and calculate stats
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('vendorId', '==', currentUser.uid),
      where('createdAt', '>=', Timestamp.fromDate(today))
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders = [];
        let pending = 0;
        let completed = 0;
        let totalEarnings = 0;
        let cash = 0;
        let upi = 0;

        snapshot.forEach((doc) => {
          const order = { id: doc.id, ...doc.data() };
          orders.push(order);

          // Count by status
          if (order.status === 'pending' || order.status === 'accepted') {
            pending++;
          }
          if (order.status === 'delivered') {
            completed++;
            totalEarnings += order.totalAmount || 0;

            // Split by payment method
            if (order.paymentMethod === 'cash') {
              cash += order.totalAmount || 0;
            } else if (order.paymentMethod === 'upi') {
              upi += order.totalAmount || 0;
            }
          }
        });

        // Sort by most recent first
        orders.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

        setTodayStats({
          totalOrders: orders.length,
          pendingOrders: pending,
          completedOrders: completed,
          todayEarnings: totalEarnings,
          cashEarnings: cash,
          upiEarnings: upi,
        });
        setRecentOrders(orders.slice(0, 5)); // Show only 5 recent orders
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser.uid]);

  const toggleOnlineStatus = async (value) => {
    try {
      const vendorRef = doc(db, 'users', currentUser.uid);
      await updateDoc(vendorRef, {
        isOnline: value,
        lastActive: new Date(),
      });
      setIsOnline(value);
      Alert.alert(
        value ? 'You are now ONLINE' : 'You are now OFFLINE',
        value
          ? 'Customers can now see your stall'
          : 'Your stall is hidden from customers'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Could not update status. Please try again.');
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // The onSnapshot listener will automatically refresh the data
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getTimeGreeting()} 👋</Text>
          <Text style={styles.title}>Your Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Online/Offline Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? COLORS.success : COLORS.textTertiary },
              ]}
            />
            <View>
              <Text style={styles.statusTitle}>
                {isOnline ? 'Your stall is OPEN' : 'Your stall is CLOSED'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isOnline
                  ? 'Visible to customers nearby'
                  : 'Hidden from customers'}
              </Text>
            </View>
          </View>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isOnline ? COLORS.success : '#f4f3f4'}
          />
        </View>

        {/* Today's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>

          <View style={styles.statsGrid}>
            {/* Total Orders */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={styles.statEmoji}>📦</Text>
              <Text style={styles.statValue}>{todayStats.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </TouchableOpacity>

            {/* Pending Orders */}
            <TouchableOpacity
              style={[styles.statCard, styles.statCardHighlight]}
              onPress={() => navigation.navigate('Orders', { filter: 'pending' })}
            >
              <Text style={styles.statEmoji}>⏳</Text>
              <Text style={styles.statValue}>{todayStats.pendingOrders}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </TouchableOpacity>

            {/* Completed Orders */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('Orders', { filter: 'delivered' })}
            >
              <Text style={styles.statEmoji}>✅</Text>
              <Text style={styles.statValue}>{todayStats.completedOrders}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </TouchableOpacity>

            {/* Today's Earnings */}
            <TouchableOpacity
              style={[styles.statCard, styles.statCardSuccess]}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>
                ₹{todayStats.todayEarnings.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Today's Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Breakdown</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <View style={styles.earningsItem}>
                <Text style={styles.earningsEmoji}>💵</Text>
                <View>
                  <Text style={styles.earningsLabel}>Cash</Text>
                  <Text style={styles.earningsValue}>
                    ₹{todayStats.cashEarnings.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.earningsItem}>
                <Text style={styles.earningsEmoji}>📱</Text>
                <View>
                  <Text style={styles.earningsLabel}>UPI</Text>
                  <Text style={styles.earningsValue}>
                    ₹{todayStats.upiEarnings.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Orders')}
            >
              <Text style={styles.actionEmoji}>📋</Text>
              <Text style={styles.actionText}>View Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Menu')}
            >
              <Text style={styles.actionEmoji}>🍽️</Text>
              <Text style={styles.actionText}>Manage Menu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Earnings')}
            >
              <Text style={styles.actionEmoji}>💰</Text>
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Coming Soon', 'AI tips feature coming soon!')}
            >
              <Text style={styles.actionEmoji}>🤖</Text>
              <Text style={styles.actionText}>AI Tips</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyText}>No orders yet today</Text>
              <Text style={styles.emptySubtext}>
                Orders will appear here when customers place them
              </Text>
            </View>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() =>
                  navigation.navigate('OrderDetails', { orderId: order.id, order })
                }
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{order.id.slice(-6)}</Text>
                  <View
                    style={[
                      styles.orderStatusBadge,
                      {
                        backgroundColor:
                          ORDER_STATUS[order.status?.toUpperCase()]?.color ||
                          COLORS.textTertiary,
                      },
                    ]}
                  >
                    <Text style={styles.orderStatusText}>
                      {order.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.orderItems}>
                    {order.items?.length || 0} items • ₹
                    {order.totalAmount?.toFixed(2) || 0}
                  </Text>
                  <Text style={styles.orderTime}>
                    {order.createdAt?.toDate().toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 24,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.md,
  },
  statusTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAllText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primary,
    fontWeight: FONTS.weights.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardHighlight: {
    backgroundColor: COLORS.warning + '20',
    borderWidth: 2,
    borderColor: COLORS.warning,
  },
  statCardSuccess: {
    backgroundColor: COLORS.success + '20',
    borderWidth: 2,
    borderColor: COLORS.success,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  earningsCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  earningsItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earningsEmoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  earningsLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.xs,
    marginBottom: SPACING.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: FONTS.weights.semibold,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderId: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  orderStatusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  orderStatusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
    color: COLORS.white,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  orderTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textTertiary,
  },
  emptyOrders: {
    backgroundColor: COLORS.white,
    padding: SPACING.xxxl,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  emptySubtext: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: SPACING.xl,
  },
});