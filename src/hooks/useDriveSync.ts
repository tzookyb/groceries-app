import { useEffect, useRef, useState } from 'react';
import { driveSync, onDriveStatus, scheduleDrivePush, syncNow as driveSyncNow, type DriveStatusKind } from '../services/googleDrive';
import { useGroceryData } from './useGroceryData';
import type { GroceryData } from '../types';

export function useDriveSync(connected: boolean) {
  const { data, replaceData } = useGroceryData();
  const [status, setStatus] = useState<{ msg: string; kind: DriveStatusKind }>({ msg: '', kind: '' });

  const dataRef = useRef(data);
  dataRef.current = data;
  const skipPushRef = useRef(false);

  useEffect(() => {
    onDriveStatus((msg, kind) => setStatus({ msg, kind }));
    return () => onDriveStatus(null);
  }, []);

  const getData = () => dataRef.current;
  const applyRemote = (d: GroceryData) => {
    skipPushRef.current = true;
    replaceData(d);
  };

  // Sync on startup (valid saved token) and whenever a fresh connect happens.
  useEffect(() => {
    if (connected) driveSync(getData, applyRemote);
  }, [connected]);

  // Debounced push on every real local edit — skipped for Drive-applied pulls.
  useEffect(() => {
    if (!connected) return;
    if (skipPushRef.current) { skipPushRef.current = false; return; }
    scheduleDrivePush(getData);
  }, [data.updatedAt, connected]);

  const syncNow = () => driveSyncNow(getData, applyRemote);

  return { status, syncNow };
}
