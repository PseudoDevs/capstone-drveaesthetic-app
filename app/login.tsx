import * as React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { AuthService, AuthStorage } from '~/lib/api';
import { GoogleWebViewLogin } from '~/components/GoogleWebViewLogin';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [showGoogleWebView, setShowGoogleWebView] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await AuthService.login({
        email: email,
        password: password,
      });

      console.log('=== LOGIN RESPONSE ===');
      console.log('Full response:', JSON.stringify(response, null, 2));
      console.log('Token:', response.token);
      console.log('User:', JSON.stringify(response.user, null, 2));
      console.log('======================');
      
      // Save token and user to storage
      await AuthStorage.saveToken(response.token);
      await AuthStorage.saveUser(response.user);
      
      // Set token in API client for immediate use
      AuthService.setToken(response.token);
      console.log('Token set in API client after login');
      
      // Small delay to ensure storage operations complete
      setTimeout(() => {
        router.replace('/home');
      }, 100);
    } catch (error: any) {
      console.log('=== LOGIN ERROR ===');
      console.error('Full error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.log('===================');
      
      if (error.response?.data?.errors) {
        const newErrors: { email?: string; password?: string; general?: string } = {};
        const errorData = error.response.data.errors;
        
        if (errorData.email) {
          newErrors.email = Array.isArray(errorData.email) 
            ? errorData.email[0] 
            : errorData.email;
        }
        
        if (errorData.password) {
          newErrors.password = Array.isArray(errorData.password) 
            ? errorData.password[0] 
            : errorData.password;
        }
        
        const otherErrors = Object.keys(errorData).filter(key => 
          !['email', 'password'].includes(key)
        );
        if (otherErrors.length > 0) {
          const errorMessages = otherErrors.map(key => 
            Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key]
          );
          newErrors.general = errorMessages.join(', ');
        }
        
        setErrors(newErrors);
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Invalid credentials';
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrors({});
    setShowGoogleWebView(true);
  };

  const handleGoogleSuccess = async (tokens: { access_token: string; id_token?: string }) => {
    setIsGoogleLoading(true);
    try {
      console.log('=== WEBVIEW GOOGLE SUCCESS ===');
      console.log('Access Token Length:', tokens.access_token?.length || 0);
      console.log('ID Token Present:', !!tokens.id_token);
      console.log('==============================');
      
      // Use ID token if available, otherwise use access token
      const tokenToSend = tokens.id_token || tokens.access_token;
      
      // Call your API with the Google tokens
      const response = await AuthService.loginWithGoogleToken(
        tokenToSend,
        tokens.id_token
      );
      
      console.log('=== API RESPONSE SUCCESS ===');
      console.log('User:', JSON.stringify(response.user, null, 2));
      console.log('Token:', response.token);
      console.log('============================');
      
      // Save token and user to storage
      await AuthStorage.saveToken(response.token);
      await AuthStorage.saveUser(response.user);
      
      // Set token in API client for immediate use
      AuthService.setToken(response.token);
      console.log('Token set in API client after Google login');
      
      // Small delay to ensure storage operations complete
      setTimeout(() => {
        router.replace('/home');
      }, 100);
    } catch (error: any) {
      console.log('=== GOOGLE LOGIN ERROR ===');
      console.error('Full error:', error);
      console.log('==========================');
      
      setErrors({ 
        general: error.message || 'Google Sign-In failed. Please try again.' 
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = (error: string) => {
    console.log('=== GOOGLE WEBVIEW ERROR ===');
    console.error('Error:', error);
    console.log('============================');
    
    setErrors({ 
      general: error 
    });
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
            <Text className="text-4xl font-bold text-foreground mb-2">Welcome Back</Text>
            <Text className="text-muted-foreground text-center text-base">
              Sign in to continue to your account
            </Text>
          </View>

          {/* Login Card */}
          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
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

              {/* Email Input */}
              <View className="space-y-2">
                <Label nativeID="email">Email</Label>
                <Input
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: undefined }));
                    }
                  }}
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
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  secureTextEntry
                  textContentType="password"
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <Text className="text-destructive text-sm">
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Forgot Password Link */}
              <View className="items-end">
                <Link href="/forgot-password" asChild>
                  <Text className="text-primary text-sm font-medium">
                    Forgot password?
                  </Text>
                </Link>
              </View>

              {/* Sign In Button */}
              <Button
                onPress={handleLogin}
                disabled={isLoading || isGoogleLoading}
                className="w-full"
              >
                <Text>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Text>
              </Button>


              {/* Divider */}
              <View className="flex-row items-center py-4">
                <View className="flex-1 h-px bg-border" />
                <Text className="mx-4 text-muted-foreground text-sm">or</Text>
                <View className="flex-1 h-px bg-border" />
              </View>

              {/* Google Sign In Button */}
              <Button
                onPress={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                variant="outline"
                className="w-full"
              >
                <Text>
                  {isGoogleLoading ? 'Signing in with Google...' : 'Continue with Google'}
                </Text>
              </Button>

              {/* Sign Up Link */}
              <View className="pt-4">
                <Text className="text-center text-muted-foreground">
                  Don't have an account?{' '}
                  <Link href="/signup" asChild>
                    <Text className="text-primary font-medium">Create account</Text>
                  </Link>
                </Text>
              </View>
            </CardContent>
          </Card>

          {/* Footer */}
          <View className="mt-8">
            <Text className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <Text className="text-primary">Terms of Service</Text>
              {' '}and{' '}
              <Text className="text-primary">Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Google WebView Login Modal */}
      <GoogleWebViewLogin
        visible={showGoogleWebView}
        onClose={() => {
          setShowGoogleWebView(false);
          setIsGoogleLoading(false);
        }}
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
      />
    </KeyboardAvoidingView>
  );
}