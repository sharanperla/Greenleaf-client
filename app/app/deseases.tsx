import { useDisease } from '@/contexts/DiseaseContext';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type Disease = {
  id: string;
  name: string;
  scientific_name?: string;
  description?: string;
  symptoms?: string;
  prevention?: string;
  treatment?: string;
  updated_at?: string;
};

export default function Diseases() {
  const { diseases, loading, error, refreshDiseases } = useDisease();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text>Loading diseases...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text onPress={refreshDiseases} style={styles.retryText}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!diseases || diseases.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No diseases found.</Text>
      </View>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderItem = ({ item }: { item: Disease }) => {
    const isExpanded = item.id === expandedId;

    return (
      <TouchableOpacity
        style={styles.diseaseItem}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.headerRow}>
          <Text style={styles.diseaseName}>{item.name}</Text>
          {item.updated_at ? (
            <Text style={styles.updatedAt}>
              {new Date(item.updated_at).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
        {item.symptoms ? (
          <Text style={styles.symptomsPreview} numberOfLines={isExpanded ? 0 : 2}>
            <Text style={styles.bold}>Symptoms: </Text>
            {item.symptoms}
          </Text>
        ) : null}

        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.scientific_name && (
              <Text style={styles.scientificName}>
                <Text style={styles.bold}>Scientific Name: </Text>
                {item.scientific_name}
              </Text>
            )}
            {item.description && (
              <Text style={styles.section}>
                <Text style={styles.bold}>Description: </Text>
                {item.description}
              </Text>
            )}
            {item.prevention && (
              <Text style={styles.section}>
                <Text style={styles.bold}>Prevention: </Text>
                {item.prevention}
              </Text>
            )}
            {item.treatment && (
              <Text style={styles.section}>
                <Text style={styles.bold}>Treatment: </Text>
                {item.treatment}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={diseases}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={loading}
        onRefresh={refreshDiseases}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAF7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  errorText: { color: 'red', fontWeight: 'bold', marginBottom: 8 },
  retryText: { color: '#2E7D32', textDecorationLine: 'underline' },
  diseaseItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    flexShrink: 1,
  },
  updatedAt: {
    fontSize: 12,
    color: '#999',
  },
  symptomsPreview: {
    marginTop: 6,
    fontSize: 14,
    color: '#555',
  },
  bold: {
    fontWeight: '600',
    color: '#2E7D32',
  },
  expandedContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  scientificName: {
    fontStyle: 'italic',
    color: '#4A4A4A',
    marginBottom: 8,
  },
  section: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  separator: {
    height: 12,
  },
});
