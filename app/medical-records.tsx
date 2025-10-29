import * as React from 'react';
import { View, ScrollView, ActivityIndicator, RefreshControl, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { BottomNavigation } from '~/components/BottomNavigation';
import { ChevronLeft } from '~/lib/icons/ChevronLeft';
import { router } from 'expo-router';
import { useAuth } from '~/lib/context/AuthContext';
import { MedicalCertificateService, PrescriptionService } from '~/lib/api';

interface Prescription {
  id: number;
  appointment_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  doctor_notes: string;
  prescribed_by: string;
  prescribed_date: string;
  created_at: string;
}

interface MedicalCertificate {
  id: number;
  appointment_id: number;
  certificate_type: string;
  description: string;
  valid_from: string;
  valid_until: string;
  issued_by: string;
  issued_date: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
}

export default function MedicalRecordsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = React.useState<Prescription[]>([]);
  const [certificates, setCertificates] = React.useState<MedicalCertificate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'prescriptions' | 'certificates'>('prescriptions');

  const loadMedicalRecords = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Load medical certificates and prescriptions from real API
      const [certificatesResponse, prescriptionsResponse] = await Promise.all([
        MedicalCertificateService.getCertificates(),
        PrescriptionService.getPrescriptions()
      ]);
      
      setCertificates(certificatesResponse || [] as any);
      setPrescriptions(prescriptionsResponse || []);
    } catch (err) {
      setError('Failed to load medical records');
      console.error('Error loading medical records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadMedicalRecords();
    setIsRefreshing(false);
  };

  React.useEffect(() => {
    loadMedicalRecords();
  }, [user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isCertificateExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-muted-foreground">Loading medical records...</Text>
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
          <Text className="ml-2 text-lg font-semibold text-foreground">Medical Records</Text>
        </Pressable>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row px-6 py-4 border-b border-border">
        <Pressable
          onPress={() => setActiveTab('prescriptions')}
          className={`flex-1 py-2 px-4 rounded-lg mr-2 ${
            activeTab === 'prescriptions' ? 'bg-blue-100' : 'bg-gray-100'
          }`}
        >
          <Text className={`text-center font-medium ${
            activeTab === 'prescriptions' ? 'text-blue-800' : 'text-gray-600'
          }`}>
            Prescriptions
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('certificates')}
          className={`flex-1 py-2 px-4 rounded-lg ml-2 ${
            activeTab === 'certificates' ? 'bg-blue-100' : 'bg-gray-100'
          }`}
        >
          <Text className={`text-center font-medium ${
            activeTab === 'certificates' ? 'text-blue-800' : 'text-gray-600'
          }`}>
            Certificates
          </Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {error && (
          <View className="px-6 pt-4">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="py-4">
                <Text className="text-red-800">{error}</Text>
                <Button 
                  variant="outline" 
                  className="mt-2 border-red-300"
                  onPress={loadMedicalRecords}
                >
                  <Text className="text-red-700">Try Again</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        )}

        {activeTab === 'prescriptions' ? (
          <View className="px-6 pt-4 pb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Prescriptions ({prescriptions.length})
            </Text>
            
            {prescriptions.length === 0 ? (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="py-8">
                  <Text className="text-center text-gray-600">No prescriptions found</Text>
                </CardContent>
              </Card>
            ) : (
              prescriptions.map((prescription) => (
                <Card key={prescription.id} className="mb-4">
                  <CardContent className="py-4">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">
                          {prescription.medication_name}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          Prescribed by {prescription.prescribed_by}
                        </Text>
                      </View>
                      <Text className="text-sm text-muted-foreground">
                        {formatDate(prescription.prescribed_date)}
                      </Text>
                    </View>
                    
                    <View className="space-y-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Dosage</Text>
                        <Text className="text-sm font-medium text-foreground">{prescription.dosage}</Text>
                      </View>
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Frequency</Text>
                        <Text className="text-sm font-medium text-foreground">{prescription.frequency}</Text>
                      </View>
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Duration</Text>
                        <Text className="text-sm font-medium text-foreground">{prescription.duration}</Text>
                      </View>
                      
                      {prescription.doctor_notes && (
                        <View className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <Text className="text-sm font-medium text-blue-900 mb-1">Doctor's Notes</Text>
                          <Text className="text-sm text-blue-800">{prescription.doctor_notes}</Text>
                        </View>
                      )}
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        ) : (
          <View className="px-6 pt-4 pb-6">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Medical Certificates ({certificates.length})
            </Text>
            
            {certificates.length === 0 ? (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="py-8">
                  <Text className="text-center text-gray-600">No certificates found</Text>
                </CardContent>
              </Card>
            ) : (
              certificates.map((certificate) => (
                <Card key={certificate.id} className="mb-4">
                  <CardContent className="py-4">
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">
                          {certificate.certificate_type}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                          Issued by {certificate.issued_by}
                        </Text>
                      </View>
                      <Badge className={getStatusColor(certificate.status)}>
                        {certificate.status.charAt(0).toUpperCase() + certificate.status.slice(1)}
                      </Badge>
                    </View>
                    
                    <Text className="text-sm text-foreground mb-3">{certificate.description}</Text>
                    
                    <View className="space-y-2">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Valid From</Text>
                        <Text className="text-sm font-medium text-foreground">
                          {formatDate(certificate.valid_from)}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Valid Until</Text>
                        <Text className={`text-sm font-medium ${
                          isCertificateExpired(certificate.valid_until) ? 'text-red-600' : 'text-foreground'
                        }`}>
                          {formatDate(certificate.valid_until)}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-muted-foreground">Issued Date</Text>
                        <Text className="text-sm font-medium text-foreground">
                          {formatDate(certificate.issued_date)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row mt-4">
                      <Button 
                        variant="outline" 
                        className="flex-1 mr-2"
                        onPress={() => {
                          // TODO: Implement certificate download
                          console.log('Download certificate:', certificate.id);
                        }}
                      >
                        <Text>Download</Text>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 ml-2"
                        onPress={() => {
                          // TODO: Implement certificate sharing
                          console.log('Share certificate:', certificate.id);
                        }}
                      >
                        <Text>Share</Text>
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <BottomNavigation />
    </View>
  );
}
