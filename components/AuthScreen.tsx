import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from './AuthContext';

const AuthScreen: React.FC = () => {
  const { login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const success = isLogin
      ? await login(email, password)
      : await register(email, password);
    if (!success) {
      setError(isLogin ? 'Login failed. Check your credentials.' : 'Registration failed.');
    }
    setSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isLogin ? 'Login' : 'Register'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting || loading}>
        {submitting || loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.toggleText}>
          {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  toggleText: {
    color: '#007AFF',
    fontSize: 16,
    marginTop: 8,
  },
  error: {
    color: 'red',
    marginBottom: 12,
  },
});

export default AuthScreen; 