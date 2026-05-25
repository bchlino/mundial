import React, { useEffect, useMemo, useState } from 'react';
import { arrayUnion, collection, doc, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

interface JoinRequestsAdminProps {
  leagueId: string;
  adminUid: string;
}

interface JoinRequestItem {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

const JoinRequestsAdmin: React.FC<JoinRequestsAdminProps> = ({ leagueId, adminUid }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<JoinRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid || user.uid !== adminUid) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestsQuery = query(
      collection(db, 'leagues', leagueId, 'joinRequests'),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(requestsQuery, (snapshot) => {
      const loaded: JoinRequestItem[] = snapshot.docs.map((requestDoc) => {
        const data = requestDoc.data() as any;
        return {
          id: requestDoc.id,
          uid: data.uid || requestDoc.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          photoURL: data.photoURL ?? null,
          status: data.status || 'pending',
        };
      });

      setRequests(loaded);
      setErrorMessage(null);
      setLoading(false);
    }, (error) => {
      console.error('Join requests snapshot error:', error);
      setErrorMessage('No se pudieron leer las solicitudes de acceso.');
      setLoading(false);
    });

    return () => unsub();
  }, [leagueId, user?.uid, adminUid]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => a.uid.localeCompare(b.uid));
  }, [requests]);

  const handleApprove = async (requestUid: string) => {
    if (!user?.uid || user.uid !== adminUid) return;

    setBusyUid(requestUid);
    setStatusMessage(null);
    setErrorMessage(null);

    const leagueRef = doc(db, 'leagues', leagueId);
    const requestRef = doc(db, 'leagues', leagueId, 'joinRequests', requestUid);

    try {
      await runTransaction(db, async (transaction) => {
        const requestSnap = await transaction.get(requestRef);
        if (!requestSnap.exists()) {
          throw new Error('REQUEST_NOT_FOUND');
        }

        const requestData = requestSnap.data() as any;
        if (requestData.status !== 'pending') {
          return;
        }

        transaction.update(leagueRef, {
          participants: arrayUnion(requestUid),
        });

        transaction.update(requestRef, {
          status: 'approved',
          reviewedBy: user.uid,
          approvedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      setStatusMessage('Usuario aprobado y agregado a la liga.');
    } catch (error) {
      console.error('Error approving join request:', error);
      setErrorMessage('No se pudo aprobar la solicitud.');
    } finally {
      setBusyUid(null);
    }
  };

  const handleReject = async (requestUid: string) => {
    if (!user?.uid || user.uid !== adminUid) return;

    setBusyUid(requestUid);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      await updateDoc(doc(db, 'leagues', leagueId, 'joinRequests', requestUid), {
        status: 'rejected',
        reviewedBy: user.uid,
        rejectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStatusMessage('Solicitud rechazada.');
    } catch (error) {
      console.error('Error rejecting join request:', error);
      setErrorMessage('No se pudo rechazar la solicitud.');
    } finally {
      setBusyUid(null);
    }
  };

  if (!user?.uid || user.uid !== adminUid) {
    return null;
  }

  return (
    <section className="border-4 border-black bg-white p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl md:text-3xl font-serif italic font-black uppercase">Solicitudes de acceso (Join requests)</h2>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Admin only</span>
      </div>

      {loading ? (
        <p className="text-xs font-black uppercase tracking-widest opacity-60">Cargando solicitudes...</p>
      ) : sortedRequests.length === 0 ? (
        <p className="text-xs font-black uppercase tracking-widest opacity-60">No hay solicitudes pendientes.</p>
      ) : (
        <div className="border-2 border-black overflow-x-auto">
          <table className="w-full min-w-190 text-left">
            <thead className="bg-black text-white text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 bg-white">
              {sortedRequests.map((request) => (
                <tr key={request.id} className="hover:bg-[#F5F2ED]">
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">
                    {request.displayName || request.uid}
                  </td>
                  <td className="px-4 py-3 text-xs font-black uppercase tracking-wider">
                    {request.email || 'Sin email'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={busyUid === request.uid}
                        onClick={() => handleApprove(request.uid)}
                        className="px-3 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={busyUid === request.uid}
                        onClick={() => handleReject(request.uid)}
                        className="px-3 py-2 border-2 border-[#FF3E00] text-[#FF3E00] text-[10px] font-black uppercase tracking-widest hover:bg-[#FF3E00] hover:text-white transition-colors disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {statusMessage && <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-green-700">{statusMessage}</p>}
      {errorMessage && <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#FF3E00]">{errorMessage}</p>}
    </section>
  );
};

export default JoinRequestsAdmin;
