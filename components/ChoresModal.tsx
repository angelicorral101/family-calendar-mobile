import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { apiService, CalendarEvent } from '../services/api';
import { useAuth } from './AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useChoresVoiceAssistant } from './useChoresVoiceAssistant';

interface Chore {
  id: string;
  description: string;
  assigned_to: string | null;
  completed: boolean;
  date: string;
}

const getToday = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const ChoresModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { token, user } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newChore, setNewChore] = useState('');
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const {
    isListening: isVoiceListening,
    isProcessing: isVoiceProcessing,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
  } = useChoresVoiceAssistant((result) => {
    // Show feedback and refresh chores on successful action
    if (result && result.success) {
      setFeedback(result.message || 'Voice command processed!');
      fetchChores();
    } else if (result && result.message) {
      setFeedback(result.message);
    }
    setTimeout(() => setFeedback(null), 3000);
  });

  const fetchChores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getChores(getToday(), token!);
      setChores(res);
    } catch {
      setError('Failed to load chores.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible && token) fetchChores();
  }, [visible, token]);

  const handlePickUp = async (chore: Chore) => {
    if (!token || !user) return;
    try {
      await apiService.assignChore(chore.id, user, token);
      fetchChores();
    } catch {}
  };

  const handleComplete = async (chore: Chore) => {
    if (!token) return;
    try {
      await apiService.completeChore(chore.id, token);
      fetchChores();
    } catch {}
  };

  const handleDelete = async (chore: Chore) => {
    if (!token) return;
    try {
      await apiService.deleteChore(chore.id, token);
      fetchChores();
    } catch {}
  };

  const handleCreateChore = async () => {
    if (!token || !newChore.trim()) return;
    setCreating(true);
    try {
      await apiService.createChore(newChore.trim(), getToday(), token);
      setNewChore('');
      fetchChores();
    } catch {}
    setCreating(false);
  };

  const renderChore = ({ item }: { item: Chore }) => (
    <View style={[styles.choreItem, item.completed && styles.completedChoreItem]}>
      <View style={styles.choreHeader}>
        <Text style={[styles.choreDesc, item.completed && styles.completedChoreDesc]}>{item.description}</Text>
        {!item.completed && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
            <MaterialCommunityIcons name="delete" size={16} color="#FF0000" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.choreMeta, item.completed && styles.completedChoreMeta]}>
        {item.completed ? '✅ Done!' : item.assigned_to ? `Assigned to: ${item.assigned_to}` : 'Unassigned'}
      </Text>
      <View style={styles.choreActions}>
        {!item.completed && !item.assigned_to && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handlePickUp(item)}>
            <Text style={styles.actionButtonText}>Pick Up</Text>
          </TouchableOpacity>
        )}
        {!item.completed && item.assigned_to === user && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleComplete(item)}>
            <Text style={styles.actionButtonText}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.header}>Chores for Today</Text>
          <View style={styles.voiceRow}>
            <TouchableOpacity
              style={[styles.voiceButton, isVoiceListening && styles.voiceButtonActive]}
              onPress={isVoiceListening ? stopVoiceListening : startVoiceListening}
              disabled={isVoiceProcessing}
            >
              <MaterialCommunityIcons name="microphone" size={28} color="#fff" />
            </TouchableOpacity>
            {isVoiceListening && <Text style={styles.listeningText}>Listening…</Text>}
            {isVoiceProcessing && <ActivityIndicator size="small" color="#007AFF" style={{ marginLeft: 8 }} />}
          </View>
          {feedback && <Text style={styles.feedback}>{feedback}</Text>}
          <View style={styles.createRow}>
            <TextInput
              style={styles.input}
              placeholder="New chore description"
              value={newChore}
              onChangeText={setNewChore}
              editable={!creating}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleCreateChore} disabled={creating || !newChore.trim()}>
              <Text style={styles.addButtonText}>{creating ? '...' : 'Add'}</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 32 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <FlatList
              data={chores}
              keyExtractor={item => item.id}
              renderItem={renderChore}
              refreshing={refreshing}
              onRefresh={fetchChores}
              ListEmptyComponent={<Text style={styles.noChores}>No chores for today.</Text>}
              style={{ width: '100%' }}
            />
          )}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  voiceButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  voiceButtonActive: {
    backgroundColor: '#4CAF50',
  },
  listeningText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  feedback: {
    color: '#007AFF',
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 16,
  },
  noChores: {
    color: '#666',
    fontSize: 16,
    marginTop: 32,
    textAlign: 'center',
  },
  choreItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  choreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  choreDesc: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  choreMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  choreActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#FF0000',
    marginLeft: 8,
  },
  completedChoreItem: {
    backgroundColor: '#e8f5e9', // A light green background for completed chores
  },
  completedChoreDesc: {
    color: '#666',
  },
  completedChoreMeta: {
    color: '#4CAF50', // A green color for the meta text of completed chores
  },
});

export default ChoresModal; 