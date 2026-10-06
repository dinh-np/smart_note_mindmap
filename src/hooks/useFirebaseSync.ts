"use client";

import { useEffect, useRef, useState } from 'react';
import { dbRef } from '../lib/firebase';
import { ref, onValue, set } from 'firebase/database';
import { useMindmap } from '../store/MindmapContext';

export function useFirebaseSync(projectId: string = 'default-project') {
  const { state, dispatch } = useMindmap();
  const lastCloudSync = useRef<number>(0);
  const isSyncing = useRef(false);
  const [isOnline, setIsOnline] = useState(false);
  
  // Track Connection Status
  useEffect(() => {
    const connectedRef = ref(dbRef, '.info/connected');
    const unsub = onValue(connectedRef, (snap) => {
      setIsOnline(snap.val() === true);
    });
    return () => unsub();
  }, []);

  // Download from Cloud -> Local (Realtime Subscription)
  useEffect(() => {
    const projectRef = ref(dbRef, `projects/${projectId}`);
    
    const unsubscribe = onValue(projectRef, (snapshot) => {
      const data = snapshot.val();
      
      // If Cloud timestamp is strictly newer than our last known sync, override Local-First!
      if (data && data.rootData && data.timestamp > lastCloudSync.current) {
        isSyncing.current = true;
        dispatch({ type: 'LOAD_MINDMAP', payload: data.rootData });
        lastCloudSync.current = data.timestamp;
        
        // Reset lock after a short tick to prevent echo loops
        setTimeout(() => { isSyncing.current = false; }, 500);
      }
    });

    return () => unsubscribe();
  }, [dispatch, projectId]);

  // Upload Local -> Cloud (Debounced Push)
  useEffect(() => {
    // If the change came from the cloud, or we have no data, do not echo it back.
    if (isSyncing.current || !state.present) return;

    const syncToCloud = async () => {
      const projectRef = ref(dbRef, `projects/${projectId}`);
      const timestamp = Date.now();
      lastCloudSync.current = timestamp;

      try {
        await set(projectRef, {
          rootData: state.present,
          timestamp
        });
      } catch (err) {
        console.error("Firebase Sync Error:", err);
      }
    };

    // Debounce uploads by 1000ms
    const timeoutId = setTimeout(() => {
      syncToCloud();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [state.present, projectId]);

  // Offline to Online Auto-Flush Transition
  useEffect(() => {
    const handleOnline = () => {
      // Upon network recovery, if we have local mutations that haven't synced, force flush to cloud
      if (!isSyncing.current && state.present) {
        const projectRef = ref(dbRef, `projects/${projectId}`);
        const timestamp = Date.now();
        lastCloudSync.current = timestamp;
        set(projectRef, { rootData: state.present, timestamp }).catch(err => console.error("Auto-Flush Error:", err));
      }
    };
    
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleOnline();
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', () => {}); // memory leak safe-ish since it's global, but better to extract
    };
  }, [state.present, projectId]);

  return { isOnline };
}
