import * as React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { AuthService, AuthStorage } from '~/lib/api';

export default function SignupScreen() {
  const [formData, setFormData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreedToTerms, setAgreedToTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (field === 'confirmPassword' || field === 'password') {
      setErrors(prev => ({ ...prev, password: undefined, confirmPassword: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    if (!agreedToTerms) {
      setErrors({ general: 'Please agree to the Terms of Service and Privacy Policy' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      
      const response = await AuthService.register({
        name: fullName,
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });

      console.log('=== REGISTRATION RESPONSE ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Token:', response.token);
      console.log('User:', JSON.stringify(response.user, null, 2));
      console.log('Message:', response.message);
      console.log('=============================');
      
      // If registration returns a token, save it and go to home
      if (response.token) {
        // Save token and user to storage
        await AuthStorage.saveToken(response.token);
        await AuthStorage.saveUser(response.user);
        
        // Set token in API client for immediate use
        AuthService.setToken(response.token);
        console.log('Token set in API client after registration');
        
        router.replace('/home');
      } else {
        // Otherwise go to login screen
        router.replace('/login');
      }
    } catch (error: any) {
      console.log('=== REGISTRATION ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.log('==========================');
      
      if (error.response?.data?.errors) {
        const newErrors: typeof errors = {};
        const errorData = error.response.data.errors;
        
        if (errorData.name) {
          newErrors.firstName = Array.isArray(errorData.name) ? errorData.name[0] : errorData.name;
        }
        if (errorData.email) {
          newErrors.email = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        }
        if (errorData.password) {
          newErrors.password = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        }
        
        const otherErrors = Object.keys(errorData).filter(key => 
          !['name', 'email', 'password'].includes(key)
        );
        if (otherErrors.length > 0) {
          const errorMessages = otherErrors.map(key => 
            Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key]
          );
          newErrors.general = errorMessages.join(', ');
        }
        
        setErrors(newErrors);
      } else if (error.response?.status === 500) {
        // Handle 500 server errors
        const serverMessage = error.response?.data?.message || 'Server error occurred during registration.';
        setErrors({ general: `Registration failed: ${serverMessage}` });
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-secondary/30"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center p-6 min-h-screen">
          {/* Header */}
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-foreground mb-2">Create Account</Text>
            <Text className="text-muted-foreground text-center text-base">
              Sign up to get started with your new account
            </Text>
          </View>

          {/* Signup Card */}
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
              <CardDescription className="text-center">
                Create your account by filling out the form below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <View className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <Text className="text-destructive text-sm font-medium">
                    {errors.general}
                  </Text>
                </View>
              )}

              {/* Name Fields */}
              <View className="flex-row space-x-2">
                <View className="flex-1 space-y-2">
                  <Label nativeID="firstName">First Name</Label>
                  <Input
                    placeholder="First name"
                    value={formData.firstName}
                    onChangeText={(value) => updateFormData('firstName', value)}
                    autoCapitalize="words"
                    textContentType="givenName"
                    className={errors.firstName ? "border-destructive" : ""}
                  />
                  {errors.firstName && (
                    <Text className="text-destructive text-sm">
                      {errors.firstName}
                    </Text>
                  )}
                </View>
                <View className="flex-1 space-y-2">
                  <Label nativeID="lastName">Last Name</Label>
                  <Input
                    placeholder="Last name"
                    value={formData.lastName}
                    onChangeText={(value) => updateFormData('lastName', value)}
                    autoCapitalize="words"
                    textContentType="familyName"
                    className={errors.lastName ? "border-destructive" : ""}
                  />
                  {errors.lastName && (
                    <Text className="text-destructive text-sm">
                      {errors.lastName}
                    </Text>
                  )}
                </View>
              </View>

              {/* Email Input */}
              <View className="space-y-2">
                <Label nativeID="email">Email</Label>
                <Input
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <Text className="text-destructive text-sm">
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Password Input */}
              <View className="space-y-2">
                <Label nativeID="password">Password</Label>
                <Input
                  placeholder="Create a password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  secureTextEntry
                  textContentType="newPassword"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password ? (
                  <Text className="text-destructive text-sm">
                    {errors.password}
                  </Text>
                ) : (
                  <Text className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View className="space-y-2">
                <Label nativeID="confirmPassword">Confirm Password</Label>
                <Input
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  secureTextEntry
                  textContentType="newPassword"
                  className={errors.confirmPassword ? "border-destructive" : ""}
                />
                {errors.confirmPassword && (
                  <Text className="text-destructive text-sm">
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Terms and Conditions */}
              <View className="flex-row items-start space-x-3 pt-2">
                <Checkbox 
                  checked={agreedToTerms} 
                  onCheckedChange={setAgreedToTerms}
                  className="mt-0.5"
                />
                <Text className="flex-1 text-sm text-muted-foreground leading-5">
                  I agree to the{' '}
                  <Text className="text-primary font-medium">Terms of Service</Text>
                  {' '}and{' '}
                  <Text className="text-primary font-medium">Privacy Policy</Text>
                </Text>
              </View>

              {/* Sign Up Button */}
              <Button
                onPress={handleSignup}
                disabled={isLoading}
                className="w-full"
              >
                <Text>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Text>
              </Button>

              {/* Sign In Link */}
              <View className="pt-4">
                <Text className="text-center text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" asChild>
                    <Text className="text-primary font-medium">Sign in</Text>
                  </Link>
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}