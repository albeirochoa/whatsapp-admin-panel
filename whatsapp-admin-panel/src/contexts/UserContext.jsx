import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ROLES, PLANS } from '../constants/plans';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};

export const UserProvider = ({ children, firebaseUser }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setUserData(null);
      setLoading(false);
      return;
    }

    loadUserData();
  }, [firebaseUser]);

  const loadUserData = async () => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        // Create new user with default values
        const newUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: ROLES.CLIENT,
          plan: 'free',
          createdAt: new Date().toISOString(),
          subscription: {
            plan: 'free',
            status: 'active',
            startDate: new Date().toISOString(),
            limits: PLANS.FREE.limits
          },
          usage: {
            projects: 0,
            agents: 0,
            monthlyLeads: 0
          }
        };

        await setDoc(userRef, newUser);
        setUserData(newUser);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (updates) => {
    if (!firebaseUser) return;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, updates, { merge: true });
      setUserData({ ...userData, ...updates });
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const isSuperAdmin = () => userData?.role === ROLES.SUPER_ADMIN;
  const isAdmin = () => userData?.role === ROLES.ADMIN;
  const isClient = () => userData?.role === ROLES.CLIENT;

  const value = {
    userData,
    loading,
    updateUserData,
    isSuperAdmin,
    isAdmin,
    isClient,
    reload: loadUserData
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
