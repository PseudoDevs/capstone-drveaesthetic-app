import React from 'react';
import { View, Text } from 'react-native';

interface NavigationErrorBoundaryProps {
  children: React.ReactNode;
}

interface NavigationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class NavigationErrorBoundary extends React.Component<
  NavigationErrorBoundaryProps,
  NavigationErrorBoundaryState
> {
  constructor(props: NavigationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): NavigationErrorBoundaryState {
    // Check if this is a navigation context error
    if (error.message.includes("Couldn't find a navigation context") ||
        error.message.includes("Navigation container not found") ||
        error.message.includes("NavigationContainer")) {
      // Don't show error UI for navigation context errors, just log and continue
      return { hasError: false };
    }

    // For other errors, show error UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error.message.includes("Couldn't find a navigation context") ||
        error.message.includes("Navigation container not found") ||
        error.message.includes("NavigationContainer")) {

      // Reset error state after a short delay to continue normal operation
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 100);

      return;
    }

  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ textAlign: 'center', color: '#666' }}>
            {this.state.error.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}