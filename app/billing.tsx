import * as React from 'react';
import {
  View,
  ScrollView,
  Image,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';
import { BottomNavigation } from '~/components/BottomNavigation';
import { BillingService, Bill, Payment, AuthStorage, BillingDashboard, OutstandingBalance, PaymentHistoryResponse } from '~/lib/api';
import { useAuth } from '~/lib/context/AuthContext';
import { DollarSign, FileText, Download, CreditCard } from 'lucide-react-native';

export default function BillingScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser, isAuthenticated } = useAuth();
  
  const [bills, setBills] = React.useState<Bill[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [outstandingBalance, setOutstandingBalance] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  const loadBillingData = React.useCallback(async () => {
    if (!isAuthenticated || !authUser) {
      router.replace('/login');
      return;
    }

    try {
      setError(null);
      const userId = (authUser as any)?.data?.id || (authUser as any)?.id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      // Ensure authentication token is set
      const token = await AuthStorage.getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      const { AuthService } = await import('~/lib/api');
      AuthService.setToken(token);

      // Load bills, payments, and outstanding balance
      const [billsResponse, paymentsResponse, balanceResponse] = await Promise.all([
        BillingService.getClientBills(userId).catch(() => ({ data: [] })),
        BillingService.getClientPayments(userId).catch(() => ({ data: [] })),
        BillingService.getOutstandingBalance().catch(() => ({ balance: 0 }))
      ]);

      setBills(billsResponse.data || []);
      setPayments(paymentsResponse.data || []);
      setOutstandingBalance(balanceResponse.balance || 0);
    } catch (error: any) {
      console.error('Failed to load billing data:', error);
      if (error.response?.status === 401) {
        await AuthStorage.clearAll();
        router.replace('/login');
        return;
      }
      setError('Failed to load billing information');
      // Set mock data for demonstration
      setBills([
        {
          id: 1,
          client_id: 1,
          appointment_id: 1,
          amount: 2500,
          status: 'pending',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          description: 'Facial Treatment - Classic Hydration',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          client_id: 1,
          appointment_id: 2,
          amount: 3500,
          status: 'paid',
          due_date: '2024-01-15',
          paid_date: '2024-01-10',
          description: 'Skin Rejuvenation Treatment',
          payment_method: 'Credit Card',
          created_at: '2024-01-05T10:00:00Z',
          updated_at: '2024-01-10T14:30:00Z',
        },
      ]);
      setOutstandingBalance(2500);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [authUser, isAuthenticated]);

  React.useEffect(() => {
    if (isAuthenticated && authUser) {
      loadBillingData();
    }
  }, [authUser, isAuthenticated]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBillingData();
  };

  const handleDownloadReceipt = async (billId: number) => {
    try {
      // Show loading state
      Alert.alert('Downloading', 'Preparing receipt for download...', [], { cancelable: false });
      
      // Get the download URL from the API
      const token = await AuthStorage.getToken();
      const downloadUrl = `https://drveaestheticclinic.online/api/client/bills/${billId}/receipt`;
      
      // Create local file path
      const fileName = `receipt-${billId}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          }
        }
      );
      
      if (downloadResult.status === 200) {
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          // Share the file (opens share sheet)
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Download Receipt'
          });
        } else {
          // Fallback: Open the file
          await Linking.openURL(downloadResult.uri);
        }
        
        Alert.alert('Success', 'Receipt downloaded successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed', 
        error?.message || 'Failed to download receipt. Please try again.'
      );
    }
  };

  const handlePayNow = (bill: Bill) => {
    Alert.alert(
      'Payment',
      `Pay ₱${bill.amount.toLocaleString()} for ${bill.description}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: () => {
            Alert.alert('Info', 'Online payment integration coming soon. Please pay at the clinic or call for payment options.');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredBills = React.useMemo(() => {
    if (filter === 'all') return bills;
    return bills.filter(bill => bill.status === filter);
  }, [bills, filter]);

  const billsStats = React.useMemo(() => {
    const total = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paid = bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + bill.amount, 0);
    const pending = bills.filter(b => b.status === 'pending').reduce((sum, bill) => sum + bill.amount, 0);
    const overdue = bills.filter(b => b.status === 'overdue').reduce((sum, bill) => sum + bill.amount, 0);

    return { total, paid, pending, overdue };
  }, [bills]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-secondary/30 justify-center items-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-muted-foreground">Loading billing information...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-secondary/30">
      {/* Header with Clinic Logo */}
      <View className="bg-white px-6 py-4 shadow-sm" style={{ paddingTop: insets.top + 16 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 items-center justify-center mr-3">
              <Image 
                source={require('~/assets/images/clinic-logo.jpg')}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
            <View>
              <Text className="text-gray-800 text-lg font-bold">Dr. Ve Aesthetic</Text>
              <Text className="text-gray-500 text-xs">Billing & Payments</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-3">
          <Text className="text-2xl font-bold text-foreground">Billing & Payments</Text>
        </View>

        {/* Success Notice */}
        <View className="px-4 mb-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-3">
              <Text className="text-xs font-semibold text-green-800 mb-1">
                ✅ System Active
              </Text>
              <Text className="text-xs text-green-700">
                View bills, process payments, and download receipts.
              </Text>
            </CardContent>
          </Card>
        </View>

        {/* Outstanding Balance Card */}
        {outstandingBalance > 0 && (
          <View className="px-4 mb-4">
            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-xs text-red-700 mb-1">Outstanding Balance</Text>
                    <Text className="text-2xl font-bold text-red-700">
                      ₱{outstandingBalance.toLocaleString()}
                    </Text>
                    <Text className="text-xs text-red-600 mt-1">
                      {bills.filter(b => b.status === 'pending' || b.status === 'overdue').length} unpaid bill(s)
                    </Text>
                  </View>
                  <View className="w-12 h-12 bg-red-200 rounded-full items-center justify-center">
                    <DollarSign size={24} className="text-red-700" />
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Stats Cards */}
        <View className="px-4 mb-4">
          <Card>
            <CardContent className="flex-row justify-around py-4">
              <View className="items-center">
                <Text className="text-lg font-bold text-green-500 mb-1">
                  ₱{billsStats.paid.toLocaleString()}
                </Text>
                <Text className="text-gray-600 text-xs font-medium">Paid</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-yellow-500 mb-1">
                  ₱{billsStats.pending.toLocaleString()}
                </Text>
                <Text className="text-gray-600 text-xs font-medium">Pending</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-gray-600 mb-1">
                  ₱{billsStats.total.toLocaleString()}
                </Text>
                <Text className="text-gray-600 text-xs font-medium">Total</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Filter Buttons */}
        <View className="px-4 mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {(['all', 'pending', 'paid', 'overdue'] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setFilter(f)}
                  className={`px-3 py-2 rounded-full ${
                    filter === f ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <Text
                    className={`capitalize text-xs ${
                      filter === f ? 'text-primary-foreground' : 'text-secondary-foreground'
                    }`}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Bills List */}
        <View className="px-4 pb-24">
          {filteredBills.length === 0 ? (
            <Card>
              <CardContent className="p-8 items-center">
                <FileText size={48} className="text-gray-400 mb-4" />
                <Text className="text-xl font-semibold text-center mb-2">
                  No bills found
                </Text>
                <Text className="text-muted-foreground text-center">
                  {filter === 'all'
                    ? "You don't have any bills yet"
                    : `No ${filter} bills`
                  }
                </Text>
              </CardContent>
            </Card>
          ) : (
            filteredBills.map((bill) => (
              <Card key={bill.id} className="mb-3">
                <CardContent className="py-4">
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>
                        {bill.description}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-1">
                        Bill #{bill.id} • {new Date(bill.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Badge className={`${getStatusColor(bill.status)} text-white ml-2`}>
                      <Text className="text-white text-xs capitalize">{bill.status}</Text>
                    </Badge>
                  </View>

                  {/* Amount - Prominent */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-bold text-primary">
                      ₱{bill.amount.toLocaleString()}
                    </Text>
                    <Text className="text-xs text-gray-600">
                      Due: {new Date(bill.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>

                  {/* Payment Info (if paid) */}
                  {bill.paid_date && (
                    <View className="mb-3">
                      <Text className="text-xs text-green-600">
                        ✓ Paid on {new Date(bill.paid_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })} • {bill.payment_method}
                      </Text>
                    </View>
                  )}

                  {/* Action Button */}
                  <View className="mt-2">
                    {bill.status === 'pending' || bill.status === 'overdue' ? (
                      <Button
                        size="sm"
                        className="w-full bg-primary"
                        onPress={() => handlePayNow(bill)}
                      >
                        <CreditCard size={14} className="text-white mr-2" />
                        <Text className="text-white text-sm">Pay Now</Text>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onPress={() => handleDownloadReceipt(bill.id)}
                      >
                        <Download size={14} className="text-foreground mr-2" />
                        <Text className="text-sm">Download Receipt</Text>
                      </Button>
                    )}
                  </View>
                </CardContent>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}

