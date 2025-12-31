import { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

export const useConversions = (selectedProject) => {
    const [conversions, setConversions] = useState([]);
    const [stats, setStats] = useState({
        totalCount: 0,
        totalValue: 0,
        todayCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedProject?.id) {
            setConversions([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Query de las últimas 50 conversiones
        const q = query(
            collection(db, 'conversions'),
            where('project_id', '==', selectedProject.id),
            orderBy('created_at', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('🔥 Firestore snapshot received:', {
                size: snapshot.size,
                empty: snapshot.empty,
                project_id: selectedProject.id
            });

            const convList = [];
            let totalV = 0;
            let todayC = 0;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            snapshot.forEach((doc) => {
                const data = doc.data();
                console.log('📄 Document:', {
                    id: doc.id,
                    project_id: data.project_id,
                    created_at_type: typeof data.created_at,
                    created_at: data.created_at
                });

                // Manejar diferentes formatos de timestamp
                let dateObj;
                if (data.created_at?.toDate) {
                    // Timestamp nativo de Firestore
                    dateObj = data.created_at.toDate();
                } else if (typeof data.created_at === 'string') {
                    // String ISO desde REST API
                    dateObj = new Date(data.created_at);
                } else if (data.created_at?._seconds) {
                    // Formato de timestamp serializado
                    dateObj = new Date(data.created_at._seconds * 1000);
                } else {
                    // Fallback
                    dateObj = new Date();
                }

                const conv = {
                    id: doc.id,
                    ...data,
                    date: dateObj
                };
                convList.push(conv);

                // Stats
                totalV += Number(data.conversion_value || 0);
                if (conv.date >= today) {
                    todayC++;
                }
            });

            console.log('✅ Processed conversions:', convList.length);
            setConversions(convList);
            setStats({
                totalCount: snapshot.size, // Basado en el límite de la query o snapshot real
                totalValue: totalV,
                todayCount: todayC
            });
            setLoading(false);
        }, (error) => {
            console.error("❌ Error listening to conversions:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedProject?.id]);

    return { conversions, stats, loading };
};
