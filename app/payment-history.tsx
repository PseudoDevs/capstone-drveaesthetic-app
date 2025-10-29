import * as React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Pressable, Alert, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { BottomNavigation } from '~/components/BottomNavigation';
import { ChevronLeft } from '~/lib/icons/ChevronLeft';
import { router } from 'expo-router';
import { BillingService, Payment, PaymentHistoryResponse, AuthStorage } from '~/lib/api';
import { useAuth } from '~/lib/context/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Download } from 'lucide-react-native';

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [paymentHistory, setPaymentHistory] = React.useState<PaymentHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadPayments = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load payment history from real API
      const response = await BillingService.getPaymentHistory(1);
      setPaymentHistory(response);
    } catch (err) {
      setError('Failed to load payment history');
      console.error('Error loading payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPayments();
    setIsRefreshing(false);
  };

  const handleDownloadPaymentReceipt = async (paymentId: number) => {
    try {
      // Show loading state
      Alert.alert('Downloading', 'Preparing payment receipt for download...', [], { cancelable: false });
      
      // Get the download URL from the API
      const token = await AuthStorage.getToken();
      const downloadUrl = `https://drveaestheticclinic.online/api/client/payments/${paymentId}/receipt`;
      
      // Create local file path
      const fileName = `payment-receipt-${paymentId}.pdf`;
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
            dialogTitle: 'Download Payment Receipt'
          });
        } else {
          // Fallback: Open the file
          await Linking.openURL(downloadResult.uri);
        }
        
        Alert.alert('Success', 'Payment receipt downloaded successfully!');
      } else {
        throw new Error('Download failed');
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed', 
        error?.message || 'Failed to download payment receipt. Please try again.'
      );
    }
  };

  React.useEffect(() => {
    loadPayments();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-muted-foreground">Loading payment history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <Pressable 
          onPress={() => router.back()}
          className="flex-row items-center"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
          <Text className="ml-2 text-lg font-semibold text-foreground">Payment History</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Summary Card */}
        <View className="px-4 pt-4 pb-3">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="py-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xl font-bold text-green-900">
                    ₱{paymentHistory?.payments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString() || '0'}
                  </Text>
                  <Text className="text-xs text-green-700">Total Payments</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-semibold text-green-800">
                    {paymentHistory?.payments.filter(p => p.status === 'completed').length || 0} Completed
                  </Text>
                  <Text className="text-xs text-green-600">
                    {paymentHistory?.payments.filter(p => p.status === 'pending').length || 0} Pending
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Payment List */}
        <View className="px-4 pb-24">
          <Text className="text-base font-semibold text-foreground mb-3">Recent Payments</Text>
          
          {error && (
            <Card className="bg-red-50 border-red-200 mb-4">
              <CardContent className="py-4">
                <Text className="text-red-800">{error}</Text>
                <Button 
                  variant="outline" 
                  className="mt-2 border-red-300"
                  onPress={loadPayments}
                >
                  <Text className="text-red-700">Try Again</Text>
                </Button>
              </CardContent>
            </Card>
          )}

          {!paymentHistory?.payments || paymentHistory.payments.length === 0 ? (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="py-8">
                <Text className="text-center text-gray-600">No payment history found</Text>
              </CardContent>
            </Card>
          ) : (
            paymentHistory.payments.map((payment) => (
              <Card key={payment.id} className="mb-3">
                <CardContent className="py-4">
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-primary">
                        ₱{payment.amount.toLocaleString()}
                      </Text>
                      <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                        {payment.bill?.description || 'Payment'}
                      </Text>
                    </View>
                    <Badge className={getStatusColor(payment.status)}>
                      <Text className="text-white text-xs">{getStatusText(payment.status)}</Text>
                    </Badge>
                  </View>
                  
                  {/* Payment Details */}
                  <View className="mb-3">
                    <Text className="text-xs text-gray-600">
                      💳 {payment.payment_method} • {formatDate(payment.payment_date)} at {formatTime(payment.created_at)}
                    </Text>
                    {payment.transaction_id && (
                      <Text className="text-xs text-gray-500 mt-1">
                        ID: {payment.transaction_id}
                      </Text>
                    )}
                  </View>

                  {/* Download Receipt Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onPress={() => handleDownloadPaymentReceipt(payment.id)}
                  >
                    <Download size={14} className="text-foreground mr-2" />
                    <Text className="text-sm">Download Receipt</Text>
                  </Button>
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
