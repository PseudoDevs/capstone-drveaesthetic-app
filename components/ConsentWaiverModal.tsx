import * as React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent } from '~/components/ui/card';
import { Switch } from '~/components/ui/switch';
import { Separator } from '~/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Appointment } from '~/lib/api';

interface ConsentWaiverModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSubmit: (waiverData: ConsentWaiverData) => Promise<void>;
}

export interface ConsentWaiverData {
  appointment_id: number;
  date: string;
  
  // Consent checkboxes
  understands_procedure: boolean;
  acknowledges_risks: boolean;
  voluntary_consent: boolean;
  accurate_information: boolean;
  photo_consent: boolean;
  privacy_policy: boolean;
}

export function ConsentWaiverModal({
  visible,
  appointment,
  onClose,
  onSubmit,
}: ConsentWaiverModalProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Form State
  const [understandsProcedure, setUnderstandsProcedure] = React.useState(false);
  const [acknowledgesRisks, setAcknowledgesRisks] = React.useState(false);
  const [voluntaryConsent, setVoluntaryConsent] = React.useState(false);
  const [accurateInformation, setAccurateInformation] = React.useState(false);
  const [photoConsent, setPhotoConsent] = React.useState(false);
  const [privacyPolicy, setPrivacyPolicy] = React.useState(false);

  const resetForm = () => {
    setUnderstandsProcedure(false);
    setAcknowledgesRisks(false);
    setVoluntaryConsent(false);
    setAccurateInformation(false);
    setPhotoConsent(false);
    setPrivacyPolicy(false);
  };

  const validateForm = (): boolean => {
    if (!understandsProcedure || !acknowledgesRisks || !voluntaryConsent || !accurateInformation || !privacyPolicy) {
      Alert.alert('Required Consent', 'You must agree to all required terms to proceed');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!appointment) return;
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const waiverData: ConsentWaiverData = {
        appointment_id: appointment.id,
        date: new Date().toISOString().split('T')[0],
        understands_procedure: understandsProcedure,
        acknowledges_risks: acknowledgesRisks,
        voluntary_consent: voluntaryConsent,
        accurate_information: accurateInformation,
        photo_consent: photoConsent,
        privacy_policy: privacyPolicy,
      };

      await onSubmit(waiverData);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Consent waiver submission error:', error);
      Alert.alert('Error', error.message || 'Failed to submit consent waiver');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={visible} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Consent Waiver Form</DialogTitle>
        </DialogHeader>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-6 p-1">
            {/* Appointment Info */}
            {appointment && (
              <Card className="bg-primary/5">
                <CardContent className="py-3">
                  <Text className="text-sm text-muted-foreground mb-1">Consent for:</Text>
                  <Text className="font-semibold text-foreground">
                    {appointment.service?.service_name}
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                  </Text>
                </CardContent>
              </Card>
            )}

            {/* Waiver Text */}
            <Card>
              <CardContent className="py-4">
                <Text className="text-sm leading-6 text-muted-foreground">
                  By signing this consent form, I acknowledge and agree to the following terms and conditions for the aesthetic treatment I am about to undergo at Dr. Ve Aesthetic Clinic.
                </Text>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <Card>
              <CardContent className="space-y-4 py-4">
                <View>
                  <Text className="font-semibold text-sm mb-2">1. Nature of Procedure</Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    I understand the nature of the aesthetic procedure I am about to receive, including its purpose, expected outcomes, and the techniques that will be employed.
                  </Text>
                </View>

                <Separator />

                <View>
                  <Text className="font-semibold text-sm mb-2">2. Risks and Complications</Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    I acknowledge that I have been informed of potential risks, complications, and side effects associated with the procedure, including but not limited to: allergic reactions, infection, scarring, unsatisfactory results, and the need for additional treatments.
                  </Text>
                </View>

                <Separator />

                <View>
                  <Text className="font-semibold text-sm mb-2">3. Medical History</Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    I confirm that I have provided accurate and complete information regarding my medical history, current medications, allergies, and any pre-existing conditions.
                  </Text>
                </View>

                <Separator />

                <View>
                  <Text className="font-semibold text-sm mb-2">4. No Guarantees</Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    I understand that the practice of medicine is not an exact science and that no guarantees have been made regarding the results of the procedure.
                  </Text>
                </View>

                <Separator />

                <View>
                  <Text className="font-semibold text-sm mb-2">5. Photography and Documentation</Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    I understand that photographs may be taken before and after the procedure for medical records and quality assurance purposes.
                  </Text>
                </View>

                <Separator />

                <View>
                  <Text className="font-semibold text-sm mb-2">6. Privacy and Confidentiality</Text>
                  <Text className="text-sm text-muted-foreground leading-5">
                    I acknowledge that my personal and medical information will be kept confidential in accordance with applicable privacy laws and clinic policies.
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Consent Checkboxes */}
            <Card>
              <CardContent className="space-y-4 py-4">
                <View className="flex-row items-start">
                  <Switch 
                    checked={understandsProcedure} 
                    onCheckedChange={setUnderstandsProcedure}
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-sm">
                      I understand the procedure and have had the opportunity to ask questions. *
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Switch 
                    checked={acknowledgesRisks} 
                    onCheckedChange={setAcknowledgesRisks}
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-sm">
                      I acknowledge the risks and potential complications. *
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Switch 
                    checked={voluntaryConsent} 
                    onCheckedChange={setVoluntaryConsent}
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-sm">
                      I am giving this consent voluntarily without coercion. *
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Switch 
                    checked={accurateInformation} 
                    onCheckedChange={setAccurateInformation}
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-sm">
                      I have provided accurate and complete medical information. *
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Switch 
                    checked={photoConsent} 
                    onCheckedChange={setPhotoConsent}
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-sm">
                      I consent to before/after photographs for medical records.
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Switch 
                    checked={privacyPolicy} 
                    onCheckedChange={setPrivacyPolicy}
                    className="mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-sm">
                      I have read and agree to the clinic's privacy policy. *
                    </Text>
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Agreement Date */}
            <Card>
              <CardContent className="py-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">Agreement Date:</Text>
                  <Text className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </CardContent>
            </Card>

            {/* Required Notice */}
            <View className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <Text className="text-sm text-foreground font-medium">
                Important Notice
              </Text>
              <Text className="text-xs text-muted-foreground mt-2">
                By agreeing to all required terms above, you acknowledge that you have read, understood, and consent to the treatment procedures and policies outlined in this waiver.
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3 pb-4">
              <Button
                variant="outline"
                onPress={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                <Text>Cancel</Text>
              </Button>
              <Button
                onPress={handleSubmit}
                disabled={isLoading}
                className="flex-1 bg-primary"
              >
                <Text className="text-white">
                  {isLoading ? 'Submitting...' : 'I Agree & Submit'}
                </Text>
              </Button>
            </View>
          </View>
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}

