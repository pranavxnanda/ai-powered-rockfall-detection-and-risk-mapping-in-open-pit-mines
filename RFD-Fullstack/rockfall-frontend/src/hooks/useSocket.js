import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { io } from 'socket.io-client';
import { addAlert } from '../redux/slices/alertSlice';
import { updateZoneRisk } from '../redux/slices/riskSlice';
import { setConnected } from '../redux/slices/socketSlice';
import { SOCKET_URL } from '../constants';

let socket = null;

const useSocket = (token) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) return;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => dispatch(setConnected(true)));
    socket.on('disconnect', () => dispatch(setConnected(false)));

    socket.on('new_alert', (alert) => {
      // The raw alert from the server has no `acknowledged` field —
      // that's computed per-user in the REST controller. A socket-pushed
      // alert is always unacknowledged for the receiving user at the
      // moment it arrives, so we set it explicitly here to prevent
      // undefined → falsy from re-triggering the siren on stale data.
      dispatch(addAlert({ ...alert, acknowledged: false }));
    });

    socket.on('risk_update', (zone) => {
      dispatch(updateZoneRisk(zone));
    });

    return () => {
      socket.disconnect();
      dispatch(setConnected(false));
    };
  }, [token, dispatch]);
};

export default useSocket;
