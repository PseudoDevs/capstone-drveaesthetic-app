import * as React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Text } from '~/components/ui/text';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { AuthService, AuthStorage } from '~/lib/api';
import { useAuth } from '~/lib/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const { login } = useAuth();

  // Load saved credentials on component mount
  React.useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AuthStorage.getRememberedEmail();
        const shouldRemember = await AuthStorage.getRememberMe();
        
        if (savedEmail && shouldRemember) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
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
      await login(response.token, response.user);
      if (rememberMe) {
        await AuthStorage.saveRememberedEmail(email);
        await AuthStorage.saveRememberMe(true);
      } else {
        await AuthStorage.clearRememberedCredentials();
      }
      router.replace('/home');
    } catch (error: any) {
      if (error.response?.data?.errors) {
        const newErrors: { email?: string; password?: string; general?: string } = {};
        const errorData = error.response.data.errors;
        if (errorData.email) {
          newErrors.email = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        }
        if (errorData.password) {
          newErrors.password = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        }
        const otherErrors = Object.keys(errorData).filter(key => !['email', 'password'].includes(key));
        if (otherErrors.length > 0) {
          const errorMessages = otherErrors.map(key => Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key]);
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
          <View className="mb-8 items-center">
            <Text className="text-4xl font-bold text-foreground mb-2">Welcome Back</Text>
            <Text className="text-muted-foreground text-center text-base">
              Sign in to continue to your account
            </Text>
          </View>

          <Card className="w-full max-w-md mx-auto">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.general && (
                <View className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <Text className="text-destructive text-sm font-medium">
                    {errors.general}
                  </Text>
                </View>
              )}

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

              <View className="flex-row items-center space-x-2">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <Text className="text-sm text-muted-foreground">
                  Remember me
                </Text>
              </View>

              <Button
                onPress={handleLogin}
                disabled={isLoading}
                className="w-full"
              >
                <Text>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Text>
              </Button>

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
    </KeyboardAvoidingView>
  );
}