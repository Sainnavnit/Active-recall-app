import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../src/supabaseClient';

interface Concept {
  id: string;
  name: string;
  learned_at: string;
  next_revision_at: string;
}

const HomeScreen = () => {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [newConceptName, setNewConceptName] = useState('');
  const [newConceptDate, setNewConceptDate] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    const { data, error } = await supabase
      .from('concepts')
      .select('*')
      .order('next_revision_at', { ascending: true });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setConcepts(data || []);
    }
  };

  const addConcept = async () => {
    const { data, error } = await supabase.from('concepts').insert([
      {
        name: newConceptName,
        learned_at: newConceptDate,
        next_revision_at: newConceptDate,
        user_id: supabase.auth.user()?.id,
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewConceptName('');
      setNewConceptDate('');
      fetchConcepts();
    }
  };

  const reviseConcept = async (concept: Concept) => {
    // Basic implementation of SM-2 algorithm
    const q = 5; // Assume perfect recall for simplicity
    let ef = concept.easiness_factor;
    let interval = concept.revision_interval;

    ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (ef < 1.3) ef = 1.3;

    if (interval === 1) {
      interval = 1;
    } else if (interval === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }

    const nextRevisionAt = new Date();
    nextRevisionAt.setDate(nextRevisionAt.getDate() + interval);

    const { data, error } = await supabase
      .from('concepts')
      .update({
        revision_interval: interval,
        easiness_factor: ef,
        next_revision_at: nextRevisionAt.toISOString(),
      })
      .eq('id', concept.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchConcepts();
    }
  };

  const renderItem = ({ item }: { item: Concept }) => (
    <TouchableOpacity
      style={styles.conceptItem}
      onPress={() => reviseConcept(item)}
    >
      <View>
        <Text style={styles.conceptName}>{item.name}</Text>
        <Text style={styles.conceptDate}>
          Next Revision: {new Date(item.next_revision_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Spaced Repetition</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Concept Name"
          value={newConceptName}
          onChangeText={setNewConceptName}
        />
        <TextInput
          style={styles.input}
          placeholder="Learned Date (YYYY-MM-DD)"
          value={newConceptDate}
          onChangeText={setNewConceptDate}
        />
        <Button title="Add Concept" onPress={addConcept} />
      </View>

      <FlatList
        data={concepts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  conceptItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conceptName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  conceptDate: {
    fontSize: 14,
    color: 'gray',
  },
});

export default HomeScreen;
