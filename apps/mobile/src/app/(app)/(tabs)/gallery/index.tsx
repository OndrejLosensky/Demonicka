import {
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../../store/auth.store';
import { useActiveEvent } from '../../../../hooks/useActiveEvent';
import { useRole } from '../../../../hooks/useRole';
import {
  listMyPhotos,
  listPhotosByEvent,
  getPhotoImageUrl,
  uploadPhoto,
  type GalleryPhoto,
  type GalleryPhotoWithEvent,
} from '../../../../services/galleryApi';
import { api } from '../../../../services/api';
import { Icon } from '../../../../components/icons';
import { useThemeColors } from '../../../../hooks/useThemeColors';
import { formatDate } from '../../../../utils/format';
import { logBackgroundError } from '../../../../utils/errorHandler';

const COLS = 3;
const GAP = 4;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - 32 - (COLS - 1) * GAP) / COLS;

type EventOption = { id: string; name: string };

export default function GalleryScreen() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = params.eventId;
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { activeEvent } = useActiveEvent();
  const { isOperator } = useRole();
  const colors = useThemeColors();

  const [photos, setPhotos] = useState<(GalleryPhotoWithEvent | GalleryPhoto)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<(GalleryPhotoWithEvent | GalleryPhoto) | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!token) return;
    try {
      if (eventId) {
        const list = await listPhotosByEvent(eventId, token);
        setPhotos(list);
      } else {
        const list = await listMyPhotos(token);
        setPhotos(list);
      }
    } catch (e) {
      logBackgroundError(e, 'GalleryFetch');
    }
  }, [token, eventId]);

  useEffect(() => {
    setLoading(true);
    fetchPhotos().finally(() => setLoading(false));
  }, [fetchPhotos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPhotos();
    setRefreshing(false);
  }, [fetchPhotos]);

  const getUploadEventId = useCallback((): string | null => {
    if (eventId) return eventId;
    if (activeEvent?.id) return activeEvent.id;
    return null;
  }, [eventId, activeEvent?.id]);

  const fetchEventsForPicker = useCallback(async () => {
    if (!token || !user) return [];
    try {
      if (isOperator) {
        const list = await api.get<EventOption[]>('/events', token);
        return Array.isArray(list) ? list : [];
      }
      const res = await api.get<{ events: Array<{ eventId: string; eventName: string }> }>(
        `/dashboard/user/events?username=${encodeURIComponent(user.username)}`,
        token
      );
      return (res.events ?? []).map((e) => ({ id: e.eventId, name: e.eventName }));
    } catch {
      return [];
    }
  }, [token, user, isOperator]);

  const doPickAndUpload = useCallback(
    async (source: 'camera' | 'library', targetEventId: string) => {
      if (!token) return;
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Oprávnění',
          source === 'camera'
            ? 'Pro pořízení fotky je potřeba povolit přístup k fotoaparátu.'
            : 'Pro výběr fotky je potřeba povolit přístup k fotkám.'
        );
        return;
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.9,
            });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setUploading(true);
      try {
        await uploadPhoto(targetEventId, result.assets[0].uri, token);
        await fetchPhotos();
      } catch (e) {
        logBackgroundError(e, 'GalleryUpload');
        const msg = e instanceof Error ? e.message : 'Nahrání se nezdařilo';
        Alert.alert('Chyba', msg);
      } finally {
        setUploading(false);
      }
    },
    [token, fetchPhotos]
  );

  const showUploadActions = useCallback(() => {
    const uploadEventId = getUploadEventId();
    const runPicker = (option: 'camera' | 'library') => {
      if (uploadEventId) {
        doPickAndUpload(option, uploadEventId);
        return;
      }
      fetchEventsForPicker().then((list) => {
        if (list.length === 0) {
          Alert.alert('Chyba', 'Nemáte žádnou událost pro nahrání.');
          return;
        }
        if (list.length === 1) {
          doPickAndUpload(option, list[0].id);
          return;
        }
        Alert.alert(
          'Vyberte událost',
          'Pro nahrání zvolte událost.',
          list.map((e) => ({
            text: e.name,
            onPress: () => doPickAndUpload(option, e.id),
          })).concat([{ text: 'Zrušit', style: 'cancel' as const }])
        );
      });
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Zrušit', 'Vyfotit', 'Vybrat z galerie'],
          cancelButtonIndex: 0,
        },
        (i) => {
          if (i === 1) runPicker('camera');
          if (i === 2) runPicker('library');
        }
      );
    } else {
      Alert.alert('Nahrát foto', undefined, [
        { text: 'Zrušit', style: 'cancel' },
        { text: 'Vyfotit', onPress: () => runPicker('camera') },
        { text: 'Vybrat z galerie', onPress: () => runPicker('library') },
      ]);
    }
  }, [getUploadEventId, fetchEventsForPicker, doPickAndUpload]);

  const renderItem = useCallback(
    ({ item }: { item: GalleryPhotoWithEvent | GalleryPhoto }) => (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.9}
        onPress={() => setSelectedPhoto(item)}
      >
        <Image
          source={{ uri: getPhotoImageUrl(item.id) }}
          style={styles.gridImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    ),
    []
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Galerie</Text>
          {eventId == null && photos.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Všechny události
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: colors.primary }]}
          onPress={showUploadActions}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Nahrát</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={COLS}
          contentContainerStyle={styles.gridList}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Icon name="image" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Zatím žádné fotky.
              </Text>
              <TouchableOpacity
                style={[styles.uploadButtonEmpty, { borderColor: colors.border }]}
                onPress={showUploadActions}
                disabled={uploading}
              >
                <Text style={[styles.uploadButtonEmptyText, { color: colors.text }]}>Nahrát první foto</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          <View style={styles.modalContent}>
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: getPhotoImageUrl(selectedPhoto.id) }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <View style={[styles.modalDetail, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                  {'eventName' in selectedPhoto && (
                    <Text style={styles.modalEventName}>{selectedPhoto.eventName}</Text>
                  )}
                  {selectedPhoto.caption ? (
                    <Text style={styles.modalCaption}>{selectedPhoto.caption}</Text>
                  ) : null}
                  <Text style={styles.modalMeta}>
                    {selectedPhoto.user.name ?? selectedPhoto.user.username} ·{' '}
                    {formatDate(selectedPhoto.createdAt)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 2 },
  uploadButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  uploadButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gridList: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  row: { marginBottom: GAP, gap: GAP },
  gridItem: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  gridImage: { width: '100%', height: '100%', borderRadius: 6 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, marginTop: 12 },
  uploadButtonEmpty: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  uploadButtonEmptyText: { fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { width: '100%', height: '100%', justifyContent: 'center', padding: 16 },
  modalImage: { width: '100%', height: '70%' },
  modalDetail: { marginTop: 16, padding: 12, borderRadius: 8 },
  modalEventName: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  modalCaption: { color: '#fff', fontSize: 15, marginBottom: 4 },
  modalMeta: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
});
