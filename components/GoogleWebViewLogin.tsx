import React, { useState, useRef } from 'react';
import { Modal, View, Pressable, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { X } from '~/lib/icons/X';

interface GoogleWebViewLoginProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (tokens: { access_token: string; id_token?: string }) => void;
  onError: (error: string) => void;
}

export const GoogleWebViewLogin: React.FC<GoogleWebViewLoginProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const CLIENT_ID = '388201848924-0r1e9u2f98enud08ahqhkvmabq7pbudb.apps.googleusercontent.com';
  const REDIRECT_URI = 'https://drveaestheticclinic.online/auth/google';
  const SCOPES = 'openid profile email';

  const googleAuthUrl = `https://accounts.google.com/oauth/authorize?${new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'select_account',
  }).toString()}`;

  const handleNavigationStateChange = async (navState: any) => {
    console.log('=== WEBVIEW NAVIGATION ===');
    console.log('URL:', navState.url);
    console.log('Loading:', navState.loading);
    console.log('==========================');

    // Check if we've reached the callback URL
    if (navState.url.startsWith(REDIRECT_URI)) {
      try {
        const url = new URL(navState.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          console.error('OAuth Error:', error);
          onError(`Google authentication failed: ${error}`);
          onClose();
          return;
        }

        if (code) {
          console.log('=== AUTHORIZATION CODE RECEIVED ===');
          console.log('Code length:', code.length);
          console.log('===================================');

          // Exchange the authorization code for tokens
          await exchangeCodeForTokens(code);
        } else {
          onError('No authorization code received from Google');
          onClose();
        }
      } catch (err: any) {
        console.error('Error processing callback:', err);
        onError(`Error processing Google response: ${err.message}`);
        onClose();
      }
    }
  };

  const exchangeCodeForTokens = async (code: string) => {
    try {
      console.log('=== EXCHANGING CODE FOR TOKENS ===');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      const tokens = await tokenResponse.json();

      console.log('=== TOKEN EXCHANGE RESPONSE ===');
      console.log('Status:', tokenResponse.status);
      console.log('OK:', tokenResponse.ok);
      console.log('Access Token:', tokens.access_token ? 'Present' : 'Missing');
      console.log('ID Token:', tokens.id_token ? 'Present' : 'Missing');
      console.log('Error:', tokens.error || 'None');
      console.log('==============================');

      if (!tokenResponse.ok || tokens.error) {
        throw new Error(`Token exchange failed: ${tokens.error || 'Unknown error'} - ${tokens.error_description || ''}`);
      }

      if (tokens.access_token) {
        onSuccess({
          access_token: tokens.access_token,
          id_token: tokens.id_token,
        });
        onClose();
      } else {
        throw new Error('No access token received from Google');
      }
    } catch (error: any) {
      console.error('Token exchange error:', error);
      onError(`Failed to get Google tokens: ${error.message}`);
      onClose();
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    onError(`WebView error: ${nativeEvent.description || 'Unknown error'}`);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-card">
          <Text className="text-lg font-semibold">Sign in with Google</Text>
          <Pressable onPress={onClose} className="p-2">
            <X className="h-6 w-6 text-foreground" />
          </Pressable>
        </View>

        {/* Loading indicator */}
        {loading && (
          <View className="absolute top-20 left-0 right-0 z-10 bg-card/90 p-4">
            <Text className="text-center text-muted-foreground">Loading Google Sign-In...</Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: googleAuthUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={handleError}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />

        {/* Cancel button */}
        <View className="p-4 border-t border-border bg-card">
          <Button onPress={onClose} variant="outline" className="w-full">
            <Text>Cancel</Text>
          </Button>
        </View>
      </View>
    </Modal>
  );
};